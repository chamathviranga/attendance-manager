<?php

test('registration screen redirects to login', function () {
    $response = $this->get('/register');

    $response->assertRedirect(route('login'));
});

test('new users registration is disabled', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertStatus(403);
});
