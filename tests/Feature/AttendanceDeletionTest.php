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
