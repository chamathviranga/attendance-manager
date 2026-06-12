<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Employee;

test('profile page is displayed for shop owner', function () {
    $user = User::factory()->create(['role' => 'SHOP_OWNER']);

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('profile information can be updated by shop owner', function () {
    $user = User::factory()->create(['role' => 'SHOP_OWNER']);

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $user->refresh();

    $this->assertSame('Test User', $user->name);
    $this->assertSame('test@example.com', $user->email);
    $this->assertNull($user->email_verified_at);
});

test('email verification status is unchanged when the email address is unchanged for shop owner', function () {
    $user = User::factory()->create(['role' => 'SHOP_OWNER']);

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertNotNull($user->refresh()->email_verified_at);
});

test('shop owner can delete their account', function () {
    $user = User::factory()->create(['role' => 'SHOP_OWNER']);

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    $this->assertNull($user->fresh());
});

test('correct password must be provided to delete account for shop owner', function () {
    $user = User::factory()->create(['role' => 'SHOP_OWNER']);

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    $this->assertNotNull($user->fresh());
});

test('employee profile page is displayed', function () {
    $user = User::factory()->create(['role' => 'EMPLOYEE']);

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('employee profile page is displayed with employee record', function () {
    $owner = User::factory()->create(['role' => 'SHOP_OWNER']);
    $business = Business::create([
        'user_id' => $owner->id,
        'name' => 'Test Business',
        'address' => '123 Shop St',
    ]);

    $user = User::factory()->create(['role' => 'EMPLOYEE']);
    Employee::create([
        'business_id' => $business->id,
        'user_id' => $user->id,
        'name' => $user->name,
        'mobile' => '07123456789',
        'designation' => 'Staff Member',
        'salary' => 15.00,
        'is_active' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('employee cannot update profile information', function () {
    $user = User::factory()->create(['role' => 'EMPLOYEE']);

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response->assertStatus(403);
});

test('employee cannot update password', function () {
    $user = User::factory()->create(['role' => 'EMPLOYEE']);

    $response = $this
        ->actingAs($user)
        ->put('/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertStatus(403);
});

test('employee cannot delete account', function () {
    $user = User::factory()->create(['role' => 'EMPLOYEE']);

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response->assertStatus(403);
});
