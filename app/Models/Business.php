<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Business extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'logo',
        'user_id',
        'address',
        'mobile',
        'status',
        'default_hourly_rate',
    ];

    // relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // branches
    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->user_id) {
                $model->user_id = auth()->id();
            }
        });
    }

    // get logo attribute
    public function getLogoAttribute($value)
    {
        return $value ? asset('storage/' . $value) : null;
    }
}
