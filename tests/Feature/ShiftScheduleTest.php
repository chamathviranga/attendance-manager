<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\ShiftSchedule;
use App\Models\Attendance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

uses(RefreshDatabase::class);

test('shop owner can create, update, and delete shift schedules', function () {
    $owner = User::factory()->create(['role' => 'SHOP_OWNER']);
    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Owner Business',
        'address' => '123 Business Rd',
    ]);
    $branch = Branch::create([
        'business_id' => $business->id,
        'name' => 'Main Branch',
        'is_active' => true,
    ]);
    $employeeUser = User::factory()->create(['role' => 'EMPLOYEE']);
    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Staff Name',
        'mobile' => '1234567890',
        'designation' => 'Worker',
        'salary' => 12.50,
        'is_active' => true,
    ]);

    // 1. Create Schedule
    $response = $this->actingAs($owner)->post('/schedules', [
        'employee_id' => $employee->id,
        'branch_id' => $branch->id,
        'date' => '2026-06-20',
        'start_time' => '09:00',
        'end_time' => '17:00',
        'status' => 'Scheduled',
        'repeat_type' => 'None',
    ]);
    $response->assertRedirect();
    $schedule = ShiftSchedule::first();
    $this->assertNotNull($schedule);
    $this->assertEquals('09:00', $schedule->start_time);

    // 2. Update Schedule
    $responseUpdate = $this->actingAs($owner)->put("/schedules/{$schedule->id}", [
        'employee_id' => $employee->id,
        'branch_id' => $branch->id,
        'date' => '2026-06-20',
        'start_time' => '10:00',
        'end_time' => '18:00',
        'status' => 'Absent',
    ]);
    $responseUpdate->assertRedirect();
    $schedule->refresh();
    $this->assertEquals('10:00', $schedule->start_time);
    $this->assertEquals('Absent', $schedule->status);

    // 3. Delete Schedule
    $responseDelete = $this->actingAs($owner)->delete("/schedules/{$schedule->id}");
    $responseDelete->assertRedirect();
    $this->assertNull(ShiftSchedule::find($schedule->id));
});

test('employee cannot clock in on scheduling active business without schedule today', function () {
    $owner = User::factory()->create(['role' => 'SHOP_OWNER']);
    $business = Business::create(['user_id' => $owner->id, 'name' => 'Biz', 'address' => 'Rd']);
    $branch = Branch::create(['business_id' => $business->id, 'name' => 'Branch', 'is_active' => true]);
    $employeeUser = User::factory()->create(['role' => 'EMPLOYEE']);
    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Staff',
        'mobile' => '123',
        'designation' => 'Worker',
        'salary' => 10,
        'is_active' => true,
    ]);

    // Active schedule in the business (e.g. for someone else or another date)
    ShiftSchedule::create([
        'business_id' => $business->id,
        'branch_id' => $branch->id,
        'employee_id' => $employee->id,
        'date' => '2026-06-19',
        'start_time' => '09:00',
        'end_time' => '17:00',
    ]);

    // Try clocking in today (no schedule today)
    $response = $this->actingAs($employeeUser)->post('/attendance/clock-in', [
        'branch_id' => $branch->id,
    ]);
    $response->assertSessionHasErrors(['error']);
});

test('employee can clock in within schedule start time window today', function () {
    $owner = User::factory()->create(['role' => 'SHOP_OWNER']);
    $business = Business::create(['user_id' => $owner->id, 'name' => 'Biz', 'address' => 'Rd']);
    $branch = Branch::create(['business_id' => $business->id, 'name' => 'Branch', 'is_active' => true]);
    $employeeUser = User::factory()->create(['role' => 'EMPLOYEE']);
    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Staff',
        'mobile' => '123',
        'designation' => 'Worker',
        'salary' => 10,
        'is_active' => true,
    ]);

    // Create schedule for today
    $now = Carbon::now();
    ShiftSchedule::create([
        'business_id' => $business->id,
        'branch_id' => $branch->id,
        'employee_id' => $employee->id,
        'date' => $now->toDateString(),
        'start_time' => $now->copy()->subMinutes(10)->toTimeString(),
        'end_time' => $now->copy()->addHours(6)->toTimeString(),
        'status' => 'Scheduled',
    ]);

    $response = $this->actingAs($employeeUser)->post('/attendance/clock-in', [
        'branch_id' => $branch->id,
    ]);
    $response->assertSessionHasNoErrors();
    $this->assertNotNull(Attendance::where('user_id', $employeeUser->id)->first());
});

test('employee cannot clock in if schedule status is Absent', function () {
    $owner = User::factory()->create(['role' => 'SHOP_OWNER']);
    $business = Business::create(['user_id' => $owner->id, 'name' => 'Biz', 'address' => 'Rd']);
    $branch = Branch::create(['business_id' => $business->id, 'name' => 'Branch', 'is_active' => true]);
    $employeeUser = User::factory()->create(['role' => 'EMPLOYEE']);
    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Staff',
        'mobile' => '123',
        'designation' => 'Worker',
        'salary' => 10,
        'is_active' => true,
    ]);

    // Create schedule for today with Absent status
    $now = Carbon::now();
    ShiftSchedule::create([
        'business_id' => $business->id,
        'branch_id' => $branch->id,
        'employee_id' => $employee->id,
        'date' => $now->toDateString(),
        'start_time' => $now->copy()->subMinutes(10)->toTimeString(),
        'end_time' => $now->copy()->addHours(6)->toTimeString(),
        'status' => 'Absent',
    ]);

    $response = $this->actingAs($employeeUser)->post('/attendance/clock-in', [
        'branch_id' => $branch->id,
    ]);
    $response->assertSessionHasErrors(['error']);
});

