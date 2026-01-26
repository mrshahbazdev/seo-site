<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$page = \App\Models\SitePage::find(818);
if ($page) {
    echo "Found page 818. Clearing dataforseo data...\n";
    $data = $page->analysis_data;
    if (isset($data['dataforseo'])) {
        unset($data['dataforseo']);
        $page->analysis_data = $data;
        $page->save();
        echo "Data cleared successfully.\n";
    } else {
        echo "No dataforseo data found to clear.\n";
    }
} else {
    echo "Page 818 not found.\n";
}
