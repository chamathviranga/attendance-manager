<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeService
{
    public function getEmployeesByBusiness(int|string $businessId): Collection
    {
        return Employee::with(['user', 'documents'])
            ->where('business_id', $businessId)
            ->get();
    }

    public function createEmployee(array $data, int|string $businessId): Employee
    {
        return DB::transaction(function () use ($data, $businessId) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'EMPLOYEE',
                'username' => explode('@', $data['email'])[0] . rand(100, 999),
            ]);

            return Employee::create([
                'business_id' => $businessId,
                'user_id' => $user->id,
                'name' => $data['name'],
                'mobile' => $data['mobile'],
                'designation' => $data['designation'],
                'salary' => $data['salary'] ?? null,
                'leave_balance' => $data['leave_balance'] ?? 12,
                'address' => $data['address'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);
        });
    }

    public function updateEmployee(int|string $id, array $data): Employee
    {
        $employee = Employee::findOrFail($id);

        DB::transaction(function () use ($employee, $data) {
            $employee->update([
                'name' => $data['name'] ?? $employee->name,
                'mobile' => $data['mobile'] ?? $employee->mobile,
                'designation' => $data['designation'] ?? $employee->designation,
                'salary' => $data['salary'] ?? $employee->salary,
                'leave_balance' => $data['leave_balance'] ?? $employee->leave_balance,
                'address' => $data['address'] ?? $employee->address,
                'is_active' => isset($data['is_active']) ? $data['is_active'] : $employee->is_active,
            ]);

            if ($employee->user) {
                $employee->user->update([
                    'name' => $data['name'] ?? $employee->user->name,
                    'email' => $data['email'] ?? $employee->user->email,
                ]);

                if (!empty($data['password'])) {
                    $employee->user->update([
                        'password' => Hash::make($data['password']),
                    ]);
                }
            }
        });

        return $employee;
    }

    public function deleteEmployee(int|string $id): void
    {
        $employee = Employee::findOrFail($id);
        DB::transaction(function () use ($employee) {
            if ($employee->user) {
                $employee->user->delete();
            }
            $employee->delete();
        });
    }
}
