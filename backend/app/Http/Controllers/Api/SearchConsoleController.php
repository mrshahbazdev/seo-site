<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class SearchConsoleController extends Controller
{
    private function getValidToken(): ?string
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->google_access_token) {
            return null;
        }

        // Refresh if token is expired or expiring soon
        if (!$user->google_token_expiry || now()->addMinutes(5)->gte($user->google_token_expiry)) {
            $authController = new GoogleAuthController();
            return $authController->refreshToken($user);
        }

        return $user->google_access_token;
    }

    /**
     * Fetch Search Console performance data for a site.
     * Returns clicks, impressions, CTR, and position per day.
     */
    public function performance(Request $request, $siteId): \Illuminate\Http\JsonResponse
    {
        $site = Auth::user()->sites()->findOrFail($siteId);

        $token = $this->getValidToken();

        if (!$token) {
            return response()->json([
                'success'     => false,
                'connected'   => false,
                'message'     => 'Google Search Console not connected. Please connect your Google account.',
            ], 200);
        }

        $days  = $request->integer('days', 28);
        $endDate   = now()->format('Y-m-d');
        $startDate = now()->subDays($days)->format('Y-m-d');

        $siteUrl = 'sc-domain:' . preg_replace('/^https?:\/\//', '', rtrim($site->url, '/'));

        $response = Http::withToken($token)
            ->post("https://searchconsole.googleapis.com/webmasters/v3/sites/" . urlencode($siteUrl) . "/searchAnalytics/query", [
                'startDate'  => $startDate,
                'endDate'    => $endDate,
                'dimensions' => ['date'],
                'rowLimit'   => 90,
            ]);

        if ($response->status() === 403) {
            // Try www-prefixed URL
            $siteUrl = 'https://www.' . preg_replace('/^https?:\/\//', '', rtrim($site->url, '/')) . '/';
            $response = Http::withToken($token)
                ->post("https://searchconsole.googleapis.com/webmasters/v3/sites/" . urlencode($siteUrl) . "/searchAnalytics/query", [
                    'startDate'  => $startDate,
                    'endDate'    => $endDate,
                    'dimensions' => ['date'],
                    'rowLimit'   => 90,
                ]);
        }

        if (!$response->successful()) {
            return response()->json([
                'success'   => false,
                'connected' => true,
                'message'   => 'Could not fetch data. Ensure this site is verified in Google Search Console.',
            ]);
        }

        $rows = collect($response->json('rows', []));

        $chartData = $rows->map(fn($row) => [
            'date'        => $row['keys'][0],
            'clicks'      => $row['clicks'],
            'impressions' => $row['impressions'],
            'ctr'         => round($row['ctr'] * 100, 2),
            'position'    => round($row['position'], 1),
        ])->values();

        // Summary totals
        $totals = [
            'clicks'      => $rows->sum('clicks'),
            'impressions' => $rows->sum('impressions'),
            'avg_ctr'     => $rows->count() ? round($rows->avg('ctr') * 100, 2) : 0,
            'avg_position'=> $rows->count() ? round($rows->avg('position'), 1) : 0,
        ];

        // --- Top Keywords ---
        $kwResponse = Http::withToken($token)
            ->post("https://searchconsole.googleapis.com/webmasters/v3/sites/" . urlencode($siteUrl) . "/searchAnalytics/query", [
                'startDate'  => $startDate,
                'endDate'    => $endDate,
                'dimensions' => ['query'],
                'rowLimit'   => 10,
                'orderBy'    => [['dimension' => null, 'fieldName' => 'clicks', 'sortOrder' => 'DESCENDING']],
            ]);

        $keywords = $kwResponse->successful()
            ? collect($kwResponse->json('rows', []))->map(fn($r) => [
                'query'      => $r['keys'][0],
                'clicks'     => $r['clicks'],
                'impressions'=> $r['impressions'],
                'ctr'        => round($r['ctr'] * 100, 2),
                'position'   => round($r['position'], 1),
            ])->values()
            : [];

        return response()->json([
            'success'    => true,
            'connected'  => true,
            'chart_data' => $chartData,
            'totals'     => $totals,
            'keywords'   => $keywords,
        ]);
    }
}
