<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteCrawledPage;
use Illuminate\Http\Request;

class PhaseTwoInsightsController extends Controller
{
    public function cannibalization(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $keyword = trim((string) $request->query('keyword', ''));

        if ($keyword === '') {
            return response()->json([
                'success' => false,
                'message' => 'keyword query parameter is required',
            ], 422);
        }

        $needle = mb_strtolower($keyword);

        $pages = SiteCrawledPage::query()
            ->where('site_id', $site->id)
            ->where(function ($q) use ($keyword) {
                $q->where('title', 'like', '%' . $keyword . '%')
                    ->orWhere('url', 'like', '%' . $keyword . '%')
                    ->orWhere('meta', 'like', '%' . $keyword . '%')
                    ->orWhere('content', 'like', '%' . $keyword . '%');
            })
            ->get(['id', 'url', 'title', 'meta', 'content', 'onpage_score', 'checks']);

        $candidates = $pages->map(function (SiteCrawledPage $page) use ($needle) {
            $title = mb_strtolower((string) ($page->title ?? ''));
            $desc = mb_strtolower((string) ($page->meta['description'] ?? ''));
            $plain = mb_strtolower((string) ($page->content['plain_text'] ?? ''));

            $titleMatch = $title !== '' && str_contains($title, $needle);
            $descMatch = $desc !== '' && str_contains($desc, $needle);
            $contentMatch = $plain !== '' && str_contains($plain, $needle);
            $score = ($titleMatch ? 3 : 0) + ($descMatch ? 2 : 0) + ($contentMatch ? 1 : 0);

            return [
                'id' => $page->id,
                'url' => $page->url,
                'title' => $page->title,
                'description' => $page->meta['description'] ?? '',
                'onpage_score' => (float) ($page->onpage_score ?? 0),
                'match_strength' => $score,
                'match_in' => [
                    'title' => $titleMatch,
                    'description' => $descMatch,
                    'content' => $contentMatch,
                ],
            ];
        })
            ->filter(fn ($p) => $p['match_strength'] > 0)
            ->sortByDesc('match_strength')
            ->values();

        $risk = $candidates->count() >= 3 ? 'high' : ($candidates->count() === 2 ? 'medium' : 'low');

        return response()->json([
            'success' => true,
            'data' => [
                'keyword' => $keyword,
                'risk' => $risk,
                'pages_count' => $candidates->count(),
                'pages' => $candidates,
                'recommendation' => $this->cannibalizationRecommendation($candidates->count()),
            ],
        ]);
    }

    public function internalLinking(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $limit = max(1, min(25, (int) $request->query('limit', 10)));

        $pages = SiteCrawledPage::query()
            ->where('site_id', $site->id)
            ->get(['id', 'url', 'title', 'meta', 'checks', 'onpage_score']);

        $targets = $pages->filter(function (SiteCrawledPage $p) {
            $inbound = (int) ($p->meta['inbound_links_count'] ?? 0);
            $orphan = (bool) ($p->checks['is_orphan_page'] ?? false);
            return $orphan || $inbound <= 1;
        });

        $sources = $pages
            ->filter(fn (SiteCrawledPage $p) => (int) ($p->meta['internal_links_count'] ?? 0) >= 8)
            ->sortByDesc(fn (SiteCrawledPage $p) => (int) ($p->meta['internal_links_count'] ?? 0))
            ->values();

        $suggestions = collect();
        foreach ($targets as $target) {
            $targetTokens = $this->keywordTokens($target->title ?? '');
            if (empty($targetTokens)) {
                continue;
            }

            $bestSource = null;
            $bestOverlap = 0;
            foreach ($sources as $source) {
                if ((int) $source->id === (int) $target->id) {
                    continue;
                }
                $overlap = count(array_intersect($targetTokens, $this->keywordTokens($source->title ?? '')));
                if ($overlap > $bestOverlap) {
                    $bestOverlap = $overlap;
                    $bestSource = $source;
                }
            }

            if (!$bestSource) {
                continue;
            }

            $suggestions->push([
                'target' => [
                    'id' => $target->id,
                    'url' => $target->url,
                    'title' => $target->title,
                    'inbound_links' => (int) ($target->meta['inbound_links_count'] ?? 0),
                ],
                'source' => [
                    'id' => $bestSource->id,
                    'url' => $bestSource->url,
                    'title' => $bestSource->title,
                    'internal_links' => (int) ($bestSource->meta['internal_links_count'] ?? 0),
                ],
                'anchor_suggestions' => array_slice($targetTokens, 0, 3),
                'confidence' => $bestOverlap >= 2 ? 'high' : 'medium',
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'targets_found' => $targets->count(),
                'suggestions' => $suggestions->take($limit)->values(),
            ],
        ]);
    }

    public function decayAlerts(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);

        $audits = $site->audits()
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get(['id', 'score', 'issues_found', 'pages_crawled', 'created_at'])
            ->reverse()
            ->values();

        $alerts = [];
        if ($audits->count() >= 3) {
            $first = $audits->first();
            $last = $audits->last();
            $scoreDrop = (float) ($first->score ?? 0) - (float) ($last->score ?? 0);
            $issuesGrowth = (int) ($last->issues_found ?? 0) - (int) ($first->issues_found ?? 0);

            if ($scoreDrop >= 8) {
                $alerts[] = [
                    'type' => 'score_drop',
                    'severity' => $scoreDrop >= 15 ? 'high' : 'medium',
                    'message' => "On-page score dropped by {$scoreDrop} points across recent audits.",
                ];
            }

            if ($issuesGrowth >= 20) {
                $alerts[] = [
                    'type' => 'issues_growth',
                    'severity' => $issuesGrowth >= 50 ? 'high' : 'medium',
                    'message' => "Detected {$issuesGrowth} more issues than earlier audits.",
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'alerts' => $alerts,
                'history' => $audits,
            ],
        ]);
    }

    private function cannibalizationRecommendation(int $count): string
    {
        return match (true) {
            $count >= 4 => 'High cannibalization risk. Pick one primary URL and merge/re-canonicalize overlapping pages.',
            $count >= 2 => 'Moderate cannibalization risk. Differentiate search intent and title/meta for competing URLs.',
            default => 'Low risk. Keep one clear primary page for this keyword.',
        };
    }

    private function keywordTokens(string $text): array
    {
        $normalized = mb_strtolower(preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $text) ?? '');
        $parts = preg_split('/\s+/u', trim($normalized)) ?: [];
        $stop = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'you', 'der', 'die', 'das', 'und', 'mit', 'von'];
        $parts = array_filter($parts, fn ($p) => mb_strlen($p) > 2 && !in_array($p, $stop, true));

        return array_values(array_unique($parts));
    }
}

