<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\BusinessService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class BusinessController extends Controller implements HasMiddleware
{
    protected BusinessService $businessService;

    public function __construct(BusinessService $businessService)
    {
        $this->businessService = $businessService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:ADMIN,SHOP_OWNER', except: ['index', 'show']),
        ];
    }

    public function index(): Response
    {
        $businesses = $this->businessService->getAllBusinesses();
        return Inertia::render('Business/Index', [
            'businesses' => $businesses
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'business_name' => 'required|string|max:255',
            'business_mobile' => 'required|string|max:15',
            'business_address' => 'required|string|max:500',
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|max:255|unique:users,email',
            'owner_password' => 'required|string|min:6',
            'owner_mobile' => 'nullable|string|max:15',
            'owner_address' => 'nullable|string|max:500',
        ]);

        $this->businessService->createBusinessWithOwner($data);
        return redirect()->route('businesses.index')->with('success', 'Business and Owner created successfully.');
    }

    public function show(int|string $id): JsonResponse
    {
        $business = $this->businessService->getBusinessById($id);
        return response()->json($business);
    }

    public function update(Request $request, int|string $id): RedirectResponse
    {
        $data = $request->validate([
            'business_name' => 'required|string|max:255',
            'business_mobile' => 'required|string|max:15',
            'business_address' => 'required|string|max:500',
        ]);

        $this->businessService->updateBusiness($id, [
            'name' => $data['business_name'],
            'mobile' => $data['business_mobile'],
            'address' => $data['business_address'],
        ]);
        return redirect()->route('businesses.index')->with('success', 'Business updated successfully.');
    }

    public function destroy(int|string $id): RedirectResponse
    {
        $this->businessService->deleteBusiness($id);
        return redirect()->route('businesses.index')->with('success', 'Business deleted successfully.');
    }
}
