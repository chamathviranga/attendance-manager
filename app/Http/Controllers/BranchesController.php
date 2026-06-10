<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Business;
use App\Services\BranchService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BranchesController extends Controller implements HasMiddleware
{
    protected BranchService $branchService;

    public function __construct(BranchService $branchService)
    {
        $this->branchService = $branchService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:ADMIN,SHOP_OWNER'),
        ];
    }

    public function index(Request $request): Response
    {
        $businessId = $request->user()->role === 'ADMIN'
            ? $request->input('business_id')
            : Business::where('user_id', $request->user()->id)->value('id');

        $branches = $businessId ? $this->branchService->getBranchesByBusiness($businessId) : collect();

        return Inertia::render('Branches/Index', [
            'branches' => $branches,
            'businessId' => $businessId
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $businessId = $request->user()->role === 'ADMIN'
            ? $request->input('business_id')
            : Business::where('user_id', $request->user()->id)->value('id');

        if (!$businessId) {
            abort(403, 'No associated business found.');
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'mobile' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        $this->branchService->createBranch($data, $businessId);

        return redirect()->route('branches.index')->with('success', 'Branch created successfully.');
    }

    public function update(Request $request, int|string $id): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'mobile' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        $this->branchService->updateBranch($id, $data);

        return redirect()->route('branches.index')->with('success', 'Branch updated successfully.');
    }

    public function destroy(int|string $id): RedirectResponse
    {
        $this->branchService->deleteBranch($id);

        return redirect()->route('branches.index')->with('success', 'Branch deleted successfully.');
    }
}
