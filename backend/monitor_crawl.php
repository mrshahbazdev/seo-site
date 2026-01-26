<?php

use App\Models\Site;
use App\Models\SitePage;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $site = Site::where('url', 'like', '%jobspic.com%')->first();

    if (!$site) {
        throw new Exception("Site not found");
    }

    $pageCount = $site->pages()->count();
    $internalCount = $site->pages()->where('url', 'like', '%jobspic.com%')->count();
    $externalCount = $pageCount - $internalCount;

    echo "Current Page Count: {$pageCount}\n";
    echo "Internal Pages: {$internalCount}\n";
    echo "External Pages: {$externalCount}\n";

    if ($externalCount > 0) {
        $externalParam = $site->pages()->where('url', 'not like', '%jobspic.com%')->take(5)->pluck('url');
        echo "Example External URLs:\n" . implode("\n", $externalParam->toArray()) . "\n";
    }

    $jobs = DB::table('jobs')->count();
    echo "Pending Jobs: {$jobs}\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
