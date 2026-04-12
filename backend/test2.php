<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$svc = app(App\Services\DataForSEOService::class);
$site = App\Models\Site::find(1);
dump($svc->getOnPageSummary($site->on_page_task_id, $site->id));
