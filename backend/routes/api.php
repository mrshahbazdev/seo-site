<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\ContentBriefController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\KeywordResearchController;
use App\Http\Controllers\Api\OpportunityController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('keywords')->group(function () {
    Route::post('/research', [KeywordResearchController::class, 'search']);
});

Route::prefix('opportunities')->group(function () {
    Route::post('/analyze', [OpportunityController::class, 'analyze']);
});

Route::post('/competitors-spy/analyze', [App\Http\Controllers\Api\CompetitorSpyController::class, 'spy']);

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Sites Management
    Route::prefix('sites')->group(function () {
        Route::get('/', [SiteController::class, 'index']);
        Route::post('/', [SiteController::class, 'store']);
        Route::get('/{id}', [SiteController::class, 'show']);
        Route::put('/{id}', [SiteController::class, 'update']);
        Route::delete('/{id}', [SiteController::class, 'destroy']);

        // Backlinks
        Route::post('/{id}/backlinks/analyze', [\App\Http\Controllers\Api\SiteBacklinkController::class, 'analyze']);
        Route::post('/{id}/backlinks/list', [\App\Http\Controllers\Api\SiteBacklinkController::class, 'list']);
        Route::post('/{siteId}/pages/{pageId}/backlinks/analyze', [\App\Http\Controllers\Api\SiteBacklinkController::class, 'analyzePage']);

        // Site Audits
        Route::post('/{id}/audit/start', [AuditController::class, 'start']);
        Route::get('/{id}/audits', [AuditController::class, 'index']);
        Route::post('/{id}/crawl', [AuditController::class, 'fullCrawl']);
        Route::post('/{id}/crawl/stop', [SiteController::class, 'stopCrawl']);
        Route::get('/{id}/pages', [\App\Http\Controllers\Api\SitePageController::class, 'index']);
        Route::get('/{siteId}/pages/{pageId}', [\App\Http\Controllers\Api\SitePageAnalysisController::class, 'show']);
        Route::post('/{siteId}/pages/{pageId}/analyze', [\App\Http\Controllers\Api\SitePageAnalysisController::class, 'analyzeContent']);
        Route::post('/{siteId}/pages/{pageId}/analyze/deep', [\App\Http\Controllers\Api\SitePageAnalysisController::class, 'analyzeDeep']);
        Route::post('/{siteId}/pages/{pageId}/analyze/speed', [\App\Http\Controllers\Api\SitePageAnalysisController::class, 'analyzeSpeed']);
        Route::post('/{siteId}/pages/{pageId}/analyze/grammar', [\App\Http\Controllers\Api\SitePageAnalysisController::class, 'analyzeGrammar']);
        Route::post('/{siteId}/pages/{pageId}/analyze/paid', [\App\Http\Controllers\Api\SitePageAnalysisController::class, 'analyzePaid']);
        Route::get('/{siteId}/pages/{pageId}/ranked-keywords', [\App\Http\Controllers\Api\SitePageAnalysisController::class, 'rankedKeywords']);

        // On-Page Summary
        Route::post('/{id}/onpage/crawl', [\App\Http\Controllers\Api\SiteOnPageController::class, 'crawl']);
        Route::get('/{id}/onpage/summary', [\App\Http\Controllers\Api\SiteOnPageController::class, 'summary']);
        Route::get('/{id}/onpage/pages', [\App\Http\Controllers\Api\SiteOnPageController::class, 'pages']);
        Route::get('/{id}/onpage/pages/{pageId}/duplicates', [\App\Http\Controllers\Api\SiteOnPageController::class, 'duplicatePeers']);
        Route::get('/{id}/onpage/pages/{pageId}', [\App\Http\Controllers\Api\SiteOnPageController::class, 'pageDetails']);
        Route::get('/{id}/onpage/links', [\App\Http\Controllers\Api\SiteOnPageController::class, 'pageLinks']);
        Route::post('/{id}/onpage/pages/{pageId}/analyze-content', [\App\Http\Controllers\Api\SiteOnPageController::class, 'analyzeContent']);
    });

    // Competitors
    Route::prefix('sites/{siteId}/competitors')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\CompetitorController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\CompetitorController::class, 'store']);
        Route::get('/{competitorId}', [\App\Http\Controllers\Api\CompetitorController::class, 'show']);
        Route::post('/{competitorId}/analyze', [\App\Http\Controllers\Api\CompetitorController::class, 'analyze']);
        Route::get('/{competitorId}/pages', [\App\Http\Controllers\Api\CompetitorController::class, 'pages']);
        Route::delete('/{competitorId}', [\App\Http\Controllers\Api\CompetitorController::class, 'destroy']);
    });

    // Tools
    Route::post('/tools/check-resource', [\App\Http\Controllers\Api\SiteToolsController::class, 'checkResource']);
    Route::post('/tools/gap-analysis', [\App\Http\Controllers\Api\GapAnalysisController::class, 'analyze']);

    // Audits
    Route::prefix('audits')->group(function () {
        Route::get('/{id}', [AuditController::class, 'show']);
        Route::get('/{id}/issues', [AuditController::class, 'issues']);
        Route::post('/{id}/issues/{issueId}/status', [AuditController::class, 'updateIssueStatus']);
    });

    // Content Brief Generation
    Route::prefix('content-brief')->group(function () {
        Route::post('/generate', [ContentBriefController::class, 'generate']);
        Route::get('/', [ContentBriefController::class, 'index']);
        Route::get('/{id}', [ContentBriefController::class, 'show']);
    });
});
