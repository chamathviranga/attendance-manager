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
            $weeklyPayrollEst = 0;

            if ($business) {
                $totalEmployees = Employee::where('business_id', $business->id)->count();
                $checkedInCount = Attendance::whereHas('branch', function ($q) use ($business) {
                        $q->where('business_id', $business->id);
                    })
                    ->whereNull('clock_out_at')
                    ->count();

                $startOfWeek = Carbon::now()->startOfWeek();
                $attendancesThisWeek = Attendance::with(['user.employee'])
                    ->whereHas('branch', function ($q) use ($business) {
                        $q->where('business_id', $business->id);
                    })
                    ->where('clock_in_at', '>=', $startOfWeek)
                    ->get();

                foreach ($attendancesThisWeek as $att) {
                    $rate = $att->user->employee->salary ?? 0;
                    $weeklyPayrollEst += (($att->duration_minutes ?? 0) / 60) * $rate;
                }

                $recentAttendances = Attendance::with(['user', 'branch'])
                    ->whereHas('branch', function ($q) use ($business) {
                        $q->where('business_id', $business->id);
                    })
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

            $stats = [
                ['label' => 'TOTAL EMPLOYEES', 'value' => (string) $totalEmployees, 'trend' => 'ALL REGISTERED', 'trendUp' => true],
                ['label' => 'CHECKED IN NOW', 'value' => "{$checkedInCount} / {$totalEmployees}", 'trend' => 'ACTIVE ON SHIFT', 'trendUp' => true],
                ['label' => 'EST. PAYROLL (WEEK)', 'value' => '£' . number_format($weeklyPayrollEst, 2), 'trend' => 'ESTIMATED EARNINGS', 'trendUp' => false],
            ];
        } else {
            $employee = Employee::where('user_id', $user->id)->first();
            $weeklyHours = 0;
            $estEarnings = 0;

            if ($employee) {
                $branches = Branch::where('business_id', $employee->business_id)->where('is_active', true)->get();
                
                $activeAttendance = Attendance::with('branch')
                    ->where('user_id', $user->id)
                    ->whereNull('clock_out_at')
                    ->first();

                $startOfWeek = Carbon::now()->startOfWeek();
                
                $weeklyMinutes = Attendance::where('user_id', $user->id)
                    ->where('clock_in_at', '>=', $startOfWeek)
                    ->sum('duration_minutes') ?? 0;

                $weeklyHours = round($weeklyMinutes / 60, 1);
                $estEarnings = $weeklyHours * ($employee->salary ?? 0);

                $recentAttendances = Attendance::with('branch')
                    ->where('user_id', $user->id)
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

            $stats = [
                ['label' => 'WORKED (WEEK)', 'value' => "{$weeklyHours}h", 'trend' => 'TOTAL HOURS RECORDED', 'trendUp' => true],
                ['label' => 'LEAVE BALANCE', 'value' => '12 DAYS', 'trend' => 'STANDARD ANNUAL', 'trendUp' => true],
                ['label' => 'EST. EARNINGS', 'value' => '£' . number_format($estEarnings, 2), 'trend' => 'ESTIMATED PAY PERIOD', 'trendUp' => true],
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
        ]);
    }
}
