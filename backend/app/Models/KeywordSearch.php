<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KeywordSearch extends Model
{
    protected $fillable = [
        'keyword',
        'location_code',
        'language_code',
        'results'
    ];

    protected $casts = [
        'results' => 'array',
        'location_code' => 'integer'
    ];
}
