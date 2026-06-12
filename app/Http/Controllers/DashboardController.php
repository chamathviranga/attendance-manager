<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Employee;
use App\Models\Branch;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $role = $user->role;

        // Date range filters (default to current week)
        $fromDate = $request->input('from_date', Carbon::now()->startOfWeek()->toDateString());
        $toDate = $request->input('to_date', Carbon::now()->endOfWeek()->toDateString());

        $startDateTime = Carbon::parse($fromDate)->startOfDay();
        $endDateTime = Carbon::parse($toDate)->endOfDay();

        $isDefaultWeek = ($fromDate === Carbon::now()->startOfWeek()->toDateString() && $toDate === Carbon::now()->endOfWeek()->toDateString());

        $stats = [];
        $activities = [];
        $branches = [];
        $activeAttendance = null;

        if ($role === 'ADMIN') {
            $stats = [
                ['label' => 'TOTAL BUSINESSES', 'value' => (string) Business::count(), 'trend' => '+2 THIS MONTH', 'trendUp' => true],
                ['label' => 'ACTIVE OWNERS', 'value' => (string) \App\Models\ShopOwner::count(), 'trend' => '+1 THIS MONTH', 'trendUp' => true],
                ['label' => 'SYSTEM STATUS', 'value' => '99.9%', 'trend' => 'OPTIMAL RUNTIME', 'trendUp' => true],
            ];

            $activities = [
                ['date' => 'Today, 10:42 AM', 'event' => 'New Business Registered', 'status' => 'Success', 'statusColor' => 'text-indigo-400 border-indigo-500/50'],
                ['date' => 'Yesterday, 4:15 PM', 'event' => 'System Backup Completed', 'status' => 'Success', 'statusColor' => 'text-indigo-400 border-indigo-500/50'],
            ];
        } elseif ($role === 'SHOP_OWNER') {
            $business = Business::where('user_id', $user->id)->first();
            $totalEmployees = 0;
            $checkedInCount = 0;
            $payrollEst = 0;

            if ($business) {
                $totalEmployees = Employee::where('business_id', $business->id)->count();
                $checkedInCount = Attendance::whereHas('branch', function ($q) use ($business) {
                        $q->where('business_id', $business->id);
                    })
                    ->whereNull('clock_out_at')
                    ->count();

                $attendancesThisPeriod = Attendance::with(['user.employee'])
                    ->whereHas('branch', function ($q) use ($business) {
                        $q->where('business_id', $business->id);
                    })
                    ->whereBetween('clock_in_at', [$startDateTime, $endDateTime])
                    ->get();

                foreach ($attendancesThisPeriod as $att) {
                    $rate = $att->user->employee->salary ?? 0;
                    $payrollEst += (($att->duration_minutes ?? 0) / 60) * $rate;
                }

                $recentAttendances = Attendance::with(['user', 'branch'])
                    ->whereHas('branch', function ($q) use ($business) {
                        $q->where('business_id', $business->id);
                    })
                    ->whereBetween('clock_in_at', [$startDateTime, $endDateTime])
                    ->orderBy('clock_in_at', 'desc')
                    ->get();

                foreach ($recentAttendances as $att) {
                    $time = $att->clock_in_at->format('d M, h:i A');
                    $empName = $att->user->name ?? 'Unknown';
                    $branchName = $att->branch->name ?? 'Unknown';

                    if ($att->clock_out_at) {
                        $activities[] = [
                            'date' => $att->clock_out_at->format('d M, h:i A'),
                            'event' => "{$empName} checked out from {$branchName}",
                            'status' => 'Complete',
                            'statusColor' => 'text-indigo-400 border-indigo-500/50',
                        ];
                    } else {
                        $activities[] = [
                            'date' => $time,
                            'event' => "{$empName} checked in to {$branchName}",
                            'status' => 'Checked In',
                            'statusColor' => 'text-indigo-400 border-indigo-500/50',
                        ];
                    }
                }
            }

            $payrollLabel = $isDefaultWeek ? 'EST. PAYROLL (WEEK)' : 'EST. PAYROLL (PERIOD)';

            $stats = [
                ['label' => 'TOTAL EMPLOYEES', 'value' => (string) $totalEmployees, 'trend' => 'ALL REGISTERED', 'trendUp' => true],
                ['label' => 'CHECKED IN NOW', 'value' => "{$checkedInCount} / {$totalEmployees}", 'trend' => 'ACTIVE ON SHIFT', 'trendUp' => true],
                ['label' => $payrollLabel, 'value' => '£' . number_format($payrollEst, 2), 'trend' => 'ESTIMATED EARNINGS', 'trendUp' => false],
            ];
        } else {
            $employee = Employee::where('user_id', $user->id)->first();
            $periodHours = 0;
            $estEarnings = 0;

            if ($employee) {
                $branches = Branch::where('business_id', $employee->business_id)->where('is_active', true)->get();
                
                $activeAttendance = Attendance::with('branch')
                    ->where('user_id', $user->id)
                    ->whereNull('clock_out_at')
                    ->first();
                
                $periodMinutes = Attendance::where('user_id', $user->id)
                    ->whereBetween('clock_in_at', [$startDateTime, $endDateTime])
                    ->sum('duration_minutes') ?? 0;

                $periodHours = round($periodMinutes / 60, 1);
                $estEarnings = $periodHours * ($employee->salary ?? 0);

                $recentAttendances = Attendance::with('branch')
                    ->where('user_id', $user->id)
                    ->whereBetween('clock_in_at', [$startDateTime, $endDateTime])
                    ->orderBy('clock_in_at', 'desc')
                    ->get();

                foreach ($recentAttendances as $att) {
                    $branchName = $att->branch->name ?? 'Unknown';
                    if ($att->clock_out_at) {
                        $activities[] = [
                            'date' => $att->clock_out_at->format('d M, h:i A'),
                            'event' => "Clocked out from {$branchName}",
                            'status' => 'Complete',
                            'statusColor' => 'text-indigo-400 border-indigo-500/50',
                        ];
                    }

                    $activities[] = [
                        'date' => $att->clock_in_at->format('d M, h:i A'),
                        'event' => "Clocked in to {$branchName}",
                        'status' => 'Checked In',
                        'statusColor' => 'text-indigo-400 border-indigo-500/50',
                    ];
                }
            }

            $hoursLabel = $isDefaultWeek ? 'WORKED (WEEK)' : 'WORKED (PERIOD)';
            $earningsLabel = $isDefaultWeek ? 'EST. EARNINGS' : 'EST. EARNINGS (PERIOD)';

            $leaveBalance = $employee->leave_balance ?? 0;
            $stats = [
                ['label' => $hoursLabel, 'value' => "{$periodHours}h", 'trend' => 'TOTAL HOURS RECORDED', 'trendUp' => true],
                ['label' => 'LEAVE BALANCE', 'value' => "{$leaveBalance} DAYS", 'trend' => 'STANDARD ANNUAL', 'trendUp' => true],
                ['label' => $earningsLabel, 'value' => '£' . number_format($estEarnings, 2), 'trend' => 'ESTIMATED PAY PERIOD', 'trendUp' => true],
            ];
        }

        $perPage = 5;
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $offset = ($currentPage - 1) * $perPage;
        $currentPageItems = array_slice($activities, $offset, $perPage);

        $paginatedActivities = new LengthAwarePaginator(
            $currentPageItems,
            count($activities),
            $perPage,
            $currentPage,
            [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
                'query' => $request->query(),
            ]
        );

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'activities' => $paginatedActivities,
            'branches' => $branches,
            'activeAttendance' => $activeAttendance,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ]
        ]);
    }
}
