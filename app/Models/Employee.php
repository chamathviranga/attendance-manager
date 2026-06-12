<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'business_id',
        'user_id',
        'name',
        'mobile',
        'designation',
        'salary',
        'leave_balance',
        'address',
        'is_active',
    ];

    // relations
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function documents()
    {
        return $this->hasMany(LegalDocument::class);
    }

}
