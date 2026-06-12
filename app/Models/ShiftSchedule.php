<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftSchedule extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'employee_id',
        'exchanged_with_employee_id',
        'date',
        'start_time',
        'end_time',
        'status',
    ];



    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function exchangedWith()
    {
        return $this->belongsTo(Employee::class, 'exchanged_with_employee_id');
    }
}
