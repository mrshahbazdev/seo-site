<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Site extends Model
{
    protected $fillable = [
        'user_id',
        'domain',
        'url',
        'name',
        'status',
        'last_audit_at',
        'audit_frequency',
        'next_audit_at',
        'slack_webhook_url',
        'notifications_enabled',
        'backlinks_data',
        'backlinks_list_data',
        'on_page_task_id',
        'on_page_summary',
    ];

    protected $casts = [
        'last_audit_at' => 'datetime',
        'next_audit_at' => 'datetime',
        'notifications_enabled' => 'boolean',
        'backlinks_data' => 'array',
        'backlinks_list_data' => 'array',
        'on_page_summary' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function audits(): HasMany
    {
        return $this->hasMany(SiteAudit::class);
    }

    public function latestAudit()
    {
        return $this->hasOne(SiteAudit::class)->latestOfMany();
    }

    public function pages(): HasMany
    {
        return $this->hasMany(SitePage::class);
    }
}
