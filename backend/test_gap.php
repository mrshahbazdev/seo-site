<?php

try {
    echo "Starting Gap Analysis Test...\n";
    $service = app(App\Services\DataForSEOService::class);

    // Test Inputs
    $target = 'jobspic.com';
    $competitors = ['rozee.pk'];

    echo "Target: $target\n";
    echo "Competitors: " . implode(', ', $competitors) . "\n";

    $results = $service->getDomainIntersection($target, $competitors);

    echo "Count: " . count($results) . "\n";

    if (count($results) > 0) {
        echo "Example Item:\n";
        print_r($results[0]);
    } else {
        echo "No results returned.\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
