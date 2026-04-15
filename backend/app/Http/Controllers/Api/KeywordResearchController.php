<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KeywordSearch;
use App\Services\DataForSEOService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class KeywordResearchController extends Controller
{
    protected $dataForSEO;

    public function __construct(DataForSEOService $dataForSEO)
    {
        $this->dataForSEO = $dataForSEO;
    }

    /**
     * Search for keywords
     */
    public function search(Request $request)
    {
        $request->validate([
            'keyword' => 'required|string|max:255',
            'location_code' => 'sometimes|integer',
            'language_code' => 'sometimes|string|size:2'
        ]);

        $keyword = strtolower(trim((string) $request->keyword));
        if ($keyword === '') {
            return response()->json([
                'success' => false,
                'message' => 'Keyword cannot be empty',
            ], 422);
        }
        $location = $request->location_code ?? 2840; // Default US
        $language = $request->language_code ?? 'en';

        try {
            // Check cache (valid for 30 days)
            $cached = KeywordSearch::where('keyword', $keyword)
                ->where('location_code', $location)
                ->where('language_code', $language)
                ->where('updated_at', '>', now()->subDays(30))
                ->first();

            if ($cached) {
                return response()->json([
                    'success' => true,
                    'data' => $cached->results,
                    'cached' => true
                ]);
            }

            // Fetch fresh data
            $results = $this->dataForSEO->keywordFinder($keyword, $location, $language);

            // Save to DB
            KeywordSearch::updateOrCreate(
                [
                    'keyword' => $keyword,
                    'location_code' => $location,
                    'language_code' => $language
                ],
                [
                    'results' => $results
                ]
            );

            return response()->json([
                'success' => true,
                'data' => $results,
                'cached' => false
            ]);

        } catch (\Exception $e) {
            Log::error('Keyword Search Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to search keywords',
                // Return underlying provider error to make debugging possible.
                // If you want to hide this in production later, gate it behind APP_DEBUG.
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Return available Google locations from DataForSEO.
     */
    public function locations()
    {
        try {
            $locations = Cache::remember('keyword_locations_labs', now()->addDays(7), function () {
                // For keyword research we use DataForSEO Labs, so we must use Labs locations list
                // (e.g. 2276, Germany, DE, Country).
                $result = $this->dataForSEO->makeRequest('/v3/dataforseo_labs/locations_and_languages', [], false);
                $items = $result['tasks'][0]['result'] ?? [];

                return collect($items)
                    ->filter(fn ($item) => isset($item['location_code'], $item['location_name']))
                    ->map(function ($item) {
                        $country = $item['country_iso_code'] ?? '';
                        $name = $item['location_name'];
                        $type = $item['location_type'] ?? null; // should be Country

                        return [
                            'code' => (int) $item['location_code'],
                            'name' => $country ? "{$name} ({$country})" : $name,
                            'country_iso_code' => $country,
                            'location_type' => $type,
                        ];
                    })
                    ->sortBy('name')
                    ->values()
                    ->all();
            });

            if (empty($locations)) {
                $locations = $this->fallbackLocations();
            }

            return response()->json([
                'success' => true,
                'data' => $locations,
            ]);
        } catch (\Exception $e) {
            Log::error('Keyword locations fetch error: ' . $e->getMessage());

            return response()->json([
                'success' => true,
                'data' => $this->fallbackLocations(),
                'fallback' => true,
                'message' => 'Loaded fallback locations',
            ]);
        }
    }

    private function fallbackLocations(): array
    {
        return [
            ['code' => 2840, 'name' => 'United States (US)', 'country_iso_code' => 'US'],
            ['code' => 2826, 'name' => 'United Kingdom (GB)', 'country_iso_code' => 'GB'],
            ['code' => 2124, 'name' => 'Canada (CA)', 'country_iso_code' => 'CA'],
            ['code' => 2036, 'name' => 'Australia (AU)', 'country_iso_code' => 'AU'],
            ['code' => 2356, 'name' => 'India (IN)', 'country_iso_code' => 'IN'],
            ['code' => 2276, 'name' => 'Germany (DE)', 'country_iso_code' => 'DE'],
            ['code' => 2250, 'name' => 'France (FR)', 'country_iso_code' => 'FR'],
            ['code' => 2724, 'name' => 'Spain (ES)', 'country_iso_code' => 'ES'],
            ['code' => 2380, 'name' => 'Italy (IT)', 'country_iso_code' => 'IT'],
            ['code' => 2484, 'name' => 'Mexico (MX)', 'country_iso_code' => 'MX'],
        ];
    }
}
