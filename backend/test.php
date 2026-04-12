<?php
$svc = app(App\Services\DataForSEOService::class);
$site = App\Models\Site::find(1);
dump($svc->getOnPageSummary($site->on_page_task_id, $site->id));
