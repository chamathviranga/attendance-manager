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

        $business = null;
        if ($role === 'SHOP_OWNER') {
            $business = Business::where('user_id', $user->id)->first();
        } else {
            $employee = Employee::where('user_id', $user->id)->first();
            $business = $employee ? $employee->business : null;
        }

        [$defaultStart, $defaultEnd] = $this->getPayrollDateRange($business);

        $hasFilters = $request->filled('start_date') && $request->filled('end_date');

        if ($hasFilters) {
            $startDateStr = $request->query('start_date');
            $endDateStr = $request->query('end_date');
            $startDate = Carbon::parse($startDateStr)->startOfDay();
            $endDate = Carbon::parse($endDateStr)->endOfDay();
        } else {
            $startDateStr = '';
            $endDateStr = '';
            $startDate = null;
            $endDate = null;
        }

        if ($role === 'EMPLOYEE') {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) {
                abort(403, 'Employee profile not found.');
            }

            $hourlyRate = $employee->salary ?? 0;

            $query = Attendance::with('branch')
                ->where('user_id', $user->id);

            if ($hasFilters) {
                $query->whereBetween('clock_in_at', [$startDate, $endDate]);
            } else {
                $query->where('is_cleared', false);
            }

            $attendances = $query->orderBy('clock_in_at', 'desc')->get();

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
            $groupedPeriods = [];

            foreach ($attendances as $att) {
                [$startPeriod, $endPeriod] = $this->getPayrollPeriodForDate($att->clock_in_at, $business);
                $key = $startPeriod->toDateString() . '_' . $endPeriod->toDateString();
                
                if (!isset($groupedPeriods[$key])) {
                    $groupedPeriods[$key] = [
                        'start' => $startPeriod->toDateString(),
                        'end' => $endPeriod->toDateString(),
                        'atts' => collect(),
                    ];
                }
                $groupedPeriods[$key]['atts']->push($att);
            }

            foreach ($groupedPeriods as $period) {
                $periodAtts = $period['atts'];
                $periodHours = 0;
                $periodEarnings = 0;
                foreach ($periodAtts as $att) {
                    $hours = round(($att->duration_minutes ?? 0) / 60, 2);
                    $periodHours += $hours;
                    $periodEarnings += round($hours * $hourlyRate, 2);
                }

                $allCleared = $periodAtts->every('is_cleared', true);

                if ($allCleared) {
                    $status = 'Cleared';
                } else {
                    $status = Carbon::parse($period['end'])->endOfDay()->isPast() ? 'Unpaid' : 'Pending';
                }

                $weeklyBreakdown[] = [
                    'week_start' => $period['start'],
                    'week_end' => $period['end'],
                    'hours' => $periodHours,
                    'earnings' => $periodEarnings,
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
                'payrollCycle' => $business->payroll_cycle ?? 'weekly',
                'payrollPayDay' => $business->payroll_pay_day ?? 'Sunday',
                'generatePayslip' => (bool)($employee->generate_payslip ?? true),
            ]);
        } elseif ($role === 'SHOP_OWNER') {
            $business = Business::where('user_id', $user->id)->first();
            $employeeSummaries = [];

            if ($business) {
                $employees = Employee::where('business_id', $business->id)->get();

                foreach ($employees as $emp) {
                    $empRate = $emp->salary ?? 0;

                    $query = Attendance::with('branch')
                        ->where('user_id', $emp->user_id);

                    if ($hasFilters) {
                        $query->whereBetween('clock_in_at', [$startDate, $endDate]);
                    } else {
                        $query->where('is_cleared', false);
                    }

                    $empAtts = $query->orderBy('clock_in_at', 'desc')->get();

                    $totalHours = 0;
                    $totalEarnings = 0;

                    $clearedEarnings = 0;
                    $owedEarnings = 0;
                    $shifts = [];
                    foreach ($empAtts as $att) {
                        $hours = round(($att->duration_minutes ?? 0) / 60, 2);
                        $earnings = round($hours * $empRate, 2);

                        $totalHours += $hours;
                        $totalEarnings += $earnings;

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
                        'generate_payslip' => (bool)($emp->generate_payslip ?? true),
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
                'payrollCycle' => $business->payroll_cycle ?? 'weekly',
                'payrollPayDay' => $business->payroll_pay_day ?? 'Sunday',
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
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'integer|exists:employees,id',
        ]);

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

        $query = Attendance::whereIn('user_id', $empUserIds);

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
            $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
            $query->whereBetween('clock_in_at', [$startDate, $endDate]);
        } else {
            $query->where('is_cleared', false);
        }

        $query->update(['is_cleared' => true]);

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

        if (!$employee->generate_payslip) {
            abort(403, 'Payslip generation is disabled for this employee.');
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
            'unbranded' => (bool)$employee->unbranded_payslip,
        ]);

        return $pdf->stream('payslip-' . str_replace(' ', '-', strtolower($employee->name)) . '-' . $startDate->format('Ymd') . '.pdf');
    }
}
