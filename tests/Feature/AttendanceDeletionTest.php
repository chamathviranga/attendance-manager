<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Attendance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

uses(RefreshDatabase::class);

test('shop owner can soft delete an unpaid shift with a remark', function () {
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
    
    $attendance = Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => Carbon::now()->subHours(8),
        'clock_out_at' => Carbon::now(),
        'duration_minutes' => 480,
        'is_cleared' => false,
    ]);

    $response = $this->actingAs($owner)->delete("/attendance/{$attendance->id}", [
        'remark' => 'Mistake entry',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    // Verify soft deleted
    $this->assertSoftDeleted('attendances', [
        'id' => $attendance->id,
        'delete_remark' => 'Mistake entry',
    ]);
});

test('shop owner cannot delete a cleared shift', function () {
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
    
    $attendance = Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => Carbon::now()->subHours(8),
        'clock_out_at' => Carbon::now(),
        'duration_minutes' => 480,
        'is_cleared' => true, // Cleared/paid
    ]);

    $response = $this->actingAs($owner)->delete("/attendance/{$attendance->id}", [
        'remark' => 'Mistake entry',
    ]);

    $response->assertSessionHasErrors(['error']);
    $this->assertDatabaseHas('attendances', [
        'id' => $attendance->id,
        'deleted_at' => null,
    ]);
});

test('employee cannot delete a shift', function () {
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
    
    $attendance = Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => Carbon::now()->subHours(8),
        'clock_out_at' => Carbon::now(),
        'duration_minutes' => 480,
        'is_cleared' => false,
    ]);

    $response = $this->actingAs($employeeUser)->delete("/attendance/{$attendance->id}", [
        'remark' => 'Mistake entry',
    ]);

    $response->assertStatus(403);
    $this->assertDatabaseHas('attendances', [
        'id' => $attendance->id,
        'deleted_at' => null,
    ]);
});

test('payroll lists unpaid shifts by default when no date range filters are provided', function () {
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
        'user_id' => $employeeUser->id,
        'business_id' => $business->id,
        'name' => 'John Doe',
        'mobile' => '07123456789',
        'designation' => 'Worker',
        'salary' => 10.00,
        'generate_payslip' => true,
        'is_active' => true,
    ]);

    // Unpaid shift
    $unpaidAttendance = Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => Carbon::now()->subDays(10)->subHours(8),
        'clock_out_at' => Carbon::now()->subDays(10),
        'duration_minutes' => 480,
        'is_cleared' => false,
    ]);

    // Paid shift
    $paidAttendance = Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => Carbon::now()->subDays(9)->subHours(8),
        'clock_out_at' => Carbon::now()->subDays(9),
        'duration_minutes' => 480,
        'is_cleared' => true,
    ]);

    // Request payroll index without dates
    $response = $this->actingAs($owner)->get('/payroll');

    $response->assertStatus(200);

    // Verify Inertia data contains only the unpaid attendance
    $inertiaData = $response->original->getData()['page']['props'];
    $employeeSummary = $inertiaData['employeeSummaries'][0];
    
    expect($employeeSummary['shifts_count'])->toBe(1);
    expect($employeeSummary['shifts'][0]['id'])->toBe($unpaidAttendance->id);
});
