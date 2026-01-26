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

    echo "Cleaning remaining external pages...\n";

    // Explicitly remove typical external domains found
    SitePage::where('site_id', $site->id)->where('url', 'like', '%twitter.com%')->delete();
    SitePage::where('site_id', $site->id)->where('url', 'like', '%facebook.com%')->delete();
    SitePage::where('site_id', $site->id)->where('url', 'like', '%blogger.com%')->delete();
    SitePage::where('site_id', $site->id)->where('url', 'like', '%dmca.com%')->delete();

    // General cleanup again
    $host = parse_url($site->url, PHP_URL_HOST);
    $deleted = SitePage::where('site_id', $site->id)
        ->where('url', 'not like', "%jobspic.com%") // simple check
        ->delete();

    echo "Deleted total external pages.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
