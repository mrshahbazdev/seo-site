<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competitor;
use App\Models\Site;
use App\Services\DataForSEOService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CompetitorController extends Controller
{
    protected $dataForSEO;

    public function __construct(DataForSEOService $dataForSEO)
    {
        $this->dataForSEO = $dataForSEO;
    }

    /**
     * List all competitors for a site
     */
    public function index($siteId)
    {
        try {
            $competitors = Competitor::where('site_id', $siteId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $competitors
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch competitors: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a new competitor
     */
    public function store(Request $request, $siteId)
    {
        $request->validate([
            'domain' => 'required|string|max:255',
            'name' => 'nullable|string|max:255'
        ]);

        try {
            // Check if competitor already exists
            $existing = Competitor::where('site_id', $siteId)
                ->where('domain', $request->domain)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'This competitor already exists'
                ], 400);
            }

            $competitor = Competitor::create([
                'site_id' => $siteId,
                'domain' => $request->domain,
                'name' => $request->name ?? $request->domain
            ]);

            return response()->json([
                'success' => true,
                'data' => $competitor,
                'message' => 'Competitor added successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Add Competitor Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add competitor'
            ], 500);
        }
    }

    /**
     * Get competitor details
     */
    public function show($siteId, $competitorId)
    {
        try {
            $competitor = Competitor::where('site_id', $siteId)
                ->findOrFail($competitorId);

            return response()->json([
                'success' => true,
                'data' => $competitor
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Competitor not found'
            ], 404);
        }
    }

    /**
     * Analyze/Refresh competitor data
     */
    public function analyze($siteId, $competitorId)
    {
        try {
            $competitor = Competitor::where('site_id', $siteId)
                ->findOrFail($competitorId);

            // Fetch metrics from DataForSEO
            $metrics = $this->dataForSEO->getDomainMetrics($competitor->domain);

            if (!$metrics) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch competitor metrics'
                ], 400);
            }

            // Update competitor with new metrics
            $competitor->metrics_data = $metrics;
            $competitor->last_analyzed = now();
            $competitor->save();

            return response()->json([
                'success' => true,
                'data' => $competitor,
                'message' => 'Competitor analyzed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Analyze Competitor Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze competitor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get competitor's anchor texts (with caching)
     */
    public function pages($siteId, $competitorId)
    {
        try {
            $competitor = Competitor::where('site_id', $siteId)
                ->findOrFail($competitorId);

            // Check if we have cached data (less than 7 days old)
            if (
                $competitor->anchor_texts_data &&
                $competitor->anchor_texts_analyzed &&
                $competitor->anchor_texts_analyzed->diffInDays(now()) < 7
            ) {

                return response()->json([
                    'success' => true,
                    'data' => $competitor->anchor_texts_data,
                    'cached' => true
                ]);
            }

            // Fetch fresh data from DataForSEO
            $anchorTexts = $this->dataForSEO->getCompetitorPages($competitor->domain, 50);

            // Cache the data
            $competitor->anchor_texts_data = $anchorTexts;
            $competitor->anchor_texts_analyzed = now();
            $competitor->save();

            return response()->json([
                'success' => true,
                'data' => $anchorTexts,
                'cached' => false
            ]);
        } catch (\Exception $e) {
            Log::error('Competitor Anchor Texts Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch anchor texts'
            ], 500);
        }
    }

    /**
     * Delete a competitor
     */
    public function destroy($siteId, $competitorId)
    {
        try {
            $competitor = Competitor::where('site_id', $siteId)
                ->findOrFail($competitorId);

            $competitor->delete();

            return response()->json([
                'success' => true,
                'message' => 'Competitor removed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove competitor'
            ], 500);
        }
    }
}
