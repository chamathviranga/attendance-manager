<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ConfigurationController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('role:SHOP_OWNER'),
        ];
    }

    public function index(Request $request): Response
    {
        $business = Business::where('user_id', $request->user()->id)->firstOrFail();

        return Inertia::render('Configurations/Index', [
            'business' => $business,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $business = Business::where('user_id', $request->user()->id)->firstOrFail();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'default_hourly_rate' => 'required|numeric|min:0',
            'apply_to_all_employees' => 'nullable|boolean',
            'logo' => 'nullable|image|max:2048',
        ]);

        $updateData = [
            'name' => $data['name'],
            'mobile' => $data['mobile'],
            'address' => $data['address'],
            'default_hourly_rate' => $data['default_hourly_rate'],
        ];

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($business->getRawOriginal('logo')) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($business->getRawOriginal('logo'));
            }
            $path = $request->file('logo')->store('logos', 'public');
            $updateData['logo'] = $path;
        }

        $business->update($updateData);

        if ($request->boolean('apply_to_all_employees')) {
            \App\Models\Employee::where('business_id', $business->id)->update([
                'salary' => $data['default_hourly_rate'],
            ]);
        }

        return redirect()->route('configurations.index')->with('success', 'Configuration updated successfully.');
    }
}
