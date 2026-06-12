<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Employee;
use App\Services\EmployeeService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller implements HasMiddleware
{
    protected EmployeeService $employeeService;

    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:ADMIN,SHOP_OWNER'),
        ];
    }

    public function index(Request $request): Response
    {
        $businessId = $request->user()->role === 'ADMIN'
            ? $request->input('business_id')
            : Business::where('user_id', $request->user()->id)->value('id');

        $employees = $businessId ? $this->employeeService->getEmployeesByBusiness($businessId) : collect();
        $defaultHourlyRate = $businessId ? Business::where('id', $businessId)->value('default_hourly_rate') : '10.00';

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'businessId' => $businessId,
            'defaultHourlyRate' => $defaultHourlyRate
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $businessId = $request->user()->role === 'ADMIN'
            ? $request->input('business_id')
            : Business::where('user_id', $request->user()->id)->value('id');

        if (!$businessId) {
            abort(403, 'No associated business found.');
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'mobile' => 'required|string|max:15',
            'designation' => 'required|string|max:255',
            'salary' => 'nullable|numeric|min:0',
            'leave_balance' => 'nullable|integer|min:0',
            'address' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $this->employeeService->createEmployee($data, $businessId);

        return redirect()->route('employees.index')->with('success', 'Employee created successfully.');
    }

    public function update(Request $request, int|string $id): RedirectResponse
    {
        $employee = Employee::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $employee->user_id,
            'password' => 'nullable|string|min:6',
            'mobile' => 'required|string|max:15',
            'designation' => 'required|string|max:255',
            'salary' => 'nullable|numeric|min:0',
            'leave_balance' => 'nullable|integer|min:0',
            'address' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $this->employeeService->updateEmployee($id, $data);

        return redirect()->route('employees.index')->with('success', 'Employee updated successfully.');
    }

    public function destroy(int|string $id): RedirectResponse
    {
        $this->employeeService->deleteEmployee($id);

        return redirect()->route('employees.index')->with('success', 'Employee deleted successfully.');
    }
}
