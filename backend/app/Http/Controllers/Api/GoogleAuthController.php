<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class GoogleAuthController extends Controller
{
    protected function clientId(): string
    {
        return config('services.google.client_id');
    }

    protected function clientSecret(): string
    {
        return config('services.google.client_secret');
    }

    protected function redirectUri(): string
    {
        return config('services.google.redirect');
    }

    /**
     * Return the Google OAuth URL for the frontend to redirect to.
     */
    public function redirectUrl(Request $request): \Illuminate\Http\JsonResponse
    {
        $params = http_build_query([
            'client_id'     => $this->clientId(),
            'redirect_uri'  => $this->redirectUri(),
            'response_type' => 'code',
            'scope'         => 'openid email profile https://www.googleapis.com/auth/webmasters.readonly',
            'access_type'   => 'offline',
            'prompt'        => 'consent',
            'state'         => csrf_token(),
        ]);

        return response()->json([
            'url' => 'https://accounts.google.com/o/oauth2/v2/auth?' . $params,
        ]);
    }

    /**
     * Exchange code for tokens and store them.
     */
    public function handleCallback(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $response = Http::post('https://oauth2.googleapis.com/token', [
            'code'          => $request->code,
            'client_id'     => $this->clientId(),
            'client_secret' => $this->clientSecret(),
            'redirect_uri'  => $this->redirectUri(),
            'grant_type'    => 'authorization_code',
        ]);

        if (!$response->successful()) {
            return response()->json(['success' => false, 'message' => 'Failed to exchange code.'], 400);
        }

        $tokens = $response->json();

        // Fetch user email from Google
        $userInfo = Http::withToken($tokens['access_token'])
            ->get('https://www.googleapis.com/oauth2/v3/userinfo')
            ->json();

        /** @var User $user */
        $user = Auth::user();
        $user->update([
            'google_access_token'  => $tokens['access_token'],
            'google_refresh_token' => $tokens['refresh_token'] ?? $user->google_refresh_token,
            'google_token_expiry'  => now()->addSeconds($tokens['expires_in'] ?? 3600),
            'google_email'         => $userInfo['email'] ?? null,
        ]);

        return response()->json([
            'success'      => true,
            'google_email' => $user->google_email,
            'message'      => 'Google Search Console connected successfully!',
        ]);
    }

    /**
     * Revoke & clear Google tokens.
     */
    public function disconnect(Request $request): \Illuminate\Http\JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if ($user->google_access_token) {
            Http::post('https://oauth2.googleapis.com/revoke', [
                'token' => $user->google_access_token,
            ]);
        }

        $user->update([
            'google_access_token'  => null,
            'google_refresh_token' => null,
            'google_token_expiry'  => null,
            'google_email'         => null,
        ]);

        return response()->json(['success' => true, 'message' => 'Google disconnected.']);
    }

    /**
     * Refresh the access token using the stored refresh token.
     */
    public function refreshToken(User $user): ?string
    {
        if (!$user->google_refresh_token) {
            return null;
        }

        $response = Http::post('https://oauth2.googleapis.com/token', [
            'refresh_token' => $user->google_refresh_token,
            'client_id'     => $this->clientId(),
            'client_secret' => $this->clientSecret(),
            'grant_type'    => 'refresh_token',
        ]);

        if ($response->successful()) {
            $tokens = $response->json();
            $user->update([
                'google_access_token' => $tokens['access_token'],
                'google_token_expiry' => now()->addSeconds($tokens['expires_in'] ?? 3600),
            ]);
            return $tokens['access_token'];
        }

        return null;
    }
}
