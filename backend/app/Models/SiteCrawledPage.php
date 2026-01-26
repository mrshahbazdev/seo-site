<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteCrawledPage extends Model
{
    protected $fillable = [
        'site_id',
        'url',
        'status_code',
        'onpage_score',
        'title',
        'meta',
        'checks',
        'content',
        'content_analysis',
        'analysis_data',
        'page_timing',
        'resource_errors',
        'raw_data'
    ];

    protected $casts = [
        'meta' => 'array',
        'checks' => 'array',
        'content' => 'array',
        'content_analysis' => 'array',
        'analysis_data' => 'array',
        'page_timing' => 'array',
        'resource_errors' => 'array',
        'raw_data' => 'array',
        'onpage_score' => 'decimal:2'
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}
