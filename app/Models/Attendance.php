<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $fillable = [
        'user_id',
        'branch_id',
        'clock_in_at',
        'clock_out_at',
        'duration_minutes',
        'is_cleared',
    ];

    protected $casts = [
        'clock_in_at' => 'datetime',
        'clock_out_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    protected function serializeDate(\DateTimeInterface $date)
    {
        return $date->format('c');
    }
}
