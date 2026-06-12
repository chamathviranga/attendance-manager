<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function clockIn(Request $request): RedirectResponse
    {
        $user = $request->user();
        
        if ($user->role !== 'EMPLOYEE') {
            abort(403, 'Only employees can clock in.');
        }

        $data = $request->validate([
            'branch_id' => 'required|exists:branches,id',
        ]);

        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            abort(403, 'Employee profile not found.');
        }

        $branch = Branch::findOrFail($data['branch_id']);
        if ($branch->business_id != $employee->business_id || !$branch->is_active) {
            abort(403, 'Invalid or inactive branch.');
        }

        $active = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out_at')
            ->first();

        if ($active) {
            return redirect()->back()->withErrors(['error' => 'You are already clocked in.']);
        }

        // Enforce scheduling rules if scheduling is active for this business
        $schedulingActive = \App\Models\ShiftSchedule::where('business_id', $employee->business_id)->exists();
        if ($schedulingActive) {
            $today = Carbon::today()->toDateString();
            $schedule = \App\Models\ShiftSchedule::where('employee_id', $employee->id)
                ->where('date', $today)
                ->first();

            if (!$schedule) {
                return redirect()->back()->withErrors(['error' => 'You are not scheduled to work today.']);
            }

            if ($schedule->status !== 'Scheduled') {
                return redirect()->back()->withErrors(['error' => "You cannot clock in. Your shift status is: {$schedule->status}."]);
            }

            $now = Carbon::now();
            $startTime = Carbon::parse($today . ' ' . $schedule->start_time)->subMinutes(30);
            $endTime = Carbon::parse($today . ' ' . $schedule->end_time);

            if ($endTime->lessThanOrEqualTo($startTime)) {
                $endTime->addDay();
            }

            if ($now->lessThan($startTime)) {
                return redirect()->back()->withErrors(['error' => 'It is too early to clock in. Your shift starts at ' . Carbon::parse($schedule->start_time)->format('H:i')]);
            }

            if ($now->greaterThan($endTime)) {
                return redirect()->back()->withErrors(['error' => 'Your scheduled shift has already ended at ' . Carbon::parse($schedule->end_time)->format('H:i')]);
            }
        }

        Attendance::create([
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'clock_in_at' => Carbon::now(),
        ]);

        return redirect()->back()->with('success', 'Clocked in successfully!');
    }

    public function clockOut(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->role !== 'EMPLOYEE') {
            abort(403, 'Only employees can clock out.');
        }

        $active = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out_at')
            ->first();

        if (!$active) {
            return redirect()->back()->withErrors(['error' => 'You are not clocked in.']);
        }

        $now = Carbon::now();
        $duration = $active->clock_in_at->diffInMinutes($now);

        $active->update([
            'clock_out_at' => $now,
            'duration_minutes' => $duration,
        ]);

        return redirect()->back()->with('success', 'Clocked out successfully!');
    }

    public function storeManual(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->role !== 'EMPLOYEE') {
            abort(403, 'Only employees can add manual entries.');
        }

        $data = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'date' => 'required|date',
            'clock_in_time' => 'required|string',
            'clock_out_time' => 'required|string',
        ]);

        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            abort(403, 'Employee profile not found.');
        }

        $branch = Branch::findOrFail($data['branch_id']);
        if ($branch->business_id != $employee->business_id || !$branch->is_active) {
            abort(403, 'Invalid or inactive branch.');
        }

        // Block manual entry if scheduling is active and a schedule exists for this date
        $schedulingActive = \App\Models\ShiftSchedule::where('business_id', $employee->business_id)->exists();
        if ($schedulingActive) {
            $hasSchedule = \App\Models\ShiftSchedule::where('employee_id', $employee->id)
                ->where('date', $data['date'])
                ->exists();

            if ($hasSchedule) {
                return redirect()->back()->withErrors(['error' => 'You cannot enter a manual shift for this date because it is already scheduled. Please contact your shop owner.']);
            }
        }

        $clockIn = Carbon::parse($data['date'] . ' ' . $data['clock_in_time']);
        $clockOut = Carbon::parse($data['date'] . ' ' . $data['clock_out_time']);

        if ($clockOut->lessThanOrEqualTo($clockIn)) {
            $clockOut->addDay();
        }

        $duration = $clockIn->diffInMinutes($clockOut);

        Attendance::create([
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'clock_in_at' => $clockIn,
            'clock_out_at' => $clockOut,
            'duration_minutes' => $duration,
        ]);

        return redirect()->back()->with('success', 'Manual shift entry saved successfully!');
    }
}
