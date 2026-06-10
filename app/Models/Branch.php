<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $table = 'branches';

    protected $fillable = [
        'business_id',
        'name',
        'address',
        'mobile',
        'is_active',
    ];

    // relations
    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