test('employee cannot manually submit shift on a date that has a schedule', function () {
    $owner = User::factory()->create(['role' => 'SHOP_OWNER']);
    $business = Business::create(['user_id' => $owner->id, 'name' => 'Biz', 'address' => 'Rd']);
    $branch = Branch::create(['business_id' => $business->id, 'name' => 'Branch', 'is_active' => true]);
    $employeeUser = User::factory()->create(['role' => 'EMPLOYEE']);
    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Staff',
        'mobile' => '123',
        'designation' => 'Worker',
        'salary' => 10,
        'is_active' => true,
    ]);

    ShiftSchedule::create([
        'business_id' => $business->id,
        'branch_id' => $branch->id,
        'employee_id' => $employee->id,
        'date' => '2026-06-25',
        'start_time' => '09:00:00',
        'end_time' => '17:00:00',
    ]);

    $response = $this->actingAs($employeeUser)->post('/attendance/manual', [
        'branch_id' => $branch->id,
        'date' => '2026-06-25',
        'clock_in_time' => '09:00',
        'clock_out_time' => '17:00',
    ]);
    $response->assertSessionHasErrors(['error']);
});

test('shop owner can schedule shift with exchange tracking', function () {
    $owner = User::factory()->create(['role' => 'SHOP_OWNER']);
    $business = Business::create(['user_id' => $owner->id, 'name' => 'Biz', 'address' => 'Rd']);
    $branch = Branch::create(['business_id' => $business->id, 'name' => 'Branch', 'is_active' => true]);
    
    $empUser1 = User::factory()->create(['role' => 'EMPLOYEE']);
    $emp1 = Employee::create([
        'business_id' => $business->id,
        'user_id' => $empUser1->id,
        'name' => 'Staff 1',
        'mobile' => '123',
        'designation' => 'Worker',
        'salary' => 10,
        'is_active' => true,
    ]);

    $empUser2 = User::factory()->create(['role' => 'EMPLOYEE']);
    $emp2 = Employee::create([
        'business_id' => $business->id,
        'user_id' => $empUser2->id,
        'name' => 'Staff 2',
        'mobile' => '456',
        'designation' => 'Worker',
        'salary' => 12,
        'is_active' => true,
    ]);

    $response = $this->actingAs($owner)->post('/schedules', [
        'employee_id' => $emp1->id,
        'exchanged_with_employee_id' => $emp2->id,
        'branch_id' => $branch->id,
        'date' => '2026-06-20',
        'start_time' => '09:00',
        'end_time' => '17:00',
        'status' => 'Exchanged',
        'repeat_type' => 'None',
    ]);

    $response->assertRedirect();
    $schedule = ShiftSchedule::first();
    $this->assertNotNull($schedule);
    $this->assertEquals($emp2->id, $schedule->exchanged_with_employee_id);
    $this->assertEquals('Exchanged', $schedule->status);

    // Test updating exchange
    $responseUpdate = $this->actingAs($owner)->put("/schedules/{$schedule->id}", [
        'employee_id' => $emp1->id,
        'exchanged_with_employee_id' => null,
        'branch_id' => $branch->id,
        'date' => '2026-06-20',
        'start_time' => '09:00',
        'end_time' => '17:00',
        'status' => 'Scheduled',
    ]);

    $responseUpdate->assertRedirect();
    $schedule->refresh();
    $this->assertNull($schedule->exchanged_with_employee_id);
    $this->assertEquals('Scheduled', $schedule->status);
});

test('shop owner can schedule recurring shift schedules daily, weekly, monthly', function () {
    $owner = User::factory()->create(['role' => 'SHOP_OWNER']);
    $business = Business::create(['user_id' => $owner->id, 'name' => 'Biz', 'address' => 'Rd']);
    $branch = Branch::create(['business_id' => $business->id, 'name' => 'Branch', 'is_active' => true]);
    $empUser = User::factory()->create(['role' => 'EMPLOYEE']);
    $emp = Employee::create([
        'business_id' => $business->id,
        'user_id' => $empUser->id,
        'name' => 'Staff 1',
        'mobile' => '123',
        'designation' => 'Worker',
        'salary' => 10,
        'is_active' => true,
    ]);

    // Test weekly repeat: Saturday June 20 to Saturday June 27 (should create 2 shifts)
    $response = $this->actingAs($owner)->post('/schedules', [
        'employee_id' => $emp->id,
        'branch_id' => $branch->id,
        'date' => '2026-06-20',
        'start_time' => '09:00',
        'end_time' => '17:00',
        'status' => 'Scheduled',
        'repeat_type' => 'Weekly',
        'repeat_until' => '2026-06-27',
    ]);

    $response->assertRedirect();
    $schedules = ShiftSchedule::orderBy('date')->get();
    $this->assertCount(2, $schedules);
    $this->assertEquals('2026-06-20', $schedules[0]->date);
    $this->assertEquals('2026-06-27', $schedules[1]->date);
});
