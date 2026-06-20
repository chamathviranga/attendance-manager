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

        $business = null;
        if ($role === 'SHOP_OWNER') {
            $business = Business::where('user_id', $user->id)->first();
        } elseif ($role === 'EMPLOYEE') {
            $employee = Employee::where('user_id', $user->id)->first();
            $business = $employee ? $employee->business : null;
        }

        [$defaultStart, $defaultEnd] = $this->getPayrollDateRange($business);

        // Date range filters (default to current week/period)
        $fromDate = $request->input('from_date', $defaultStart->toDateString());
        $toDate = $request->input('to_date', $defaultEnd->toDateString());

        $startDateTime = Carbon::parse($fromDate)->startOfDay();
        $endDateTime = Carbon::parse($toDate)->endOfDay();

        $isDefaultWeek = ($fromDate === $defaultStart->toDateString() && $toDate === $defaultEnd->toDateString());

        $stats = [];
        $activities = [];
        $branches = [];
        $activeAttendance = null;
        $salaryReport = null;

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
                    $hours = round(($att->duration_minutes ?? 0) / 60, 2);
                    $payrollEst += round($hours * $rate, 2);
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

            $cycle = $business->payroll_cycle ?? 'weekly';
            $payrollLabel = $isDefaultWeek ? ('EST. PAYROLL (' . strtoupper($cycle) . ')') : 'EST. PAYROLL (PERIOD)';

            $stats = [
                ['label' => 'TOTAL EMPLOYEES', 'value' => (string) $totalEmployees, 'trend' => 'ALL REGISTERED', 'trendUp' => true],
                ['label' => 'CHECKED IN NOW', 'value' => "{$checkedInCount} / {$totalEmployees}", 'trend' => 'ACTIVE ON SHIFT', 'trendUp' => true],
                ['label' => $payrollLabel, 'value' => '£' . number_format($payrollEst, 2), 'trend' => 'ESTIMATED EARNINGS', 'trendUp' => false],
            ];

            $branchSpends = [];
            $employeeSpends = [];
            if ($business) {
                $branchesList = Branch::where('business_id', $business->id)->get();
                foreach ($branchesList as $b) {
                    $branchSpends[$b->id] = [
                        'name' => $b->name,
                        'spend' => 0.0,
                    ];
                }

                $employeesList = Employee::where('business_id', $business->id)->get();
                foreach ($employeesList as $emp) {
                    $employeeSpends[$emp->user_id] = [
                        'name' => $emp->name,
                        'spend' => 0.0,
                    ];
                }
            }

            if (isset($attendancesThisPeriod)) {
                foreach ($attendancesThisPeriod as $att) {
                    $rate = $att->user->employee->salary ?? 0;
                    $spend = (($att->duration_minutes ?? 0) / 60) * $rate;
                    if ($att->branch_id && isset($branchSpends[$att->branch_id])) {
                        $branchSpends[$att->branch_id]['spend'] += $spend;
                    }
                    if (isset($employeeSpends[$att->user_id])) {
                        $employeeSpends[$att->user_id]['spend'] += $spend;
                    }
                }
            }

            usort($branchSpends, function ($a, $b) {
                return $b['spend'] <=> $a['spend'];
            });

            usort($employeeSpends, function ($a, $b) {
                return $b['spend'] <=> $a['spend'];
            });

            $salaryReport = [
                'total_business_spend' => round($payrollEst, 2),
                'branch_spends' => array_map(function ($b) {
                    return [
                        'name' => $b['name'],
                        'spend' => round($b['spend'], 2),
                    ];
                }, $branchSpends),
                'employee_spends' => array_map(function ($e) {
                    return [
                        'name' => $e['name'],
                        'spend' => round($e['spend'], 2),
                    ];
                }, $employeeSpends),
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
                
                $recentAttendances = Attendance::with('branch')
                    ->where('user_id', $user->id)
                    ->whereBetween('clock_in_at', [$startDateTime, $endDateTime])
                    ->orderBy('clock_in_at', 'desc')
                    ->get();

                foreach ($recentAttendances as $att) {
                    $hours = round(($att->duration_minutes ?? 0) / 60, 2);
                    $periodHours += $hours;
                }
                $estEarnings = round($periodHours * ($employee->salary ?? 0), 2);

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

            $cycle = ($employee && $employee->business) ? ($employee->business->payroll_cycle ?? 'weekly') : 'weekly';
            $hoursLabel = $isDefaultWeek ? ('WORKED (' . strtoupper($cycle) . ')') : 'WORKED (PERIOD)';
            $earningsLabel = $isDefaultWeek ? ('EST. EARNINGS (' . strtoupper($cycle) . ')') : 'EST. EARNINGS (PERIOD)';

            $leaveBalance = $employee->leave_balance ?? 0;
            $stats = [
                ['label' => $hoursLabel, 'value' => number_format($periodHours, 2) . "h", 'trend' => 'TOTAL HOURS RECORDED', 'trendUp' => true],
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
            ],
            'salaryReport' => $salaryReport,
        ]);
    }
}
