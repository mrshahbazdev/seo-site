<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditIssueComment extends Model
{
    protected $fillable = [
        'audit_issue_id',
        'user_id',
        'author_name',
        'comment',
    ];

    public function issue(): BelongsTo
    {
        return $this->belongsTo(AuditIssue::class, 'audit_issue_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

