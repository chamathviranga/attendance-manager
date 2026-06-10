<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'business_id',
        'title',
        'content',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function completions()
    {
        return $this->hasMany(LessonCompletion::class);
    }
}
