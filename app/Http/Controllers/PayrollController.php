<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Business;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class PayrollController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $role = $user->role;

        // Default to current week (Monday to Sunday)
        $startDateStr = $request->query('start_date', Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString());
        $endDateStr = $request->query('end_date', Carbon::now()->endOfWeek(Carbon::SUNDAY)->toDateString());

        $startDate = Carbon::parse($startDateStr)->startOfDay();
        $endDate = Carbon::parse($endDateStr)->endOfDay();

        if ($role === 'EMPLOYEE') {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) {
                abort(403, 'Employee profile not found.');
            }

            $hourlyRate = $employee->salary ?? 0;

            $attendances = Attendance::with('branch')
                ->where('user_id', $user->id)
                ->whereBetween('clock_in_at', [$startDate, $endDate])
                ->orderBy('clock_in_at', 'desc')
                ->get();

            $dailyBreakdown = [];
            foreach ($attendances as $att) {
                $hours = round(($att->duration_minutes ?? 0) / 60, 2);
                $earnings = round($hours * $hourlyRate, 2);

                $dailyBreakdown[] = [
                    'id' => $att->id,
                    'date' => $att->clock_in_at->toDateString(),
                    'branch_name' => $att->branch->name ?? 'Unknown',
                    'hours' => $hours,
                    'earnings' => $earnings,
                    'clock_in' => $att->clock_in_at->format('H:i'),
                    'clock_out' => $att->clock_out_at ? $att->clock_out_at->format('H:i') : 'Active',
                    'is_cleared' => (bool)$att->is_cleared,
                ];
            }

            $weeklyBreakdown = [];
            $groupedByWeek = $attendances->groupBy(function ($att) {
                return $att->clock_in_at->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();
            });

            foreach ($groupedByWeek as $sundayDate => $weekAtts) {
                $weekMinutes = $weekAtts->sum('duration_minutes');
                $weekHours = round($weekMinutes / 60, 2);
                $weekEarnings = round($weekHours * $hourlyRate, 2);
                $mondayDate = Carbon::parse($sundayDate)->startOfWeek(Carbon::MONDAY)->toDateString();

                $allCleared = $weekAtts->every('is_cleared', true);

                if ($allCleared) {
                    $status = 'Cleared';
                } else {
                    $status = Carbon::parse($sundayDate)->endOfDay()->isPast() ? 'Unpaid' : 'Pending';
                }

                $weeklyBreakdown[] = [
                    'week_start' => $mondayDate,
                    'week_end' => $sundayDate,
                    'hours' => $weekHours,
                    'earnings' => $weekEarnings,
                    'status' => $status,
                ];
            }

            return Inertia::render('Payroll/Index', [
                'role' => $role,
                'filters' => [
                    'start_date' => $startDateStr,
                    'end_date' => $endDateStr,
                ],
                'dailyBreakdown' => $dailyBreakdown,
                'weeklyBreakdown' => $weeklyBreakdown,
                'hourlyRate' => $hourlyRate,
            ]);
        } elseif ($role === 'SHOP_OWNER') {
            $business = Business::where('user_id', $user->id)->first();
            $employeeSummaries = [];

            if ($business) {
                $employees = Employee::where('business_id', $business->id)->get();

                foreach ($employees as $emp) {
                    $empRate = $emp->salary ?? 0;

                    $empAtts = Attendance::with('branch')
                        ->where('user_id', $emp->user_id)
                        ->whereBetween('clock_in_at', [$startDate, $endDate])
                        ->orderBy('clock_in_at', 'desc')
                        ->get();

                    $totalMinutes = $empAtts->sum('duration_minutes');
                    $totalHours = round($totalMinutes / 60, 2);
                    $totalEarnings = round($totalHours * $empRate, 2);

                    $clearedEarnings = 0;
                    $owedEarnings = 0;
                    $shifts = [];
                    foreach ($empAtts as $att) {
                        $hours = round(($att->duration_minutes ?? 0) / 60, 2);
                        $earnings = round($hours * $empRate, 2);

                        $shifts[] = [
                            'id' => $att->id,
                            'date' => $att->clock_in_at->toDateString(),
                            'is_sunday' => $att->clock_in_at->isSunday(),
                            'branch_name' => $att->branch->name ?? 'Unknown',
                            'clock_in' => $att->clock_in_at->format('H:i'),
                            'clock_out' => $att->clock_out_at ? $att->clock_out_at->format('H:i') : 'Active',
                            'hours' => $hours,
                            'earnings' => $earnings,
                            'is_cleared' => (bool)$att->is_cleared,
                        ];

                        if ($att->is_cleared) {
                            $clearedEarnings += $earnings;
                        } else {
                            $owedEarnings += $earnings;
                        }
                    }

                    $employeeSummaries[] = [
                        'employee_id' => $emp->id,
                        'name' => $emp->name,
                        'designation' => $emp->designation,
                        'hourly_rate' => $empRate,
                        'total_hours' => $totalHours,
                        'total_earnings' => $totalEarnings,
                        'cleared_earnings' => round($clearedEarnings, 2),
                        'owed_earnings' => round($owedEarnings, 2),
                        'shifts_count' => $empAtts->count(),
                        'shifts' => $shifts,
                    ];
                }
            }

            return Inertia::render('Payroll/Index', [
                'role' => $role,
                'filters' => [
                    'start_date' => $startDateStr,
                    'end_date' => $endDateStr,
                ],
                'employeeSummaries' => $employeeSummaries,
            ]);
        }

        abort(403, 'Unauthorized.');
    }

    public function clear(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'SHOP_OWNER') {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'integer|exists:employees,id',
        ]);

        $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
        $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
        $employeeIds = $request->input('employee_ids');

        $business = Business::where('user_id', $user->id)->first();
        if (!$business) {
            abort(403, 'Business not found.');
        }

        $empUserIds = Employee::whereIn('id', $employeeIds)
            ->where('business_id', $business->id)
            ->pluck('user_id');

        if ($empUserIds->isEmpty()) {
            return back()->with('error', 'No valid employees selected.');
        }

        Attendance::whereBetween('clock_in_at', [$startDate, $endDate])
            ->whereIn('user_id', $empUserIds)
            ->update(['is_cleared' => true]);

        return back()->with('success', 'Payments cleared successfully.');
    }

    public function payslip(Request $request)
    {
        $user = $request->user();
        $employeeId = $request->query('employee_id');
        $startDateStr = $request->query('start_date');
        $endDateStr = $request->query('end_date');

        if (!$employeeId || !$startDateStr || !$endDateStr) {
            abort(400, 'Missing parameters.');
        }

        $startDate = Carbon::parse($startDateStr)->startOfDay();
        $endDate = Carbon::parse($endDateStr)->endOfDay();

        // 1. Fetch Employee (supports primary key ID or user_id)
        $employee = Employee::where('id', $employeeId)
            ->orWhere('user_id', $employeeId)
            ->first();

        if (!$employee) {
            abort(404, 'Employee profile not found.');
        }

        // 2. Auth Check
        if ($user->role === 'EMPLOYEE') {
            if ($employee->user_id !== $user->id) {
                abort(403, 'Unauthorized.');
            }
        } elseif ($user->role === 'SHOP_OWNER') {
            $business = Business::where('user_id', $user->id)->first();
            if (!$business || $employee->business_id !== $business->id) {
                abort(403, 'Unauthorized.');
            }
        } else {
            abort(403, 'Unauthorized.');
        }

        // 3. Fetch Business Details
        $business = Business::find($employee->business_id);
        $businessName = $business ? $business->name : 'Attendance Mark Partner';

        $logoBase64 = null;
        if ($business && $business->getRawOriginal('logo')) {
            $rawLogo = $business->getRawOriginal('logo');
            $fullPath = storage_path('app/public/' . $rawLogo);
            if (file_exists($fullPath)) {
                $type = pathinfo($fullPath, PATHINFO_EXTENSION);
                $data = file_get_contents($fullPath);
                $logoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
            }
        }

        // 4. Fetch Attendances
        $attendances = Attendance::with('branch')
            ->where('user_id', $employee->user_id)
            ->whereBetween('clock_in_at', [$startDate, $endDate])
            ->orderBy('clock_in_at', 'asc')
            ->get();

        $hourlyRate = $employee->salary ?? 0;

        $shifts = [];
        $totalHours = 0;
        $totalEarnings = 0;

        foreach ($attendances as $att) {
            $hours = round(($att->duration_minutes ?? 0) / 60, 2);
            $earnings = round($hours * $hourlyRate, 2);
            
            $totalHours += $hours;
            $totalEarnings += $earnings;

            $shifts[] = [
                'date' => $att->clock_in_at->format('d M Y'),
                'is_sunday' => $att->clock_in_at->isSunday(),
                'branch' => $att->branch->name ?? 'Unknown',
                'clock_in' => $att->clock_in_at->format('H:i'),
                'clock_out' => $att->clock_out_at ? $att->clock_out_at->format('H:i') : 'Active',
                'hours' => $hours,
                'earnings' => $earnings,
                'is_cleared' => (bool)$att->is_cleared,
            ];
        }

        // 5. Generate PDF HTML using Dompdf
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.payslip', [
            'employee' => $employee,
            'businessName' => $businessName,
            'logoBase64' => $logoBase64,
            'startDate' => $startDate->format('d M Y'),
            'endDate' => $endDate->format('d M Y'),
            'shifts' => $shifts,
            'totalHours' => round($totalHours, 2),
            'totalEarnings' => round($totalEarnings, 2),
            'hourlyRate' => number_format($hourlyRate, 2),
        ]);

        return $pdf->stream('payslip-' . str_replace(' ', '-', strtolower($employee->name)) . '-' . $startDate->format('Ymd') . '.pdf');
    }
}
