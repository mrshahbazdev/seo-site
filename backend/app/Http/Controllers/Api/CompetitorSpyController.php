<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DataForSEOService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CompetitorSpyController extends Controller
{
    protected $dataForSEO;

    public function __construct(DataForSEOService $dataForSEO)
    {
        $this->dataForSEO = $dataForSEO;
    }

    /**
     * Steal competitor keywords
     */
    public function spy(Request $request)
    {
        $request->validate([
            'domain' => 'required|string',
            'location_code' => 'nullable|integer',
            'language_code' => 'nullable|string'
        ]);

        try {
            // Remove protocol if user added it
            $domain = str_replace(['http://', 'https://', 'www.'], '', $request->domain);
            $domain = rtrim($domain, '/');

            $keywords = $this->dataForSEO->getCompetitorKeywords(
                $domain,
                $request->location_code ?? 2840,
                $request->language_code ?? 'en'
            );

            // Format data for frontend
            $formatted = array_map(function ($item) {
                return [
                    'keyword' => $item['keyword_data']['keyword'] ?? 'N/A',
                    'rank' => $item['ranked_serp_element']['serp_item']['rank_group'] ?? 0,
                    'search_volume' => $item['keyword_data']['keyword_info']['search_volume'] ?? 0,
                    'cpc' => $item['keyword_data']['keyword_info']['cpc'] ?? 0,
                    'traffic_cost' => $item['ranked_serp_element']['serp_item']['etv'] ?? 0, // Estimated Traffic Value
                    'url' => $item['ranked_serp_element']['serp_item']['url'] ?? ''
                ];
            }, $keywords);

            return response()->json([
                'success' => true,
                'data' => $formatted
            ]);

        } catch (\Exception $e) {
            Log::error('Competitor Spy Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to spy on competitor. ' . $e->getMessage()
            ], 500);
        }
    }
}
