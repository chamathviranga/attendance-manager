<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('shop owner can set leave balance when creating an employee', function () {
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
    ]);

    $response->assertRedirect(route('employees.index'));

    $employee = Employee::where('name', 'New Staff')->first();
    $this->assertNotNull($employee);
    $this->assertEquals(20, $employee->leave_balance);
});

test('shop owner can update employee leave balance', function () {
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
    ]);

    $response = $this->actingAs($owner)->put("/employees/{$employee->id}", [
        'name' => 'Old Staff Updated',
        'email' => $employeeUser->email,
        'mobile' => '1234567890',
        'designation' => 'Worker',
        'salary' => 12.50,
        'leave_balance' => 15,
        'is_active' => true,
    ]);

    $response->assertRedirect(route('employees.index'));

    $employee->refresh();
    $this->assertEquals(15, $employee->leave_balance);
});

test('employee dashboard stats displays correct custom leave balance', function () {
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
        'leave_balance' => 25,
        'is_active' => true,
    ]);

    $response = $this->actingAs($employeeUser)->get('/dashboard');

    $response->assertOk();
    $props = $response->original->getData()['page']['props'];
    
    $stats = $props['stats'];
    $this->assertEquals('LEAVE BALANCE', $stats[1]['label']);
    $this->assertEquals('25 DAYS', $stats[1]['value']);
});
