<?php

use App\Models\Site;
use App\Models\SitePage;
use App\Jobs\StartFullCrawlJob;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $site = Site::where('url', 'like', '%jobspic.com%')->first();

    if (!$site) {
        echo "Site jobspic.com not found.\n";
        exit(1);
    }

    echo "Cleaning up external pages for site {$site->url}...\n";

    $host = parse_url($site->url, PHP_URL_HOST);

    // Delete pages that don't match the host
    $deleted = SitePage::where('site_id', $site->id)
        ->where('url', 'not like', "%{$host}%")
        ->delete();

    echo "Deleted {$deleted} external pages.\n";

    // Also delete all pages to start fresh? Maybe just external ones is enough.
    // Let's delete all to be sure we get a clean crawl of internal pages.
    // actually, let's keep internal ones, but the user said "pages bhot km ha" (pages are very few).
    // So maybe we should just start a new crawl to find MORE pages.

    echo "Dispatching new crawl job...\n";
    StartFullCrawlJob::dispatch($site);

    echo "Job dispatched. Please ensure queue worker is running.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
