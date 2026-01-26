<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\SiteCrawledPage;
use App\Services\ContentAnalysisService;
use App\Services\DataForSEOService; // We might need this later for live parsing
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SitePageAnalysisController extends Controller
{
    protected $contentAnalysisService;
    protected $seoService;
    protected $advancedAnalyzer;
    protected $pageSpeedService;

    public function __construct(
        ContentAnalysisService $contentAnalysisService,
        DataForSEOService $seoService,
        \App\Services\AdvancedSeoAnalyzer $advancedAnalyzer,
        \App\Services\GooglePageSpeedService $pageSpeedService
    ) {
        $this->contentAnalysisService = $contentAnalysisService;
        $this->seoService = $seoService;
        $this->advancedAnalyzer = $advancedAnalyzer;
        $this->pageSpeedService = $pageSpeedService;
    }

    /**
     * Analyze content for a specific keyword.
     */
    public function analyzeContent(Request $request, $siteId, $pageId)
    {
        $request->validate([
            'keyword' => 'required|string|min:1',
        ]);

        try {
            // Find specific crawled page in our DB.
            // pageId here corresponds to our internal ID for the `site_crawled_pages` record
            $crawledPage = SiteCrawledPage::where('site_id', $siteId)
                ->where('id', $pageId) // pageId from URL is our DB ID
                ->first();

            if (!$crawledPage) {
                return response()->json(['success' => false, 'message' => 'Page not found in database'], 404);
            }

            // Perform Analysis
            $keyword = $request->input('keyword');

            // We use the data we already have stored
            $pageData = [
                'meta' => $crawledPage->meta,
                'content' => $crawledPage->content
            ];

            $analysis = $this->contentAnalysisService->analyze($pageData, $keyword);

            // Save Analysis Result
            $crawledPage->content_analysis = $analysis;
            $crawledPage->save();

            return response()->json([
                'success' => true,
                'data' => $analysis
            ]);

        } catch (\Exception $e) {
            Log::error('Content Analysis Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error analyzing content: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Perform Deep HTML Analysis (Headings, Headers, Images, Links)
     */
    public function analyzeDeep(Request $request, $siteId, $pageId)
    {
        try {
            $crawledPage = SiteCrawledPage::where('site_id', $siteId)
                ->where('id', $pageId)
                ->firstOrFail();

            // If we already have analysis data and not forced refresh, return it
            if ($crawledPage->analysis_data && !$request->query('refresh')) {
                return response()->json([
                    'success' => true,
                    'data' => $crawledPage->analysis_data,
                    'source' => 'db_cache'
                ]);
            }

            // We need HTML content. DataForSEO "Instant Pages" or "OnPage" 
            // usually gives us checks and meta, but not full HTML body unless "load_resources" or "fetch_content" usage.
            // The `site_crawled_pages` table has a `content` column.

            // Check if we have html content in `content` column?
            // The column `content` is cast to array.
            // DataForSEO usually returns plain_text, or if we requested, html.
            // But we might need to fetch live HTML if we don't store it to save space.

            // For now, let's assume we fetch live from the URL if we want fresh deep analysis,
            // OR we rely on what's in the DB.
            // Let's try fetching live HTML to be robust as DB likely just has text content.

            // Use simple Guzzle/Http get for now? Or use DataForSEO?
            // A simple GET is faster for HTML parsing.

            $html = null;

            // Option 1: Fetch live
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(30)
                    ->withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'Accept-Language' => 'en-US,en;q=0.9',
                        'Cache-Control' => 'no-cache',
                        'Pragma' => 'no-cache',
                        'Upgrade-Insecure-Requests' => '1',
                        'Sec-Ch-Ua' => '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                        'Sec-Ch-Ua-Mobile' => '?0',
                        'Sec-Ch-Ua-Platform' => '"Windows"',
                        'Sec-Fetch-Dest' => 'document',
                        'Sec-Fetch-Mode' => 'navigate',
                        'Sec-Fetch-Site' => 'none',
                        'Sec-Fetch-User' => '?1'
                    ])
                    ->get($crawledPage->url);

                if ($response->successful()) {
                    $html = $response->body();
                } else {
                    Log::warning("Deep Analysis Fetch Failed: " . $response->status());
                }
            } catch (\Exception $e) {
                // Fail silently on fetch, maybe try fallback?
                Log::warning("Failed to fetch live HTML for deep analysis: " . $e->getMessage());
                return response()->json(['success' => false, 'message' => 'Could not fetch page content: ' . $e->getMessage()], 400);
            }

            if (!$html) {
                // FALLBACK: Try to use content from DB if available
                if (!empty($crawledPage->content['plain_text'])) {
                    // This is text, not HTML, but better than nothing for some checks?
                    // Actually, AdvancedAnalyzer needs HTML.
                    // If we have 'html' key in content?
                }

                return response()->json(['success' => false, 'message' => 'Empty HTML content. The page could not be fetched live.'], 400);
            }

            $analysis = $this->advancedAnalyzer->analyze($html, $crawledPage->url);

            // SAVE RESULT - MERGE instead of overwrite
            $existing = $crawledPage->analysis_data ?? [];
            // Merge new deep analysis keys into existing
            $existing = array_merge($existing, $analysis);

            $crawledPage->analysis_data = $existing;
            $crawledPage->save();

            return response()->json([
                'success' => true,
                'data' => $existing // Return merged data
            ]);

        } catch (\Exception $e) {
            Log::error('Deep Analysis Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error performing deep analysis: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Perform Paid Analysis (DataForSEO Instant Audit with Core Web Vitals)
     */
    public function analyzePaid(Request $request, $siteId, $pageId)
    {
        try {
            $crawledPage = SiteCrawledPage::where('site_id', $siteId)
                ->where('id', $pageId)
                ->firstOrFail();

            // Check cache
            $existing = $crawledPage->analysis_data ?? [];
            if (isset($existing['paid']) && !$request->query('refresh')) {
                return response()->json([
                    'success' => true,
                    'data' => $existing['paid'],
                    'source' => 'db_cache'
                ]);
            }

            // Call DataForSEO
            $result = $this->seoService->analyzeInstantPage($crawledPage->url);

            if (isset($result['tasks'][0]['result'][0]['items'][0])) {
                $item = $result['tasks'][0]['result'][0]['items'][0];

                Log::info('Instant Audit Item:', $item);

                // Extract useful metrics
                $metrics = [
                    'onpage_score' => $item['onpage_score'] ?? 0,
                    'checks' => $item['checks'] ?? [],
                    'page_timing' => $item['page_timing'] ?? [],
                    // Lighthouse-like metrics if available (browser rendering enabled)
                    // DataForSEO puts them in 'page_timing' or 'checks' mostly, 
                    // but for true Lighthouse scores we need 'lighthouse' API.
                    // 'Instant Pages' returns rendering checks like 'dom_complete', 'layout_shift' etc.
                    // if fields avail:
                    'cumulative_layout_shift' => $item['page_timing']['cumulative_layout_shift'] ?? 0,
                    'largest_contentful_paint' => $item['page_timing']['largest_contentful_paint'] ?? 0,
                    'total_blocking_time' => $item['page_timing']['total_blocking_time'] ?? 0,
                ];

                $existing['paid'] = $metrics;
                $crawledPage->analysis_data = $existing;
                $crawledPage->save();

                return response()->json([
                    'success' => true,
                    'data' => $metrics
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'API returned no items',
                'raw' => $result
            ], 500);

        } catch (\Exception $e) {
            Log::error('Paid Analysis Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error processing paid analysis: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Perform Google PageSpeed Analysis
     */
    public function analyzeSpeed(Request $request, $siteId, $pageId)
    {
        try {
            $crawledPage = SiteCrawledPage::where('site_id', $siteId)
                ->where('id', $pageId)
                ->firstOrFail();

            $strategy = $request->input('strategy', 'mobile');

            // Allow force refresh, otherwise check if we have recent specific speed data
            // For now, let's treat it as live check usually

            $result = $this->pageSpeedService->analyze($crawledPage->url, $strategy);

            if (isset($result['error'])) {
                return response()->json(['success' => false, 'message' => $result['message']], 500);
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ]);

        } catch (\Exception $e) {
            Log::error('PageSpeed Controller Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error analyzing speed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Ranked Keywords for a specific Page
     */
    public function rankedKeywords(Request $request, $siteId, $pageId)
    {
        try {
            $crawledPage = SiteCrawledPage::where('site_id', $siteId)
                ->where('id', $pageId)
                ->firstOrFail();

            // Check db cache if needed, but for "live" data we might want fresh.
            // For now, let's treat it as a live check like other tools. 
            // We could cache it in a new column or table if traffic is high.

            $keywords = $this->seoService->getPageRankedKeywords($crawledPage->url);

            return response()->json([
                'success' => true,
                'data' => $keywords,
                'meta' => [
                    'url' => $crawledPage->url,
                    'location' => 'US (2840)'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Ranked Keywords Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ranked keywords'
            ], 500);
        }
    }
}
