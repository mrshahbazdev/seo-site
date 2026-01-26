<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SitePage extends Model
{
    protected $fillable = [
        'site_id',
        'url',
        'is_crawled',
        'audit_status',
        'audit_task_id',
        'lighthouse_score',
        'lighthouse_data',
        'found_at',
    ];

    protected $casts = [
        'is_crawled' => 'boolean',
        'lighthouse_data' => 'array',
        'analysis_data' => 'array',
        'found_at' => 'datetime',
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
