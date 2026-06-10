<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Business;
use App\Models\User;
use App\Models\ShopOwner;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BusinessService
{
    public function __construct()
    {
        //
    }

    public function getAllBusinesses(): Collection
    {
        return Business::with('user')->get();
    }

    public function getBusinessById(int|string $id): Business
    {
        return Business::findOrFail($id);
    }

    public function createBusinessWithOwner(array $data): Business
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'password' => Hash::make($data['owner_password']),
                'role' => 'SHOP_OWNER',
                'username' => explode('@', $data['owner_email'])[0] . rand(100, 999),
            ]);

            ShopOwner::create([
                'user_id' => $user->id,
                'name' => $data['owner_name'],
                'mobile' => $data['owner_mobile'] ?? null,
                'address' => $data['owner_address'] ?? null,
            ]);

            return Business::create([
                'user_id' => $user->id,
                'name' => $data['business_name'],
                'mobile' => $data['business_mobile'],
                'address' => $data['business_address'],
            ]);
        });
    }

    public function updateBusiness(int|string $id, array $data): Business
    {
        $business = $this->getBusinessById($id);
        $business->update($data);
        return $business;
    }

    public function deleteBusiness(int|string $id): void
    {
        $business = $this->getBusinessById($id);
        $business->delete();
    }
}
