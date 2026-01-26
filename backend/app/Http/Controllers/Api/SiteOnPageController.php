<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Services\DataForSEOService;
use Illuminate\Http\Request;
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
        $site = Site::findOrFail($siteId);

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
        $site = Site::findOrFail($siteId);
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

            // Check for 40401 Task Not Found (Expired)
            $statusCode = $result['tasks'][0]['status_code'] ?? 0;
            if ($statusCode == 40401) {
                // Task expired or invalid, reset DB
                $site->on_page_task_id = null;
                $site->on_page_summary = null;
                $site->save();

                return response()->json([
                    'success' => false,
                    'status' => 'no_task',
                    'message' => 'Analysis session expired. Please start a new analysis.'
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
        $site = Site::findOrFail($siteId);
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
        $page = \App\Models\SiteCrawledPage::where('site_id', $siteId)->findOrFail($pageId);

        return response()->json([
            'success' => true,
            'data' => $page
        ]);
    }

    public function pageLinks(Request $request, $siteId)
    {
        $site = Site::findOrFail($siteId);
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

        $page = \App\Models\SiteCrawledPage::where('site_id', $siteId)->findOrFail($pageId);
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
