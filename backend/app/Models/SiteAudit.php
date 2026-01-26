<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteAudit extends Model
{
    protected $fillable = [
        'site_id',
        'user_id',
        'audit_type',
        'status',
        'task_id',
        'results',
        'summary',
        'score',
        'pages_crawled',
        'issues_found',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'results' => 'array',
        'summary' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function issues(): HasMany
    {
        return $this->hasMany(AuditIssue::class, 'audit_id');
    }
}
