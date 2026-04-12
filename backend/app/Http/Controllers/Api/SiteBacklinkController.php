<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Services\DataForSEOService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SiteBacklinkController extends Controller
{
    protected $dataForSeo;

    public function __construct(DataForSEOService $dataForSeo)
    {
        $this->dataForSeo = $dataForSeo;
    }

    public function analyze(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $domain = parse_url($site->url, PHP_URL_HOST) ?? $site->url;

        // Clean domain (remove www if needed, but DataForSEO usually handles it)
        $domain = preg_replace('/^www\./', '', $domain);

        // Check if we have cached data and distinct refresh flag is not present
        if ($site->backlinks_data && !$request->has('refresh')) {
            return response()->json([
                'success' => true,
                'data' => $site->backlinks_data,
                'cached' => true
            ]);
        }

        try {
            $result = $this->dataForSeo->getBacklinksSummary($domain);

            // Check for 'items' (list endpoints) or direct data (summary endpoints)
            if (isset($result['tasks'][0]['result'][0])) {
                $resData = $result['tasks'][0]['result'][0];

                // If there's an 'items' array, take the first item (legacy support if we switch endpoints)
                if (isset($resData['items'][0])) {
                    $backlinkData = $resData['items'][0];
                } else {
                    $backlinkData = $resData;
                }

                // Save to database
                $site->backlinks_data = $backlinkData;
                $site->save();

                return response()->json([
                    'success' => true,
                    'data' => $backlinkData,
                    'cached' => false
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No backlink data returned from DataForSEO',
                'raw_result' => $result
            ], 500);

        } catch (\Exception $e) {
            Log::error("Backlink Analysis Exception: " . $e->getMessage());
            return response()->json([
                'message' => 'Error analyzing backlinks: ' . $e->getMessage()
            ], 500);
        }
    }

    public function analyzePage(Request $request, $siteId, $pageId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $page = \App\Models\SitePage::where('site_id', $site->id)->findOrFail($pageId);
        $url = $page->url;

        // Clean URL if needed, or pass full URL to DataForSEO (which supports full URLs for summary)

        try {
            // Re-use the service method. Note: getBacklinksSummary in service uses 'target' which accepts domain OR url.
            $result = $this->dataForSeo->getBacklinksSummary($url);

            if (isset($result['tasks'][0]['result'][0])) {
                $resData = $result['tasks'][0]['result'][0];

                if (isset($resData['items'][0])) {
                    $backlinkData = $resData['items'][0];
                } else {
                    $backlinkData = $resData;
                }

                return response()->json([
                    'success' => true,
                    'data' => $backlinkData
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No backlink data returned from DataForSEO',
                'raw_result' => $result
            ], 500);

        } catch (\Exception $e) {
            Log::error("Page Backlink Analysis Exception: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error analyzing page backlinks: ' . $e->getMessage()
            ], 500);
        }
    }
    public function list(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        $domain = parse_url($site->url, PHP_URL_HOST) ?? $site->url;
        $domain = preg_replace('/^www\./', '', $domain);

        // Check if we have cached data and distinct refresh flag is not present
        if ($site->backlinks_list_data && !$request->has('refresh')) {
            return response()->json([
                'success' => true,
                'data' => $site->backlinks_list_data,
                'cached' => true
            ]);
        }

        try {
            // Default limit 100, but can be increased if needed. 
            // User requested "limit jo site ki Total Backlinks ha wo ho", so we might want a higher default or check summary first.
            // For safety, let's start with 100 or 500. Retrieving millions is dangerous.
            // We can pass a limit param if provided.
            $limit = $request->input('limit', 100);

            $result = $this->dataForSeo->getBacklinksList($domain, $limit);

            if (isset($result['tasks'][0]['result'][0]['items'])) {
                $backlinksList = $result['tasks'][0]['result'][0]['items'];
                $totalCount = $result['tasks'][0]['result'][0]['total_count'] ?? 0;

                $responseData = [
                    'items' => $backlinksList,
                    'total_count' => $totalCount
                ];

                // Save to database
                $site->backlinks_list_data = $responseData;
                $site->save();

                return response()->json([
                    'success' => true,
                    'data' => $responseData,
                    'cached' => false
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No backlink list data returned from DataForSEO',
                'raw_result' => $result
            ], 500);

        } catch (\Exception $e) {
            Log::error("Backlink List Exception: " . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching backlink list: ' . $e->getMessage()
            ], 500);
        }
    }
}
