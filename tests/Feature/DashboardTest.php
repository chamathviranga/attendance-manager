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
    
    $this->assertEquals('EST. PAYROLL (WEEKLY)', $stats[2]['label']);
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

    $response = $this->actingAs($owner)->get('/dashboard?from_date=' . now()->subDays(7)->toDateString() . '&to_date=' . now()->toDateString());

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

test('dashboard stats and activities are filtered by custom date range', function () {
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
        'salary' => 10.00,
        'is_active' => true,
    ]);

    // Attendance inside the filtered range (e.g. 2026-06-05)
    Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => '2026-06-05 09:00:00',
        'clock_out_at' => '2026-06-05 17:00:00',
        'duration_minutes' => 480, // 8 hours * 10 = 80
    ]);

    // Attendance outside the filtered range (e.g. 2026-06-15)
    Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => '2026-06-15 09:00:00',
        'clock_out_at' => '2026-06-15 17:00:00',
        'duration_minutes' => 480,
    ]);

    // Request with filter for 2026-06-01 to 2026-06-10
    $response = $this->actingAs($owner)->get('/dashboard?from_date=2026-06-01&to_date=2026-06-10');

    $response->assertOk();
    $props = $response->original->getData()['page']['props'];

    // Stats payroll calculation should only include 2026-06-05
    $stats = $props['stats'];
    $this->assertEquals('EST. PAYROLL (PERIOD)', $stats[2]['label']);
    $this->assertEquals('£80.00', $stats[2]['value']);

    // Activities list should only have 1 item (from 2026-06-05)
    $activities = $props['activities'];
    $this->assertEquals(1, $activities['total']);
    $this->assertCount(1, $activities['data']);
});

test('shop owner dashboard contains business-wise and branch-wise salary reports', function () {
    $owner = User::factory()->create([
        'role' => 'SHOP_OWNER',
    ]);

    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Spend Business',
        'address' => '123 Spend Rd',
    ]);

    $branchA = Branch::create([
        'business_id' => $business->id,
        'name' => 'Branch Alpha',
        'address' => 'Alpha Rd',
    ]);

    $branchB = Branch::create([
        'business_id' => $business->id,
        'name' => 'Branch Beta',
        'address' => 'Beta Rd',
    ]);

    $empUser = User::factory()->create([
        'role' => 'EMPLOYEE',
    ]);

    Employee::create([
        'business_id' => $business->id,
        'user_id' => $empUser->id,
        'name' => 'Salary Worker One',
        'mobile' => '1234567890',
        'designation' => 'Contractor',
        'salary' => 10.00,
        'is_active' => true,
    ]);

    $empUser2 = User::factory()->create([
        'role' => 'EMPLOYEE',
    ]);

    Employee::create([
        'business_id' => $business->id,
        'user_id' => $empUser2->id,
        'name' => 'Salary Worker Two',
        'mobile' => '0987654321',
        'designation' => 'Assistant',
        'salary' => 5.00,
        'is_active' => true,
    ]);

    // Worker One: Attendance at Branch Alpha (8 hours = £80.00)
    Attendance::create([
        'user_id' => $empUser->id,
        'branch_id' => $branchA->id,
        'clock_in_at' => '2026-06-05 09:00:00',
        'clock_out_at' => '2026-06-05 17:00:00',
        'duration_minutes' => 480,
    ]);

    // Worker One: Attendance at Branch Beta (4 hours = £40.00)
    Attendance::create([
        'user_id' => $empUser->id,
        'branch_id' => $branchB->id,
        'clock_in_at' => '2026-06-06 09:00:00',
        'clock_out_at' => '2026-06-06 13:00:00',
        'duration_minutes' => 240,
    ]);

    // Worker Two: Attendance at Branch Alpha (8 hours = £40.00)
    Attendance::create([
        'user_id' => $empUser2->id,
        'branch_id' => $branchA->id,
        'clock_in_at' => '2026-06-05 09:00:00',
        'clock_out_at' => '2026-06-05 17:00:00',
        'duration_minutes' => 480,
    ]);

    $response = $this->actingAs($owner)->get('/dashboard?from_date=2026-06-01&to_date=2026-06-10');

    $response->assertOk();
    $props = $response->original->getData()['page']['props'];

    $this->assertArrayHasKey('salaryReport', $props);
    $report = $props['salaryReport'];

    $this->assertEquals(160.00, $report['total_business_spend']);
    $this->assertCount(2, $report['branch_spends']);
    $this->assertCount(2, $report['employee_spends']);

    // Sorted descending by branch spend
    $this->assertEquals('Branch Alpha', $report['branch_spends'][0]['name']);
    $this->assertEquals(120.00, $report['branch_spends'][0]['spend']);

    $this->assertEquals('Branch Beta', $report['branch_spends'][1]['name']);
    $this->assertEquals(40.00, $report['branch_spends'][1]['spend']);

    // Sorted descending by employee spend
    $this->assertEquals('Salary Worker One', $report['employee_spends'][0]['name']);
    $this->assertEquals(120.00, $report['employee_spends'][0]['spend']);

    $this->assertEquals('Salary Worker Two', $report['employee_spends'][1]['name']);
    $this->assertEquals(40.00, $report['employee_spends'][1]['spend']);
});

