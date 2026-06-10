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
