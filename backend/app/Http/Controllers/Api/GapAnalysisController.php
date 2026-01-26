<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DataForSEOService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GapAnalysisController extends Controller
{
    protected $seoService;

    public function __construct(DataForSEOService $seoService)
    {
        $this->seoService = $seoService;
    }

    public function analyze(Request $request)
    {
        $request->validate([
            'target_domain' => 'required|string',
            'competitors' => 'required|array|min:1|max:3',
            'competitors.*' => 'required|string|distinct|different:target_domain',
            'location_code' => 'sometimes|integer',
            'language_code' => 'sometimes|string'
        ]);

        try {
            $target = $request->input('target_domain');
            $competitors = $request->input('competitors');

            // Normalize domains (strip https/www)
            $normalize = fn($d) => parse_url($d, PHP_URL_HOST) ?? $d;
            $targetHost = $normalize($target);
            $competitorHosts = array_map($normalize, $competitors);

            // We want to find keywords where COMPETITORS rank.
            // If we include the user's domain (which might have 0 keywords) in the intersection, we get 0 results.
            // So we calculate intersection of Competitors ONLY.
            $primaryCompetitor = array_shift($competitorHosts);

            $results = $this->seoService->getDomainIntersection(
                $primaryCompetitor,
                $competitorHosts, // Remaining competitors
                $request->input('location_code', 2840),
                $request->input('language_code', 'en')
            );

            // Transform for Frontend
            $data = array_map(function ($item) use ($targetHost) {
                $keyword = $item['keyword_data']['keyword_info']['keyword'];
                $vol = $item['keyword_data']['keyword_info']['search_volume'];
                $kd = $item['keyword_data']['keyword_info']['keyword_difficulty'];
                $cpc = $item['keyword_data']['keyword_info']['cpc'];

                $ranks = [];
                foreach ($item['keyword_data']['serp_info'] as $domain => $info) {
                    $ranks[$domain] = $info['position'] ?? null;
                }

                // Calculate Opportunity Score (High Vol + Low Difficulty + Target Doesn't Rank)
                // If target rank is null or > 20, and competitor < 10, it's a gap
                $targetRank = $ranks[$targetHost] ?? 101;
                $isGap = $targetRank > 20;

                return [
                    'keyword' => $keyword,
                    'volume' => $vol,
                    'kd' => $kd,
                    'cpc' => $cpc,
                    'ranks' => $ranks,
                    'is_gap' => $isGap
                ];
            }, $results);

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            Log::error("Gap Analysis Failed: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
