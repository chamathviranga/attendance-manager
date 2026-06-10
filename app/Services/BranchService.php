<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;

class BranchService
{
    public function getBranchesByBusiness(int|string $businessId): Collection
    {
        return Branch::where('business_id', $businessId)->get();
    }

    public function createBranch(array $data, int|string $businessId): Branch
    {
        return Branch::create([
            'business_id' => $businessId,
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'mobile' => $data['mobile'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public function updateBranch(int|string $id, array $data): Branch
    {
        $branch = Branch::findOrFail($id);

        $branch->update([
            'name' => $data['name'] ?? $branch->name,
            'address' => $data['address'] ?? $branch->address,
            'mobile' => $data['mobile'] ?? $branch->mobile,
            'is_active' => isset($data['is_active']) ? $data['is_active'] : $branch->is_active,
        ]);

        return $branch;
    }

    public function deleteBranch(int|string $id): void
    {
        $branch = Branch::findOrFail($id);
        $branch->delete();
    }
}
