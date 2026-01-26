<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RankingOpportunityService;
use App\Services\ContentBriefService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OpportunityController extends Controller
{
    protected $rankingService;
    protected $briefService;

    public function __construct(RankingOpportunityService $rankingService, ContentBriefService $briefService)
    {
        $this->rankingService = $rankingService;
        $this->briefService = $briefService;
    }

    /**
     * Analyze a keyword for ranking opportunity
     */
    public function analyze(Request $request)
    {
        $request->validate([
            'keyword' => 'required|string|max:255'
        ]);

        try {
            // 1. Analyze Difficulty
            $analysis = $this->rankingService->analyzeKeyword($request->keyword);

            // 2. Generate Content Brief
            $briefData = $this->briefService->generateBrief($request->keyword, $analysis->toArray());

            return response()->json([
                'success' => true,
                'data' => [
                    'analysis' => $analysis,
                    'strategy' => $briefData['strategy'], // Structured Data
                    'prompt' => $briefData['prompt'] // Master Prompt
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Opportunity Analysis Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze keyword opportunity. ' . $e->getMessage()
            ], 500);
        }
    }
}
