<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    ];

    public function audit(): BelongsTo
    {
        return $this->belongsTo(SiteAudit::class, 'audit_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
