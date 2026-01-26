<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GooglePageSpeedService
{
    protected $baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.google.pagespeed_api_key');
    }

    /**
     * Run PageSpeed Analysis
     *
     * @param string $url
     * @param string $strategy 'mobile' or 'desktop'
     * @return array
     */
    public function analyze(string $url, string $strategy = 'mobile')
    {
        try {
            $params = [
                'url' => $url,
                'strategy' => strtoupper($strategy),
                'category' => ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'],
            ];

            if ($this->apiKey) {
                $params['key'] = $this->apiKey;
            }

            $response = Http::get($this->baseUrl, $params);

            if ($response->successful()) {
                return $this->formatResponse($response->json());
            }

            Log::error('PageSpeed API Error', ['status' => $response->status(), 'body' => $response->body()]);
            return [
                'error' => true,
                'message' => 'Failed to fetch PageSpeed data',
                'details' => $response->json()
            ];

        } catch (\Exception $e) {
            Log::error('PageSpeed Service Exception: ' . $e->getMessage());
            return ['error' => true, 'message' => $e->getMessage()];
        }
    }

    /**
     * Format the raw API response into a usable structure
     */
    protected function formatResponse(array $data): array
    {
        $lighthouse = $data['lighthouseResult'] ?? [];
        $loadingExperience = $data['loadingExperience'] ?? [];

        return [
            'scores' => [
                'performance' => ($lighthouse['categories']['performance']['score'] ?? 0) * 100,
                'accessibility' => ($lighthouse['categories']['accessibility']['score'] ?? 0) * 100,
                'best_practices' => ($lighthouse['categories']['best-practices']['score'] ?? 0) * 100,
                'seo' => ($lighthouse['categories']['seo']['score'] ?? 0) * 100,
            ],
            'metrics' => [
                'lcp' => $lighthouse['audits']['largest-contentful-paint']['displayValue'] ?? '-',
                'cls' => $lighthouse['audits']['cumulative-layout-shift']['displayValue'] ?? '-',
                'fcp' => $lighthouse['audits']['first-contentful-paint']['displayValue'] ?? '-',
                'tbt' => $lighthouse['audits']['total-blocking-time']['displayValue'] ?? '-',
                'si' => $lighthouse['audits']['speed-index']['displayValue'] ?? '-',
            ],
            // Core Web Vitals (Field Data from CrUX)
            'crux_metrics' => [
                'lcp' => $loadingExperience['metrics']['LARGEST_CONTENTFUL_PAINT_MS']['category'] ?? 'N/A',
                'cls' => $loadingExperience['metrics']['CUMULATIVE_LAYOUT_SHIFT_SCORE']['category'] ?? 'N/A',
                'inp' => $loadingExperience['metrics']['INTERACTION_TO_NEXT_PAINT']['category'] ?? 'N/A',
            ],
            'screenshot' => $lighthouse['audits']['final-screenshot']['details']['data'] ?? null
        ];
    }
}
