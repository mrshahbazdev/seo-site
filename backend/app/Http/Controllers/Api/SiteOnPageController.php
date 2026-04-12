<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Services\DataForSEOService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SiteOnPageController extends Controller
{
    protected $seoService;

    public function __construct(DataForSEOService $seoService)
    {
        $this->seoService = $seoService;
    }

    public function crawl(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);

        try {
            // Start the crawl
            $result = $this->seoService->startOnPageCrawl($site->url, 10000, $site->id);

            if (isset($result['tasks'][0]['id'])) {
                $taskId = $result['tasks'][0]['id'];
                $site->on_page_task_id = $taskId;
                $site->on_page_summary = null; // Reset summary on new crawl
                $site->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Crawl started successfully',
                    'task_id' => $taskId
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to start crawl task',
                'data' => $result
            ], 500);

        } catch (\Exception $e) {
            Log::error('OnPage Crawl Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error starting crawl: ' . $e->getMessage()
            ], 500);
        }
    }

    public function summary(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $refresh = $request->query('refresh', false);

        // If we have data and not refreshing, return it
        if ($site->on_page_summary && !$refresh) {
            return response()->json([
                'success' => true,
                'data' => $site->on_page_summary
            ]);
        }

        // We need a task ID to fetch summary
        if (!$site->on_page_task_id) {
            return response()->json([
                'success' => false,
                'status' => 'no_task',
                'message' => 'No crawl task found. Please start a new analysis.'
            ]);
        }

        try {
            $result = $this->seoService->getOnPageSummary($site->on_page_task_id, $site->id);

            // Check if result is valid
            if (isset($result['tasks'][0]['result'][0])) {
                $summaryData = $result['tasks'][0]['result'][0];

                // Update DB
                $site->on_page_summary = $summaryData;
                $site->save();

                return response()->json([
                    'success' => true,
                    'data' => $summaryData
                ]);
            }

            // Check for 40401/40402 Task Not Found or 40403 Results Expired
            $statusCode = $result['tasks'][0]['status_code'] ?? 0;
            if ($statusCode == 40401 || $statusCode == 40402 || $statusCode == 40403) {
                // Task expired or invalid, reset DB
                $site->on_page_task_id = null;
                $site->on_page_summary = null;
                $site->save();

                return response()->json([
                    'success' => false,
                    'status' => 'no_task',
                    'message' => 'Analysis session expired or results are no longer available. Please start a new analysis.'
                ]);
            }

            // Check if task is still in progress (DataForSEO status codes)
            // 20100: Queue, 20110: Active, 40602: Task In Queue
            if ($statusCode == 20100 || $statusCode == 20110 || $statusCode == 40602) {
                return response()->json([
                    'success' => false,
                    'status' => 'in_progress',
                    'message' => 'Analysis is still in progress. Please check back later.'
                ]);
            }

            Log::warning('DataForSeo OnPage Fetch Failed: ', ['result' => $result, 'task_id' => $site->on_page_task_id]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve summary data',
                'raw' => $result
            ], 500);

        } catch (\Exception $e) {
            Log::error('OnPage Summary Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching summary: ' . $e->getMessage()
            ], 500);
        }
    }

    public function pages(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $refresh = $request->query('refresh', false);

        // If we have local pages and not refreshing, return them
        $count = \App\Models\SiteCrawledPage::where('site_id', $siteId)->count();
        $filter = $request->query('filter');

        if ($count > 0 && !$refresh) {
            $query = \App\Models\SiteCrawledPage::where('site_id', $siteId);

            if ($filter) {
                // Known root-level keys in DataForSEO response
                $rootKeys = [
                    'duplicate_title',
                    'duplicate_description',
                    'duplicate_content',
                    'broken_links',
                    'broken_resources',
                    'redirect_loop',
                    'links_relation_conflict'
                ];

                if (in_array($filter, $rootKeys)) {
                    // Search in raw_data (root level)
                    // We use LIKE for broad compatibility. 
                    // Matches "key":true or "key": true
                    $query->where(function ($q) use ($filter) {
                        $q->where('raw_data', 'like', '%"' . $filter . '":true%')
                            ->orWhere('raw_data', 'like', '%"' . $filter . '": true%');
                    });
                } elseif ($filter === 'non_indexable') {
                    // Non-indexable if not canonical, or noindex (custom logic could vary)
                    // For now, let's assume is_canonical = false means it's not the primary version
                    $query->where('checks', 'like', '%"no_index":true%');
                } else {
                    // Default: Assume it's a check (inside checks object)
                    // e.g. "is_broken", "is_4xx_code", "high_loading_time", "no_h1_tag", "is_http"
                    $query->where(function ($q) use ($filter) {
                        $q->where('checks', 'like', '%"' . $filter . '":true%')
                            ->orWhere('checks', 'like', '%"' . $filter . '": true%');
                    });
                }
            }

            if ($request->has('search')) {
                $search = $request->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', '%' . $search . '%')
                        ->orWhere('url', 'like', '%' . $search . '%');
                });
            }

            $pages = $query->paginate($request->query('limit', 50));
            return response()->json([
                'success' => true,
                'data' => $pages->items(),
                'total_count' => $pages->total(),
                'source' => 'db'
            ]);
        }

        if (!$site->on_page_task_id) {
            return response()->json([
                'success' => false,
                'status' => 'no_task',
                'message' => 'No analysis task found. Please start a new analysis.'
            ]);
        }

        // Fetch from API and Cache
        try {
            set_time_limit(600); // Increase time limit for large syncs

            $limit = 1000; // Fetch in chunks of 1000
            $offset = 0;
            $totalFetched = 0;
            $totalItems = 0;

            do {
                $result = $this->seoService->getOnPagePages($site->on_page_task_id, $limit, $offset, null, $site->id);

                if (isset($result['tasks'][0]['result'][0]['items'])) {
                    $items = $result['tasks'][0]['result'][0]['items'];
                    // Update total count from the first valid response
                    if ($totalItems === 0) {
                        $totalItems = $result['tasks'][0]['result'][0]['total_items_count'] ?? 0;
                    }

                    // Clear existing pages if refreshing (only on first batch)
                    if ($offset === 0 && $count > 0) {
                        \App\Models\SiteCrawledPage::where('site_id', $siteId)->delete();
                    }

                    foreach ($items as $item) {
                        // Prepare meta and merge root-level size if available
                        $meta = $item['meta'] ?? [];
                        if (isset($item['size'])) {
                            $meta['size'] = $item['size'];
                        }

                        \App\Models\SiteCrawledPage::create([
                            'site_id' => $siteId,
                            'url' => $item['url'],
                            'status_code' => $item['status_code'],
                            'onpage_score' => $item['onpage_score'] ?? 0,
                            'title' => $item['meta']['title'] ?? null,
                            'meta' => $meta,
                            'checks' => $item['checks'] ?? null,
                            'content' => $item['content'] ?? null,
                            'page_timing' => $item['page_timing'] ?? null,
                            'resource_errors' => $item['resource_errors'] ?? null,
                            'raw_data' => $item
                        ]);
                    }

                    $totalFetched += count($items);
                    $offset += count($items); // Increment by actual received count
                } else {
                    // API returned error or no data structure
                    if ($offset === 0) {
                        $statusCode = $result['tasks'][0]['status_code'] ?? 0;
                        if ($statusCode == 40401 || $statusCode == 40402 || $statusCode == 40403) {
                            $site->on_page_task_id = null;
                            $site->on_page_summary = null;
                            $site->save();
                            return response()->json([
                                'success' => false,
                                'status' => 'no_task',
                                'message' => 'Analysis session expired or results are no longer available. Please start a new analysis.'
                            ]);
                        }

                        Log::warning('DataForSeo Pages Fetch Failed: ', ['result' => $result, 'task_id' => $site->on_page_task_id]);
                        return response()->json([
                            'success' => false,
                            'message' => 'Failed to retrieve pages list from API',
                            'raw' => $result
                        ], 500);
                    }
                    break; // Stop loop if subsequent batch fails
                }

            } while ($offset < $totalItems);

            // Return from DB
            $pages = \App\Models\SiteCrawledPage::where('site_id', $siteId)->paginate($request->query('limit', 50));

            return response()->json([
                'success' => true,
                'data' => $pages->items(),
                'total_count' => $pages->total(),
                'source' => 'api_cache_full'
            ]);

        } catch (\Exception $e) {
            Log::error('OnPage Pages List Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching pages list: ' . $e->getMessage()
            ], 500);
        }
    }
    public function pageDetails(Request $request, $siteId, $pageId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $page = \App\Models\SiteCrawledPage::where('site_id', $site->id)->findOrFail($pageId);

        return response()->json([
            'success' => true,
            'data' => $page
        ]);
    }

    /**
     * Other crawled pages on this site that share the same title, meta description,
     * or normalized main-body text — for duplicate-content UI.
     */
    public function duplicatePeers(Request $request, $siteId, $pageId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $page = \App\Models\SiteCrawledPage::where('site_id', $site->id)->findOrFail($pageId);

        $titleNorm = $this->normalizeKeyForDbMatch($page->title ?? '');
        $descNorm = $this->normalizeKeyForDbMatch($page->meta['description'] ?? '');

        // 1. Same Title
        $sameTitle = collect();
        if ($titleNorm !== '') {
            $sameTitle = \App\Models\SiteCrawledPage::query()
                ->where('site_id', $site->id)
                ->where('id', '!=', $page->id)
                ->whereRaw('LOWER(TRIM(COALESCE(title, \'\'))) = ?', [$titleNorm])
                ->limit(50)
                ->get(['id', 'url', 'title', 'meta', 'content', 'raw_data']);
        }

        // 2. Same Description
        $sameDescription = collect();
        if ($descNorm !== '') {
            $q = \App\Models\SiteCrawledPage::query()
                ->where('site_id', $site->id)
                ->where('id', '!=', $page->id);
            $this->whereMetaDescriptionNormalized($q, $descNorm);
            $sameDescription = $q->limit(50)->get(['id', 'url', 'title', 'meta', 'content', 'raw_data']);
        }

        // 3. Same Body (Optimized)
        $sameBody = collect();
        $bodyNorm = $this->normalizedPlainBody($page);

        // Only search if body is substantial
        if (mb_strlen($bodyNorm) >= 40) {
            // Optimization: Only search pages that DataForSEO already flagged as duplicate_content
            // or have the same title/description (high correlation)
            $candidatesQuery = \App\Models\SiteCrawledPage::query()
                ->where('site_id', $site->id)
                ->where('id', '!=', $page->id);

            $driver = DB::connection()->getDriverName();
            if ($driver === 'mysql' || $driver === 'pgsql') {
                // Use JSON optimization if possible
                $candidatesQuery->where(function ($q) {
                    $q->whereRaw('JSON_EXTRACT(raw_data, "$.duplicate_content") = true')
                      ->orWhereRaw('JSON_EXTRACT(raw_data, "$.duplicate_title") = true')
                      ->orWhereRaw('JSON_EXTRACT(raw_data, "$.duplicate_description") = true');
                });
            } else {
                // Fallback for other drivers
                $candidatesQuery->where('raw_data', 'like', '%"duplicate_content":true%');
            }

            // Only process up to 200 candidates to avoid OOM/Timeout
            $candidatesQuery->select(['id', 'url', 'title', 'meta', 'content', 'raw_data'])
                ->limit(200)
                ->chunkById(100, function ($chunk) use ($bodyNorm, &$sameBody) {
                    foreach ($chunk as $peer) {
                        if ($this->normalizedPlainBody($peer) === $bodyNorm) {
                            $sameBody->push($peer);
                            if ($sameBody->count() >= 50) return false; // Stop if we found enough
                        }
                    }
                });
        }

        return response()->json([
            'success' => true,
            'current' => [
                'id' => $page->id,
                'url' => $page->url,
                'title' => $page->title,
                'description' => $page->meta['description'] ?? '',
            ],
            'same_title' => $sameTitle->map(fn ($p) => $this->duplicatePeerPayload($p))->values(),
            'same_description' => $sameDescription->map(fn ($p) => $this->duplicatePeerPayload($p))->values(),
            'same_body' => $sameBody->map(fn ($p) => $this->duplicatePeerPayload($p))->values(),
        ]);
    }

    private function duplicatePeerPayload(\App\Models\SiteCrawledPage $p): array
    {
        $desc = $p->meta['description'] ?? '';

        return [
            'id' => $p->id,
            'url' => $p->url,
            'title' => $p->title,
            'description' => $desc,
            'description_preview' => $this->truncateMiddle($desc, 180),
        ];
    }

    private function truncateMiddle(string $text, int $max): string
    {
        if (mb_strlen($text) <= $max) {
            return $text;
        }

        return mb_substr($text, 0, (int) floor($max * 0.55)) . ' … ' . mb_substr($text, -(int) floor($max * 0.35));
    }

    private function normalizeWhitespaceKey(?string $value): string
    {
        $value = $value ?? '';
        $collapsed = preg_replace('/\s+/u', ' ', trim($value));

        return mb_strtolower($collapsed ?? '', 'UTF-8');
    }

    private function normalizedPlainBody(\App\Models\SiteCrawledPage $p): string
    {
        $plain = $p->content['plain_text'] ?? ($p->raw_data['content']['plain_text'] ?? '');
        $plain = is_string($plain) ? $plain : '';

        return $this->normalizeWhitespaceKey($plain);
    }

    /** Lowercase + trim only — must match SQL LOWER(TRIM(...)) for title/description. */
    private function normalizeKeyForDbMatch(?string $value): string
    {
        return mb_strtolower(trim($value ?? ''), 'UTF-8');
    }

    private function whereMetaDescriptionNormalized($query, string $descNorm): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            $query->whereRaw(
                'LOWER(TRIM(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`meta`, \'$.description\')), \'\'))) = ?',
                [$descNorm]
            );

            return;
        }

        if ($driver === 'pgsql') {
            $query->whereRaw(
                'LOWER(TRIM(COALESCE(meta->>\'description\', \'\'))) = ?',
                [$descNorm]
            );

            return;
        }

        // sqlite and other drivers with json_extract
        $query->whereRaw(
            'LOWER(TRIM(COALESCE(json_extract(meta, \'$.description\'), \'\'))) = ?',
            [$descNorm]
        );
    }

    public function pageLinks(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $url = $request->query('url');

        if (!$url) {
            return response()->json(['success' => false, 'message' => 'URL parameter required'], 400);
        }

        if (!$site->on_page_task_id) {
            return response()->json(['success' => false, 'status' => 'no_task', 'message' => 'No analysis task found'], 400);
        }

        try {
            $result = $this->seoService->getOnPageLinks($site->on_page_task_id, $url);

            if (isset($result['tasks'][0]['result'][0]['items'])) {
                return response()->json([
                    'success' => true,
                    'data' => $result['tasks'][0]['result'][0]['items'],
                    'total_count' => $result['tasks'][0]['result'][0]['total_items_count'] ?? 0
                ]);
            }

            return response()->json(['success' => true, 'data' => []]);

        } catch (\Exception $e) {
            Log::error('OnPage Links Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error fetching links'], 500);
        }
    }
    public function analyzeContent(Request $request, $siteId, $pageId, \App\Services\ContentAnalysisService $contentService)
    {
        $request->validate([
            'keyword' => 'required|string|min:1'
        ]);

        $site = $request->user()->sites()->findOrFail($siteId);
        $page = \App\Models\SiteCrawledPage::where('site_id', $site->id)->findOrFail($pageId);
        $keyword = $request->input('keyword');

        // Prepare data for service
        $pageData = [
            'title' => $page->title,
            'content' => $page->content['plain_text'] ?? ($page->raw_data['content']['plain_text'] ?? ''),
            'meta' => $page->meta,
            'url' => $page->url
        ];

        try {
            $analysis = $contentService->analyze($pageData, $keyword);

            return response()->json([
                'success' => true,
                'data' => $analysis
            ]);
        } catch (\Exception $e) {
            Log::error('Content Analysis Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Analysis failed'], 500);
        }
    }
}
