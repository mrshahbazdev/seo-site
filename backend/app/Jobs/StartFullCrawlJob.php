<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class StartFullCrawlJob implements ShouldQueue
{
    use Queueable;

    protected $site;

    /**
     * Create a new job instance.
     */
    public function __construct(\App\Models\Site $site)
    {
        $this->site = $site;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $observer = new \App\Crawler\SiteCrawlObserver($this->site);

        \Spatie\Crawler\Crawler::create()
            ->setCrawlObserver($observer)
            ->setCrawlProfile(new \App\Crawler\CrawlInternalUrlsAndExclude($this->site->url))
            ->ignoreRobots() // Ignore robots.txt to ensure we find all pages for audit
            ->setMaximumDepth(10) // Limit depth to avoid infinite loops
            ->setTotalCrawlLimit(500) // Limit total pages to control costs
            ->startCrawling($this->site->url);
    }
}
