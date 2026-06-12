<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\ShiftSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ShiftScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->role === 'SHOP_OWNER') {
            $business = Business::where('user_id', $user->id)->first();
            if (!$business) {
                abort(403, 'No associated business found.');
            }

            $schedules = ShiftSchedule::with(['employee', 'branch', 'exchangedWith'])
                ->where('business_id', $business->id)
                ->orderBy('date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            $employees = Employee::where('business_id', $business->id)
                ->where('is_active', true)
                ->get();

            $branches = Branch::where('business_id', $business->id)
                ->where('is_active', true)
                ->get();

            return Inertia::render('Schedules/Index', [
                'schedules' => $schedules,
                'employees' => $employees,
                'branches' => $branches,
                'role' => $user->role,
            ]);
        } elseif ($user->role === 'EMPLOYEE') {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) {
                abort(403, 'Employee profile not found.');
            }

            $schedules = ShiftSchedule::with(['employee', 'branch', 'exchangedWith'])
                ->where('employee_id', $employee->id)
                ->orderBy('date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            return Inertia::render('Schedules/Index', [
                'schedules' => $schedules,
                'role' => $user->role,
            ]);
        }

        abort(403, 'Unauthorized.');
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'SHOP_OWNER') {
            abort(403, 'Unauthorized.');
        }

        $business = Business::where('user_id', $user->id)->first();
        if (!$business) {
            abort(403, 'No associated business found.');
        }

        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'exchanged_with_employee_id' => 'nullable|exists:employees,id',
            'branch_id' => 'required|exists:branches,id',
            'date' => 'required|date',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'status' => 'required|string|in:Scheduled,Absent,On Leave,Exchanged',
            'repeat_type' => 'required|string|in:None,Daily,Weekly,Monthly',
            'repeat_until' => 'nullable|date|after_or_equal:date',
        ]);

        $employee = Employee::findOrFail($data['employee_id']);
        $branch = Branch::findOrFail($data['branch_id']);

        if ($employee->business_id !== $business->id || $branch->business_id !== $business->id) {
            abort(403, 'Invalid employee or branch selection.');
        }

        if (!empty($data['exchanged_with_employee_id'])) {
            $exchanged = Employee::findOrFail($data['exchanged_with_employee_id']);
            if ($exchanged->business_id !== $business->id) {
                abort(403, 'Invalid exchanged employee selection.');
            }
        }

        $startDate = \Carbon\Carbon::parse($data['date']);
        
        // Create first shift
        ShiftSchedule::create([
            'business_id' => $business->id,
            'employee_id' => $data['employee_id'],
            'exchanged_with_employee_id' => $data['exchanged_with_employee_id'] ?? null,
            'branch_id' => $data['branch_id'],
            'date' => $startDate->toDateString(),
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'status' => $data['status'],
        ]);

        // Create recurring shifts if repeat option is selected
        if ($data['repeat_type'] !== 'None' && !empty($data['repeat_until'])) {
            $endDate = \Carbon\Carbon::parse($data['repeat_until']);
            $currentDate = $startDate->copy();
            $limit = 0; // Prevent infinite loops

            while ($limit < 366) {
                $limit++;
                if ($data['repeat_type'] === 'Daily') {
                    $currentDate->addDay();
                } elseif ($data['repeat_type'] === 'Weekly') {
                    $currentDate->addWeek();
                } elseif ($data['repeat_type'] === 'Monthly') {
                    $currentDate->addMonth();
                }

                if ($currentDate->greaterThan($endDate)) {
                    break;
                }

                ShiftSchedule::create([
                    'business_id' => $business->id,
                    'employee_id' => $data['employee_id'],
                    'exchanged_with_employee_id' => $data['exchanged_with_employee_id'] ?? null,
                    'branch_id' => $data['branch_id'],
                    'date' => $currentDate->toDateString(),
                    'start_time' => $data['start_time'],
                    'end_time' => $data['end_time'],
                    'status' => $data['status'],
                ]);
            }
        }

        return redirect()->back()->with('success', 'Shift scheduled successfully!');
    }

    public function update(Request $request, $id): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'SHOP_OWNER') {
            abort(403, 'Unauthorized.');
        }

        $business = Business::where('user_id', $user->id)->first();
        if (!$business) {
            abort(403, 'No associated business found.');
        }

        $schedule = ShiftSchedule::where('id', $id)
            ->where('business_id', $business->id)
            ->firstOrFail();

        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'exchanged_with_employee_id' => 'nullable|exists:employees,id',
            'branch_id' => 'required|exists:branches,id',
            'date' => 'required|date',
            'start_time' => 'required|string',
            'end_time' => 'required|string',
            'status' => 'required|string|in:Scheduled,Absent,On Leave,Exchanged',
        ]);

        $employee = Employee::findOrFail($data['employee_id']);
        $branch = Branch::findOrFail($data['branch_id']);

        if ($employee->business_id !== $business->id || $branch->business_id !== $business->id) {
            abort(403, 'Invalid employee or branch selection.');
        }

        if (!empty($data['exchanged_with_employee_id'])) {
            $exchanged = Employee::findOrFail($data['exchanged_with_employee_id']);
            if ($exchanged->business_id !== $business->id) {
                abort(403, 'Invalid exchanged employee selection.');
            }
        }

        $schedule->update([
            'employee_id' => $data['employee_id'],
            'exchanged_with_employee_id' => $data['exchanged_with_employee_id'] ?? null,
            'branch_id' => $data['branch_id'],
            'date' => $data['date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'status' => $data['status'],
        ]);

        return redirect()->back()->with('success', 'Shift schedule updated successfully!');
    }

    public function destroy(Request $request, $id): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'SHOP_OWNER') {
            abort(403, 'Unauthorized.');
        }

        $business = Business::where('user_id', $user->id)->first();
        if (!$business) {
            abort(403, 'No associated business found.');
        }

        $schedule = ShiftSchedule::where('id', $id)
            ->where('business_id', $business->id)
            ->firstOrFail();

        $schedule->delete();

        return redirect()->back()->with('success', 'Shift schedule deleted successfully!');
    }
}
