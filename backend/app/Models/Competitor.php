<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Competitor extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_id',
        'domain',
        'name',
        'metrics_data',
        'last_analyzed',
        'anchor_texts_data',
        'anchor_texts_analyzed'
    ];

    protected $casts = [
        'metrics_data' => 'array',
        'anchor_texts_data' => 'array',
        'last_analyzed' => 'datetime',
        'anchor_texts_analyzed' => 'datetime'
    ];

    // Relationship to Site
    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
