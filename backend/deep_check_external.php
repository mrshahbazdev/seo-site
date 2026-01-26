<?php

use App\Models\Site;
use App\Models\SitePage;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $site = Site::where('url', 'like', '%jobspic.com%')->first();

    if (!$site) {
        throw new Exception("Site not found");
    }

    echo "Site ID: {$site->id}\n";
    echo "Total Pages: " . $site->pages()->count() . "\n";

    // Check for specific external domains user mentioned
    $dmca = $site->pages()->where('url', 'like', '%dmca.com%')->get();
    $twitter = $site->pages()->where('url', 'like', '%twitter.com%')->get();

    echo "DMCA Links found: " . $dmca->count() . "\n";
    foreach ($dmca as $p)
        echo " - {$p->url}\n";

    echo "Twitter Links found: " . $twitter->count() . "\n";
    foreach ($twitter as $p)
        echo " - {$p->url}\n";

    // General external check
    $host = parse_url($site->url, PHP_URL_HOST);
    // Remove www. for stricter check? or just check if host is contained.
    // simpler: check if url does NOT contain the host
    $external = $site->pages()->where('url', 'not like', "%jobspic.com%")->get();

    echo "Total 'External' (not containing jobspic.com): " . $external->count() . "\n";
    if ($external->count() > 0) {
        $first5 = $external->take(5);
        foreach ($first5 as $p)
            echo " - {$p->url}\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
