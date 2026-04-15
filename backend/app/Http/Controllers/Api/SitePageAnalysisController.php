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
    protected $languageToolService;

    public function __construct(
        ContentAnalysisService $contentAnalysisService,
        DataForSEOService $seoService,
        \App\Services\AdvancedSeoAnalyzer $advancedAnalyzer,
        \App\Services\GooglePageSpeedService $pageSpeedService,
        \App\Services\LanguageToolService $languageToolService
    ) {
        $this->contentAnalysisService = $contentAnalysisService;
        $this->seoService = $seoService;
        $this->advancedAnalyzer = $advancedAnalyzer;
        $this->pageSpeedService = $pageSpeedService;
        $this->languageToolService = $languageToolService;
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

            $html = $this->fetchLiveHtmlForDeepAnalysis($crawledPage->url);

            if (!$html) {
                $html = $this->extractStoredHtmlFromCrawledPage($crawledPage);
            }

            $htmlSource = $html ? 'live_or_stored' : null;

            if (!$html) {
                $html = $this->buildSyntheticHtmlFromCrawledPage($crawledPage);
                $htmlSource = 'synthetic_from_crawl';
            }

            if (!$html || ! is_string($html) || trim($html) === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Empty HTML content. The page could not be fetched live and no usable crawl data was found to fall back on.',
                    'hint' => 'Common causes: bot protection (Cloudflare), geo blocking, wrong URL, or a JavaScript-only shell with no HTML in the first response. Try again from a network that can open the URL, or re-run the on-page crawl so we have fresh stored content.',
                ], 400);
            }

            $analysis = $this->advancedAnalyzer->analyze($html, $crawledPage->url);

            // SAVE RESULT - MERGE instead of overwrite
            $existing = $crawledPage->analysis_data ?? [];
            $existing = array_merge($existing, $analysis);
            $existing['_deep_html_source'] = $htmlSource;

            $crawledPage->analysis_data = $existing;
            $crawledPage->save();

            return response()->json([
                'success' => true,
                'data' => $existing,
                'html_source' => $htmlSource,
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
     * Perform Grammar and Spell Check
     */
    public function analyzeGrammar(Request $request, $siteId, $pageId)
    {
        try {
            $crawledPage = SiteCrawledPage::where('site_id', $siteId)
                ->where('id', $pageId)
                ->firstOrFail();

            // Prefer using stored text content from deep analysis, if available
            $text = $crawledPage->content_text;

            // If strict or missing, fallback to parsing 'content' html? 
            // Better to rely on what Deep Analysis extracted.
            if (empty($text)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No text content available. Please run Deep Analysis first.'
                ], 400);
            }

            $language = $request->input('language', 'en-US');

            $result = $this->languageToolService->check($text, $language);

            if (isset($result['error'])) {
                return response()->json(['success' => false, 'message' => $result['message']], 500);
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ]);

        } catch (\Exception $e) {
            Log::error('Grammar Analysis Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error checking grammar: ' . $e->getMessage()
            ], 500);
        }
    }
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

    /**
     * Try several HTTP strategies — many hosts block "browser" Sec-* headers from server IPs or return empty bodies.
     */
    private function fetchLiveHtmlForDeepAnalysis(string $url): ?string
    {
        $http = \Illuminate\Support\Facades\Http::accept('text/html,application/xhtml+xml;q=0.9,*/*;q=0.8');

        $attempts = [
            [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language' => 'en-US,en;q=0.9',
            ],
            [
                'User-Agent' => 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept' => 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
            ],
            [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
                'Accept' => 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
            ],
        ];

        foreach ($attempts as $i => $headers) {
            try {
                $response = $http->timeout(45)
                    ->withHeaders($headers)
                    ->get($url);

                if ($response->successful()) {
                    $body = $response->body();
                    if ($this->bodyLooksLikeHtmlDocument($body)) {
                        return $body;
                    }
                    Log::warning('Deep analysis live fetch: non-HTML or empty body', [
                        'attempt' => $i,
                        'status' => $response->status(),
                        'len' => strlen((string) $body),
                    ]);
                } else {
                    Log::warning('Deep analysis live fetch failed status', [
                        'attempt' => $i,
                        'status' => $response->status(),
                    ]);
                }
            } catch (\Exception $e) {
                Log::warning('Deep analysis live fetch exception: '.$e->getMessage(), ['attempt' => $i]);
            }
        }

        return null;
    }

    private function bodyLooksLikeHtmlDocument(string $body): bool
    {
        $body = ltrim($body);
        if ($body === '' || strlen($body) < 80) {
            return false;
        }

        $head = strtolower(substr($body, 0, 800));
        if (str_contains($head, 'cf-browser-verification') || (str_contains($head, 'cloudflare') && str_contains($head, 'challenge'))) {
            return false;
        }

        return str_contains($head, '<html')
            || str_contains($head, '<!doctype')
            || (str_contains($head, '<head') && str_contains($head, '<body'));
    }

    /**
     * DataForSEO sometimes includes an html fragment under content (depends on crawl settings).
     */
    private function extractStoredHtmlFromCrawledPage(SiteCrawledPage $page): ?string
    {
        $content = $page->content;
        if (is_array($content) && ! empty($content['html']) && is_string($content['html'])) {
            return $content['html'];
        }

        $raw = $page->raw_data;
        if (! is_array($raw)) {
            return null;
        }

        $nested = $raw['content'] ?? [];
        if (is_array($nested) && ! empty($nested['html']) && is_string($nested['html'])) {
            return $nested['html'];
        }

        return null;
    }

    /**
     * Last resort: rebuild a minimal HTML document from meta + plain text we already have from the crawl.
     * Image/link structure will be incomplete vs live HTML.
     */
    private function buildSyntheticHtmlFromCrawledPage(SiteCrawledPage $page): ?string
    {
        $plain = $page->content['plain_text'] ?? ($page->raw_data['content']['plain_text'] ?? '');
        $plain = is_string($plain) ? trim($plain) : '';
        if ($plain === '' || strlen($plain) < 30) {
            return null;
        }

        $title = htmlspecialchars((string) ($page->meta['title'] ?? $page->title ?? 'Page'), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $parts = ['<!DOCTYPE html>', '<html lang="en"><head><meta charset="UTF-8"><title>', $title, '</title></head><body>'];

        $htags = $page->meta['htags'] ?? [];
        if (is_array($htags)) {
            foreach (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as $tag) {
                if (empty($htags[$tag]) || ! is_array($htags[$tag])) {
                    continue;
                }
                foreach ($htags[$tag] as $text) {
                    $safe = htmlspecialchars((string) $text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    $parts[] = '<'.$tag.'>'.$safe.'</'.$tag.'>';
                }
            }
        }

        $parts[] = '<article class="synthetic-crawl-fallback">';
        $parts[] = '<p>'.nl2br(htmlspecialchars($plain, ENT_QUOTES | ENT_HTML5, 'UTF-8')).'</p>';
        $parts[] = '</article></body></html>';

        return implode('', $parts);
    }
}
