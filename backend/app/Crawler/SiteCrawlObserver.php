<?php

namespace App\Crawler;

use App\Jobs\AnalyzePageJob;
use App\Models\Site;
use App\Models\SitePage;
use GuzzleHttp\Exception\RequestException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\UriInterface;
use Spatie\Crawler\CrawlObservers\CrawlObserver;

class SiteCrawlObserver extends CrawlObserver
{
    protected $site;

    public function __construct(Site $site)
    {
        $this->site = $site;
    }

    /**
     * Called when the crawler will crawl the url.
     *
     * @param \Psr\Http\Message\UriInterface $url
     */
    public function willCrawl(UriInterface $url, ?string $linkText): void
    {
        if (\Illuminate\Support\Facades\Cache::get("site_{$this->site->id}_stop_crawl")) {
            throw new \Exception("Crawl stopped by user");
        }
    }

    /**
     * Called when the crawler has crawled the url.
     *
     * @param \Psr\Http\Message\UriInterface $url
     * @param \Psr\Http\Message\ResponseInterface $response
     * @param \Psr\Http\Message\UriInterface|null $foundOnUrl
     */
    public function crawled(
        UriInterface $url,
        ResponseInterface $response,
        ?UriInterface $foundOnUrl = null,
        ?string $linkText = null,
    ): void {
        $urlString = (string) $url;

        // Check if page exists for this site
        $page = SitePage::firstOrCreate(
            [
                'site_id' => $this->site->id,
                'url' => $urlString
            ],
            [
                'is_crawled' => true,
                'found_at' => now(),
            ]
        );

        if ($page->wasRecentlyCreated) {
            // Dispatch job to analyze the page with Lighthouse
            AnalyzePageJob::dispatch($page);
        }
    }

    /**
     * Called when the crawler had a problem crawling the url.
     *
     * @param \Psr\Http\Message\UriInterface $url
     * @param \GuzzleHttp\Exception\RequestException $requestException
     * @param \Psr\Http\Message\UriInterface|null $foundOnUrl
     */
    public function crawlFailed(
        UriInterface $url,
        RequestException $requestException,
        ?UriInterface $foundOnUrl = null,
        ?string $linkText = null,
    ): void {
        // Log failure if needed
    }
}
