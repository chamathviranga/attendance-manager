<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Employee;
use App\Models\Branch;
use App\Models\Attendance;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('shop owner can view dashboard and payroll estimate calculations', function () {
    // 1. Create a shop owner user
    $owner = User::factory()->create([
        'role' => 'SHOP_OWNER',
    ]);

    // 2. Create a Business for this shop owner
    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Test Business',
        'address' => '123 Shop St',
    ]);

    // 3. Create a Branch for this business
    $branch = Branch::create([
        'business_id' => $business->id,
        'name' => 'Main Branch',
        'address' => '123 Shop St',
    ]);

    // 4. Create an employee user
    $employeeUser = User::factory()->create([
        'role' => 'EMPLOYEE',
    ]);

    // 5. Create an Employee model linked to that user
    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Test Employee',
        'mobile' => '07123456789',
        'designation' => 'Staff Member',
        'salary' => 15.00, // hourly rate
        'is_active' => true,
    ]);

    // 6. Create an attendance for this employee in the current week
    $attendance = Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => now()->startOfWeek()->addHours(9),
        'clock_out_at' => now()->startOfWeek()->addHours(17),
        'duration_minutes' => 480, // 8 hours
    ]);

    // 7. Make request to dashboard acting as owner
    $response = $this->actingAs($owner)->get('/dashboard');

    // 8. Assert successful status
    $response->assertOk();
    
    // 9. Assert stats exist and have estimated payroll computed correctly
    $props = $response->original->getData()['page']['props'];
    
    $stats = $props['stats'];
    $this->assertCount(3, $stats);
    $this->assertEquals('TOTAL EMPLOYEES', $stats[0]['label']);
    $this->assertEquals('1', $stats[0]['value']);
    
    $this->assertEquals('CHECKED IN NOW', $stats[1]['label']);
    $this->assertEquals('0 / 1', $stats[1]['value']);
    
    $this->assertEquals('EST. PAYROLL (WEEK)', $stats[2]['label']);
    $this->assertEquals('£120.00', $stats[2]['value']);
});

test('dashboard activities are paginated with a limit of 5', function () {
    $owner = User::factory()->create([
        'role' => 'SHOP_OWNER',
    ]);

    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Test Business',
        'address' => '123 Shop St',
    ]);

    $branch = Branch::create([
        'business_id' => $business->id,
        'name' => 'Main Branch',
        'address' => '123 Shop St',
    ]);

    $employeeUser = User::factory()->create([
        'role' => 'EMPLOYEE',
    ]);

    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Test Employee',
        'mobile' => '07123456789',
        'designation' => 'Staff Member',
        'salary' => 15.00,
        'is_active' => true,
    ]);

    // Create 7 attendance records (so we have 7 activity items)
    for ($i = 0; $i < 7; $i++) {
        Attendance::create([
            'user_id' => $employeeUser->id,
            'branch_id' => $branch->id,
            'clock_in_at' => now()->subDays($i)->setTime(9, 0),
            'clock_out_at' => now()->subDays($i)->setTime(17, 0),
            'duration_minutes' => 480,
        ]);
    }

    $response = $this->actingAs($owner)->get('/dashboard');

    $response->assertOk();
    $props = $response->original->getData()['page']['props'];

    $activities = $props['activities'];

    // Verify it returns paginator structure
    $this->assertArrayHasKey('data', $activities);
    $this->assertArrayHasKey('total', $activities);
    $this->assertArrayHasKey('per_page', $activities);

    // Verify pagination totals
    $this->assertEquals(7, $activities['total']);
    $this->assertEquals(5, $activities['per_page']);
    $this->assertCount(5, $activities['data']); // page 1 has 5 items
});

