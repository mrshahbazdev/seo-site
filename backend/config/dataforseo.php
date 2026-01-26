<?php

return [
    /*
    |--------------------------------------------------------------------------
    | DataForSEO API Configuration
    |--------------------------------------------------------------------------
    */

    'api_url' => env('DATAFORSEO_API_URL', 'https://api.dataforseo.com'),
    'login' => env('DATAFORSEO_LOGIN'),
    'password' => env('DATAFORSEO_PASSWORD'),
    'timeout' => env('DATAFORSEO_TIMEOUT', 30),
    'cache_ttl' => env('DATAFORSEO_CACHE_TTL', 86400), // 24 hours

    'rate_limit' => [
        'max_requests_per_minute' => 2000,
        'max_concurrent' => 10,
    ],

    'endpoints' => [
        'serp' => [
            'google_organic_live' => '/serp/google/organic/live/advanced',
            'google_organic_task' => '/serp/google/organic/task_post',
        ],
        'keywords' => [
            'for_keywords' => '/keywords_data/google/keywords_for_keywords/live',
            'search_volume' => '/keywords_data/google/search_volume/live',
            'keyword_difficulty' => '/keywords_data/google/keyword_difficulty/live',
        ],
        'on_page' => [
            'instant_pages' => '/on_page/instant_pages',
        ],
    ],
];
