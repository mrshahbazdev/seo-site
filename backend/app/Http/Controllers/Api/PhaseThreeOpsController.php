<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\SiteAudit;
use Illuminate\Http\Request;

class PhaseThreeOpsController extends Controller
{
    public function alerts(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);

        $alerts = $site->alerts()
            ->latest()
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $alerts,
        ]);
    }

    public function markAlertRead(Request $request, $siteId, $alertId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $alert = $site->alerts()->findOrFail($alertId);
        $alert->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => $alert,
        ]);
    }

    public function roiSummary(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);

        $audits = $site->audits()
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->limit(12)
            ->get(['id', 'score', 'issues_found', 'created_at']);

        $latest = $audits->first();
        $oldest = $audits->last();

        $scoreImprovement = $latest && $oldest
            ? round(((float) $latest->score) - ((float) $oldest->score), 2)
            : 0;

        $fixedIssues = \App\Models\AuditIssue::query()
            ->where('site_id', $site->id)
            ->where('status', 'fixed')
            ->count();

        $openIssues = \App\Models\AuditIssue::query()
            ->where('site_id', $site->id)
            ->where('status', 'open')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'score_improvement' => $scoreImprovement,
                'fixed_issues' => $fixedIssues,
                'open_issues' => $openIssues,
                'completed_audits' => $audits->count(),
                'history' => $audits->reverse()->values(),
            ],
        ]);
    }

    public function assignIssue(Request $request, $auditId, $issueId)
    {
        $audit = SiteAudit::where('user_id', $request->user()->id)->findOrFail($auditId);
        $issue = $audit->issues()->findOrFail($issueId);

        $validated = $request->validate([
            'assigned_to_name' => 'nullable|string|max:120',
            'assigned_to_user_id' => 'nullable|integer|exists:users,id',
        ]);

        $issue->update($validated);

        return response()->json([
            'success' => true,
            'data' => $issue->fresh(),
        ]);
    }

    public function addIssueComment(Request $request, $auditId, $issueId)
    {
        $audit = SiteAudit::where('user_id', $request->user()->id)->findOrFail($auditId);
        $issue = $audit->issues()->findOrFail($issueId);

        $validated = $request->validate([
            'comment' => 'required|string|min:1|max:2000',
        ]);

        $comment = $issue->comments()->create([
            'user_id' => $request->user()->id,
            'author_name' => $request->user()->name,
            'comment' => $validated['comment'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $comment,
        ]);
    }

    public function issueComments(Request $request, $auditId, $issueId)
    {
        $audit = SiteAudit::where('user_id', $request->user()->id)->findOrFail($auditId);
        $issue = $audit->issues()->findOrFail($issueId);

        $comments = $issue->comments()->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }
}

