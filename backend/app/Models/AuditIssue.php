<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AuditIssue extends Model
{
    protected $fillable = [
        'audit_id',
        'site_id',
        'category',
        'severity',
        'issue_type',
        'page_url',
        'description',
        'recommendation',
        'status',
        'assigned_to_user_id',
        'assigned_to_name',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function audit(): BelongsTo
    {
        return $this->belongsTo(SiteAudit::class, 'audit_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(AuditIssueComment::class, 'audit_issue_id');
    }
}
