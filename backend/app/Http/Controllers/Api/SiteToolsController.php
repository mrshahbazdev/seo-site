<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SiteToolsController extends Controller
{
    /**
     * Check the HTTP status of a resource (link or image)
     * Proxies the request to avoid CORS issues on frontend
     */
    public function checkResource(Request $request)
    {
        $request->validate([
            'url' => 'required|url'
        ]);

        $url = $request->input('url');

        try {
            // Use HEAD request to save bandwidth
            $response = Http::timeout(5)->head($url);

            return response()->json([
                'success' => true,
                'status_code' => $response->status(),
                'is_broken' => $response->failed(), // 400-500 series
                'mime' => $response->header('Content-Type')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'status_code' => 0,
                'is_broken' => true,
                'error' => $e->getMessage()
            ]);
        }
    }
}
