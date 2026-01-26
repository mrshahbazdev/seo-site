<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SitePage;
use Illuminate\Http\Request;

class SitePageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, $siteId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $site = $user->sites()->findOrFail($siteId);

        $pages = $site->pages()
            ->orderBy('found_at', 'desc')
            ->paginate(50);

        $processingCount = $site->pages()
            ->whereIn('audit_status', ['processing', 'pending'])
            ->count();

        return response()->json([
            'success' => true,
            'pages' => $pages,
            'processing_count' => $processingCount,
        ]);
    }
}
