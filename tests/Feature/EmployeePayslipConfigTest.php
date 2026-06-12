<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('shop owner can set tax and payslip configs when creating an employee', function () {
    $owner = User::factory()->create([
        'role' => 'SHOP_OWNER',
    ]);

    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Owner Business',
        'address' => '123 Business Rd',
    ]);

    $response = $this->actingAs($owner)->post('/employees', [
        'name' => 'New Staff',
        'email' => 'staff@example.com',
        'password' => 'secret123',
        'mobile' => '1234567890',
        'designation' => 'Worker',
        'salary' => 12.50,
        'leave_balance' => 20,
        'address' => 'Staff Rd',
        'is_active' => true,
        'is_paying_tax' => false,
        'generate_payslip' => true,
        'unbranded_payslip' => true,
    ]);

    $response->assertRedirect(route('employees.index'));

    $employee = Employee::where('name', 'New Staff')->first();
    $this->assertNotNull($employee);
    $this->assertFalse((bool)$employee->is_paying_tax);
    $this->assertTrue((bool)$employee->generate_payslip);
    $this->assertTrue((bool)$employee->unbranded_payslip);
});

test('shop owner can update employee tax and payslip configs', function () {
    $owner = User::factory()->create([
        'role' => 'SHOP_OWNER',
    ]);

    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Owner Business',
        'address' => '123 Business Rd',
    ]);

    $employeeUser = User::factory()->create([
        'role' => 'EMPLOYEE',
    ]);

    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Old Staff',
        'mobile' => '1234567890',
        'designation' => 'Worker',
        'salary' => 12.50,
        'leave_balance' => 12,
        'is_active' => true,
        'is_paying_tax' => true,
        'generate_payslip' => true,
        'unbranded_payslip' => false,
    ]);

    $response = $this->actingAs($owner)->put("/employees/{$employee->id}", [
        'name' => 'Old Staff Updated',
        'email' => $employeeUser->email,
        'mobile' => '1234567890',
        'designation' => 'Worker',
        'salary' => 12.50,
        'leave_balance' => 12,
        'is_active' => true,
        'is_paying_tax' => false,
        'generate_payslip' => false,
        'unbranded_payslip' => true,
    ]);

    $response->assertRedirect(route('employees.index'));

    $employee->refresh();
    $this->assertFalse((bool)$employee->is_paying_tax);
    $this->assertFalse((bool)$employee->generate_payslip);
    $this->assertTrue((bool)$employee->unbranded_payslip);
});

test('payslip generation fails if generate_payslip is disabled', function () {
    $owner = User::factory()->create([
        'role' => 'SHOP_OWNER',
    ]);

    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Owner Business',
        'address' => '123 Business Rd',
    ]);

    $employeeUser = User::factory()->create([
        'role' => 'EMPLOYEE',
    ]);

    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Staff No Payslip',
        'mobile' => '1234567890',
        'designation' => 'Worker',
        'salary' => 12.50,
        'is_active' => true,
        'generate_payslip' => false,
    ]);

    $response = $this->actingAs($employeeUser)->get(route('payroll.payslip', [
        'employee_id' => $employee->id,
        'start_date' => '2026-06-01',
        'end_date' => '2026-06-07',
    ]));

    $response->assertStatus(403);
});
