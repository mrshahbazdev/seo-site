<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class AnalyzePageJob implements ShouldQueue
{
    use Queueable;

    protected $page;

    /**
     * Create a new job instance.
     */
    public function __construct(\App\Models\SitePage $page)
    {
        $this->page = $page;
    }

    /**
     * Execute the job.
     */
    public function handle(\App\Services\AdvancedSeoAnalyzer $analyzer): void
    {
        // Check if crawl is stopped
        if (\Illuminate\Support\Facades\Cache::get("site_{$this->page->site_id}_stop_crawl")) {
            $this->page->update(['audit_status' => 'failed']);
            return;
        }

        try {
            $this->page->update(['audit_status' => 'processing']);

            // Fetch page content
            $startTime = microtime(true);
            $response = \Illuminate\Support\Facades\Http::get($this->page->url);
            $duration = round((microtime(true) - $startTime) * 1000); // ms

            if ($response->successful()) {
                $html = $response->body();
                $analysis = $analyzer->analyze($html, $this->page->url, $duration);

                $this->page->update([
                    'analysis_data' => $analysis,
                    'audit_status' => 'completed',
                ]);

                // Recalculate Site Average Score
                $site = $this->page->site;
                // Efficient calculation: average of all completed pages
                $avgScore = $site->pages()
                    ->whereNotNull('analysis_data')
                    ->get() // We might need to optimize this for huge sites, but ok for now
                    ->avg(fn($p) => $p->analysis_data['score'] ?? 0);

                $site->update(['health_score' => round($avgScore)]);
            } else {
                $this->page->update(['audit_status' => 'failed']);
            }

        } catch (\Exception $e) {
            $this->page->update(['audit_status' => 'failed']);
            \Log::error("Failed to analyze page {$this->page->url}: " . $e->getMessage());
        }
    }
}