test('shop owner can update business payroll configuration', function () {
    $owner = User::factory()->create([
        'role' => 'SHOP_OWNER',
    ]);

    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Config Business',
        'address' => '123 Config Rd',
        'payroll_cycle' => 'weekly',
        'payroll_pay_day' => 'Sunday',
    ]);

    $response = $this->actingAs($owner)->put('/configurations', [
        'name' => 'Updated Business Name',
        'default_hourly_rate' => 12.50,
        'payroll_cycle' => 'monthly',
        'payroll_pay_day' => '10',
    ]);

    $response->assertRedirect(route('configurations.index'));
    
    $business->refresh();
    $this->assertEquals('monthly', $business->payroll_cycle);
    $this->assertEquals('10', $business->payroll_pay_day);
});

test('dashboard filters correctly by dynamic weekly payroll cycle', function () {
    $owner = User::factory()->create([
        'role' => 'SHOP_OWNER',
    ]);

    // Set payroll day to Wednesday
    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Weekly Wednesday Business',
        'payroll_cycle' => 'weekly',
        'payroll_pay_day' => 'Wednesday',
    ]);

    $branch = Branch::create([
        'business_id' => $business->id,
        'name' => 'Main Branch',
    ]);

    $employeeUser = User::factory()->create([
        'role' => 'EMPLOYEE',
    ]);

    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Test Employee',
        'salary' => 10.00,
        'mobile' => '07123456789',
        'designation' => 'Staff Member',
    ]);

    // Let's travel to a known Wednesday
    Carbon\Carbon::setTestNow(Carbon\Carbon::parse('2026-06-10 12:00:00')); // Wednesday

    // Under Wednesday pay day, the current pay period starts on Wednesday 2026-06-10 and ends Tuesday 2026-06-16.
    // Let's create an attendance inside this period (e.g. Wednesday 2026-06-10 14:00 to 18:00 = 4 hours = £40.00)
    Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => '2026-06-10 14:00:00',
        'clock_out_at' => '2026-06-10 18:00:00',
        'duration_minutes' => 240,
    ]);

    // And another attendance outside (e.g. Tuesday 2026-06-09 14:00 to 18:00 - this was in the previous period ending on Tuesday 2026-06-09)
    Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => '2026-06-09 14:00:00',
        'clock_out_at' => '2026-06-09 18:00:00',
        'duration_minutes' => 240,
    ]);

    $response = $this->actingAs($owner)->get('/dashboard');

    $response->assertOk();
    $props = $response->original->getData()['page']['props'];

    $this->assertEquals('2026-06-10', $props['filters']['from_date']);
    $this->assertEquals('2026-06-16', $props['filters']['to_date']);

    $stats = $props['stats'];
    $this->assertEquals('EST. PAYROLL (WEEKLY)', $stats[2]['label']);
    $this->assertEquals('£40.00', $stats[2]['value']);

    Carbon\Carbon::setTestNow(); // Reset time travel
});

test('dashboard filters correctly by dynamic monthly payroll cycle', function () {
    $owner = User::factory()->create([
        'role' => 'SHOP_OWNER',
    ]);

    // Set payroll day to 10th of the month
    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Monthly Business',
        'payroll_cycle' => 'monthly',
        'payroll_pay_day' => '10',
    ]);

    $branch = Branch::create([
        'business_id' => $business->id,
        'name' => 'Main Branch',
    ]);

    $employeeUser = User::factory()->create([
        'role' => 'EMPLOYEE',
    ]);

    $employee = Employee::create([
        'business_id' => $business->id,
        'user_id' => $employeeUser->id,
        'name' => 'Test Employee',
        'salary' => 10.00,
        'mobile' => '07123456789',
        'designation' => 'Staff Member',
    ]);

    // Travel to 2026-06-15.
    // Period containing June 15th is June 10th to July 9th.
    Carbon\Carbon::setTestNow(Carbon\Carbon::parse('2026-06-15 12:00:00'));

    // Shift in period: June 12th (8 hours = £80.00)
    Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => '2026-06-12 09:00:00',
        'clock_out_at' => '2026-06-12 17:00:00',
        'duration_minutes' => 480,
    ]);

    // Shift outside period: June 5th
    Attendance::create([
        'user_id' => $employeeUser->id,
        'branch_id' => $branch->id,
        'clock_in_at' => '2026-06-05 09:00:00',
        'clock_out_at' => '2026-06-05 17:00:00',
        'duration_minutes' => 480,
    ]);

    $response = $this->actingAs($owner)->get('/dashboard');

    $response->assertOk();
    $props = $response->original->getData()['page']['props'];

    $this->assertEquals('2026-06-10', $props['filters']['from_date']);
    $this->assertEquals('2026-07-09', $props['filters']['to_date']);

    $stats = $props['stats'];
    $this->assertEquals('EST. PAYROLL (MONTHLY)', $stats[2]['label']);
    $this->assertEquals('£80.00', $stats[2]['value']);

    Carbon\Carbon::setTestNow(); // Reset time travel
});


