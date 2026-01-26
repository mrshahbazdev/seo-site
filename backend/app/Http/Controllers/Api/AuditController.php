<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\SiteAudit;
use App\Services\OnPageAuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditController extends Controller
{
    protected $auditService;

    public function __construct(OnPageAuditService $auditService)
    {
        $this->auditService = $auditService;
    }

    /**
     * Start new audit
     */
    public function start(Request $request, $siteId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $site = $user->sites()->findOrFail($siteId);

        $validated = $request->validate([
            'audit_type' => 'required|in:full_crawl,lighthouse,duplicate_content,indexation',
            'max_pages' => 'sometimes|integer|min:10|max:1000',
        ]);

        // Create audit record
        $audit = $site->audits()->create([
            'user_id' => $user->id,
            'audit_type' => $validated['audit_type'],
            'status' => 'processing',
            'started_at' => now(),
        ]);

        try {
            $auditService = $this->auditService;

            if ($validated['audit_type'] === 'lighthouse') {
                // Start async task
                $taskId = $auditService->startLighthouseAudit($site->url);

                $audit->update([
                    'task_id' => $taskId,
                    'status' => 'processing',
                    'summary' => [
                        'type' => $validated['audit_type'],
                        'message' => 'Audit started (processing in background)'
                    ]
                ]);
            } else {
                // For other audit types, use mock data for now
                $audit->update([
                    'status' => 'completed',
                    'score' => rand(60, 95),
                    'pages_crawled' => rand(10, 100),
                    'issues_found' => rand(5, 25),
                    'completed_at' => now(),
                    'summary' => [
                        'type' => $validated['audit_type'],
                        'message' => 'Audit completed (demo mode - real API coming soon)'
                    ]
                ]);

                // Create sample issues for non-lighthouse audits
                $issueTypes = [
                    ['type' => 'missing_meta_description', 'category' => 'seo', 'severity' => 'medium', 'desc' => 'Page is missing meta description'],
                    ['type' => 'slow_page', 'category' => 'performance', 'severity' => 'high', 'desc' => 'Page load time exceeds 3 seconds'],
                    ['type' => 'broken_link', 'category' => 'technical', 'severity' => 'critical', 'desc' => 'Broken internal link found'],
                ];

                foreach (array_slice($issueTypes, 0, rand(2, 3)) as $issueType) {
                    $audit->issues()->create([
                        'site_id' => $site->id,
                        'category' => $issueType['category'],
                        'severity' => $issueType['severity'],
                        'issue_type' => $issueType['type'],
                        'page_url' => $site->url,
                        'description' => $issueType['desc'],
                        'recommendation' => 'Fix this issue to improve your site health',
                        'status' => 'open'
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'audit' => $audit->fresh()->load('issues'),
                'message' => 'Audit completed successfully',
            ]);

        } catch (\Exception $e) {
            $audit->update([
                'status' => 'failed',
                'summary' => ['error' => $e->getMessage()],
                'completed_at' => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Audit failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Start full site crawl
     */
    public function fullCrawl(Request $request, $siteId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $site = $user->sites()->findOrFail($siteId);

        // Dispatch async job for crawling
        \App\Jobs\StartFullCrawlJob::dispatch($site);

        return response()->json([
            'success' => true,
            'message' => 'Site crawl started successfully in background.',
        ]);
    }

    /**
     * List site audits
     */
    public function index(Request $request, $siteId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $site = $user->sites()->findOrFail($siteId);

        // Lazy Update: Check for processing audits and update if done
        $processingAudits = $site->audits()
            ->where('status', 'processing')
            ->whereNotNull('task_id')
            ->get();

        if ($processingAudits->isNotEmpty()) {
            foreach ($processingAudits as $audit) {
                $this->checkAndUpdateAudit($audit);
            }
        }

        $audits = $site->audits()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'audits' => $audits,
        ]);
    }

    /**
     * Get audit details
     */
    public function show($auditId)
    {
        $audit = SiteAudit::where('user_id', Auth::id())
            ->with(['site', 'issues'])
            ->findOrFail($auditId);

        $this->checkAndUpdateAudit($audit);

        return response()->json([
            'success' => true,
            'audit' => $audit,
        ]);
    }

    /**
     * Get audit issues
     */
    public function issues($auditId)
    {
        $audit = SiteAudit::where('user_id', Auth::id())->findOrFail($auditId);

        $this->checkAndUpdateAudit($audit);

        $issues = $audit->issues()
            ->orderBy('severity', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'issues' => $issues,
        ]);
    }

    /**
     * Update issue status
     */
    public function updateIssueStatus(Request $request, $auditId, $issueId)
    {
        $audit = SiteAudit::where('user_id', Auth::id())->findOrFail($auditId);

        $issue = $audit->issues()->findOrFail($issueId);

        $validated = $request->validate([
            'status' => 'required|in:open,fixed,ignored',
        ]);

        $issue->update($validated);

        return response()->json([
            'success' => true,
            'issue' => $issue,
            'message' => 'Issue status updated',
        ]);
    }
    /**
     * Helper to check and update audit status
     */
    private function checkAndUpdateAudit(SiteAudit $audit)
    {
        if ($audit->status === 'processing' && $audit->task_id) {
            try {
                $auditService = $this->auditService;

                if ($audit->audit_type === 'lighthouse') {
                    $result = $auditService->fetchLighthouseResults($audit->task_id);

                    if ($result) {
                        $issues = $auditService->extractIssues($result, 'lighthouse');
                        $healthScore = $auditService->calculateHealthScore($issues);

                        $audit->update([
                            'status' => 'completed',
                            'results' => $result,
                            'score' => $healthScore,
                            'pages_crawled' => 1,
                            'issues_found' => count($issues),
                            'completed_at' => now(),
                            'summary' => [
                                'type' => 'lighthouse',
                                'message' => 'Lighthouse audit completed successfully'
                            ]
                        ]);

                        foreach ($issues as $issue) {
                            $audit->issues()->create([
                                'site_id' => $audit->site_id, // Fixed: use relation
                                'category' => $issue['category'],
                                'severity' => $issue['severity'],
                                'issue_type' => $issue['type'],
                                'page_url' => $issue['page_url'] ?? $audit->site->url,
                                'description' => $issue['description'],
                                'recommendation' => $issue['recommendation'] ?? 'Review',
                                'status' => 'open'
                            ]);
                        }
                    }
                }
            } catch (\Exception $e) {
                \Log::error("Failed to update audit {$audit->id}: " . $e->getMessage());
            }
        }
    }
}
