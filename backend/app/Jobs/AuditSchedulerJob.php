<?php

namespace App\Jobs;

use App\Models\Alert;
use App\Models\Site;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AuditSchedulerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $sites = Site::whereNotNull('audit_frequency')
            ->where('audit_frequency', '!=', 'manual')
            ->where(function ($query) {
                $query->whereNull('notifications_enabled')
                    ->orWhere('notifications_enabled', true);
            })
            ->where(function ($query) {
                $query->whereNull('next_audit_at')
                    ->orWhere('next_audit_at', '<=', now());
            })
            ->get();

        foreach ($sites as $site) {
            Log::info("Auto-scheduling audit for site: {$site->domain}");

            // Dispatch the actual crawl job (Assuming StartFullCrawlJob exists)
            // If it's the OnPage crawl, we use the existing service.
            try {
                // Determine the next run time
                $nextRun = $this->calculateNextRun($site->audit_frequency);
                $site->update(['next_audit_at' => $nextRun]);

                // Trigger the crawl (reusing the logic from the controller)
                $job = new \App\Jobs\StartFullCrawlJob($site);
                dispatch($job);

                Alert::create([
                    'site_id' => $site->id,
                    'type' => 'scheduled_audit',
                    'severity' => 'info',
                    'title' => 'Scheduled audit started',
                    'message' => "Automatic {$site->audit_frequency} audit has been started for {$site->domain}.",
                    'payload' => [
                        'frequency' => $site->audit_frequency,
                        'next_run_at' => optional($nextRun)->toDateTimeString(),
                    ],
                ]);

            } catch (\Exception $e) {
                Log::error("Failed to schedule audit for site {$site->id}: " . $e->getMessage());
            }
        }
    }

    protected function calculateNextRun($frequency)
    {
        return match ($frequency) {
            'daily' => now()->addDay(),
            'weekly' => now()->addWeek(),
            'monthly' => now()->addMonth(),
            default => null,
        };
    }
}
