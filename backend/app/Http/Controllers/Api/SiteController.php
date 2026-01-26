<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Services\OnPageAuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SiteController extends Controller
{
    /**
     * List user's sites
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
                'sites' => []
            ], 401);
        }

        $sites = $user->sites()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'sites' => $sites,
        ]);
    }

    /**
     * Add new site
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'domain' => 'required|string|max:255',
            'name' => 'required|string|max:255',
        ]);

        // Normalize domain
        $domain = preg_replace('/^https?:\/\//', '', $validated['domain']);
        $domain = rtrim($domain, '/');

        $site = Auth::user()->sites()->create([
            'domain' => $domain,
            'url' => 'https://' . $domain,
            'name' => $validated['name'],
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'site' => $site,
            'message' => 'Site added successfully',
        ], 201);
    }

    /**
     * Get site details
     */
    public function show($id)
    {
        $site = Auth::user()->sites()
            ->with([
                'audits' => function ($query) {
                    $query->orderBy('created_at', 'desc')->limit(10);
                }
            ])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'site' => $site,
        ]);
    }

    /**
     * Update site
     */
    public function update(Request $request, $id)
    {
        $site = Auth::user()->sites()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,paused,deleted',
        ]);

        $site->update($validated);

        return response()->json([
            'success' => true,
            'site' => $site,
            'message' => 'Site updated successfully',
        ]);
    }

    /**
     * Delete site
     */
    public function destroy($id)
    {
        $site = Auth::user()->sites()->findOrFail($id);
        $site->delete();

        return response()->json([
            'success' => true,
            'message' => 'Site deleted successfully',
        ]);
    }
    /**
     * Stop crawling for a site
     */
    public function stopCrawl($id)
    {
        $site = Auth::user()->sites()->findOrFail($id);

        // Set cache key to signal observer to stop (for 10 minutes)
        \Illuminate\Support\Facades\Cache::put("site_{$id}_stop_crawl", true, 600);

        // Reset pending AND processing pages to failed
        $site->pages()
            ->whereIn('audit_status', ['pending', 'processing'])
            ->update(['audit_status' => 'failed']);

        return response()->json([
            'success' => true,
            'message' => 'Crawl stopping initiated.',
        ]);
    }
}
