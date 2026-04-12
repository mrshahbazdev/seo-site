<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\SiteAudit;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    /**
     * Get health score history for a site
     */
    public function scoreHistory(Request $request, $siteId)
    {
        $site = $request->user()->sites()->find($siteId);

        if (!$site) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $history = $site->audits()
            ->where('status', 'completed')
            ->orderBy('created_at', 'asc')
            ->select(['id', 'score', 'pages_crawled', 'issues_found', 'created_at'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }
}
