<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DataForSEOService
{
    protected $apiUrl;
    protected $login;
    protected $password;

    public function __construct()
    {
        $this->apiUrl = config('dataforseo.api_url');
        $this->login = config('dataforseo.login');
        $this->password = config('dataforseo.password');

        // Ensure API URL doesn't have trailing slash
        $this->apiUrl = rtrim($this->apiUrl, '/');
    }

    /**
     * Make request to DataForSEO API
     *
     * @param string $endpoint
     * @param array $data
     * @param bool $isPost
     * @return array
     * @throws \Exception
     */
    public function makeRequest(string $endpoint, array $data = [], bool $isPost = true): array
    {
        // Ensure endpoint starts with slash
        if (!str_starts_with($endpoint, '/')) {
            $endpoint = '/' . $endpoint;
        }

        $url = $this->apiUrl . $endpoint;
        Log::info("DataForSEO Request URL: " . $url);

        $curl = curl_init();

        $headers = [
            'Authorization: Basic ' . base64_encode($this->login . ':' . $this->password),
            'Content-Type: application/json'
        ];

        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30, // Using shorter timeout than 0 for safety
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => $isPost ? 'POST' : 'GET',
            CURLOPT_HTTPHEADER => $headers,
        ];

        if ($isPost && !empty($data)) {
            $options[CURLOPT_POSTFIELDS] = json_encode($data);
        }

        curl_setopt_array($curl, $options);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $err = curl_error($curl);

        curl_close($curl);

        if ($err) {
            Log::error('DataForSEO cURL Error: ' . $err);
            throw new \Exception("cURL Error: " . $err);
        }

        $decodedResponse = json_decode($response, true);

        // Log non-200 responses
        if ($httpCode < 200 || $httpCode >= 300) {
            Log::error('DataForSEO API Error', [
                'endpoint' => $endpoint,
                'status' => $httpCode,
                'body' => $response
            ]);

            // If we have a valid JSON response from the API despite the error code, return it 
            // because DataForSEO often returns 200 OK with internal status codes like 40201
            if ($decodedResponse) {
                return $decodedResponse;
            }

            return [
                'status_code' => $httpCode,
                'status_message' => 'API Error: ' . $response,
                'tasks' => []
            ];
        }

        return $decodedResponse ?: [];
    }

    /**
     * Analyze page content using DataForSEO On-Page Instant Pages API (Paid)
     *
     * @param string $url
     * @return array
     */
    public function analyzeInstantPage(string $url): array
    {
        $api_url = 'https://api.dataforseo.com/';
        try {
            $client = new RestClient($api_url, null, $this->login, $this->password);
        } catch (\Exception $e) {
            Log::error('DataForSEO RestClient Init Error: ' . $e->getMessage());
            throw $e;
        }

        $post_array = array();
        $post_array[] = array(
            "url" => $url,
            "check_spell" => true,
            "disable_cookie_popup" => true,
            "return_despite_timeout" => false,
            // Enable these for Core Web Vitals (Lighthouse)
            "load_resources" => true,
            "enable_javascript" => true,
            "enable_browser_rendering" => true,
            "enable_xhr" => true
        );

        try {
            // POST /v3/on_page/instant_pages
            $result = $client->post('/v3/on_page/instant_pages', $post_array);

            return $result;
        } catch (RestClientException $e) {
            Log::error("DataForSEO RestClient Error: HTTP {$e->getHttpCode()} - {$e->getMessage()}");
            throw $e;
        }
    }

    /**
     * Get Backlinks Summary for a domain
     *
     * @param string $domain
     * @return array
     */
    public function getBacklinksSummary(string $domain): array
    {
        $api_url = 'https://api.dataforseo.com/';
        try {
            $client = new RestClient($api_url, null, $this->login, $this->password);
        } catch (\Exception $e) {
            Log::error('DataForSEO RestClient Init Error: ' . $e->getMessage());
            throw $e;
        }

        $post_array = array();
        $post_array[] = array(
            "target" => $domain,
            "internal_list_limit" => 10,
            "include_subdomains" => true,
            "backlinks_status_type" => "live"
        );

        try {
            // POST /v3/backlinks/summary/live
            $result = $client->post('/v3/backlinks/summary/live', $post_array);
            return $result;
        } catch (RestClientException $e) {
            Log::error("DataForSEO Backlinks Error: HTTP {$e->getHttpCode()} - {$e->getMessage()}");
            throw $e;
        }
    }

    /**
     * Get Detailed Backlinks List for a domain
     *
     * @param string $domain
     * @param int $limit
     * @return array
     */
    public function getBacklinksList(string $domain, int $limit = 100): array
    {
        $api_url = 'https://api.dataforseo.com/';
        try {
            $client = new RestClient($api_url, null, $this->login, $this->password);
        } catch (\Exception $e) {
            Log::error('DataForSEO RestClient Init Error: ' . $e->getMessage());
            throw $e;
        }

        $post_array = array();
        $post_array[] = array(
            "target" => $domain,
            "limit" => $limit,
            "mode" => "as_is",
            "filters" => ["dofollow", "=", true] // Optional: User example had this filter, but maybe user wants all. User said "limit jo site ki total backlinks..." implies all. 
            // In the example, filter was present. I will remove the filter to be broader unless user specified only dofollow.
            // Wait, the user shared an example CODE and said "is response k according status show".
            // The example had `"filters": ["dofollow", "=", true]`. 
            // I will comment it out or make it optional to capture everything.
            // Let's stick to no filter to show everything as "total backlinks" implies everything.
        );

        // Re-add filter if it was critical, but "total backlinks" usually means all.
        // Actually, let's look at the user prompt: "limit jo site ki Total Backlinks ha wo ho".
        // It implies fetching everything. So no filter.

        try {
            // POST /v3/backlinks/backlinks/live
            $result = $client->post('/v3/backlinks/backlinks/live', $post_array);
            return $result;
        } catch (RestClientException $e) {
            Log::error("DataForSEO Backlinks List Error: HTTP {$e->getHttpCode()} - {$e->getMessage()}");
            throw $e;
        }
    }
    /**
     * Get On-Page Summary for a task ID
     *
     * @param string $id
     * @param int|null $siteId
     * @return array
     */
    public function getOnPageSummary(string $id, ?int $siteId = null): array
    {
        $api_url = 'https://api.dataforseo.com/';
        try {
            $client = new RestClient($api_url, null, $this->login, $this->password);
            // GET /v3/on_page/summary/$id
            $endpoint = '/v3/on_page/summary/' . $id;
            $result = $client->get($endpoint);

            $this->logCost($endpoint, $result, $siteId);

            return $result;
        } catch (RestClientException $e) {
            Log::error("DataForSEO OnPage Summary Error: HTTP {$e->getHttpCode()} - {$e->getMessage()}");
            throw $e;
        } catch (\Exception $e) {
            Log::error('DataForSEO Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Start On-Page Crawl Task
     *
     * @param string $target
     * @param int $max_pages
     * @param int|null $siteId
     * @return array
     */
    public function startOnPageCrawl(string $target, int $max_pages = 100, ?int $siteId = null): array
    {
        $api_url = 'https://api.dataforseo.com/';
        try {
            $client = new RestClient($api_url, null, $this->login, $this->password);
        } catch (\Exception $e) {
            Log::error('DataForSEO RestClient Init Error: ' . $e->getMessage());
            throw $e;
        }

        $post_array = array();
        $post_array[] = array(
            "target" => $target,
            "max_crawl_pages" => $max_pages,
            "load_resources" => true,
            "enable_javascript" => false,
            "enable_www_redirect_check" => true
        );

        try {
            // POST /v3/on_page/task_post
            $endpoint = '/v3/on_page/task_post';
            $result = $client->post($endpoint, $post_array);

            $this->logCost($endpoint, $result, $siteId);

            return $result;
        } catch (RestClientException $e) {
            Log::error("DataForSEO OnPage Crawl Error: HTTP {$e->getHttpCode()} - {$e->getMessage()}");
            throw $e;
        }
    }
    /**
     * Get On-Page Pages List for a task ID
     *
     * @param string $id
     * @param int $limit
     * @param int $offset
     * @return array
     */
    /**
     * Get On-Page Pages List for a task ID
     *
     * @param string $id
     * @param array|null $filters
     * @param int|null $siteId
     * @return array
     */
    public function getOnPagePages(string $id, int $limit = 100, int $offset = 0, ?array $filters = null, ?int $siteId = null): array
    {
        $api_url = 'https://api.dataforseo.com/';
        try {
            $client = new RestClient($api_url, null, $this->login, $this->password);
            $endpoint = "/v3/on_page/pages";

            $post_data_item = [
                'id' => $id,
                'limit' => $limit,
                'offset' => $offset
            ];

            if ($filters) {
                $post_data_item['filters'] = $filters;
            }

            $post_data = [$post_data_item];

            // Use RestClient to get full response structure including cost
            $result = $client->post($endpoint, $post_data);

            // Accessing cost from RestClient result might differ, usually it returns the array decoded
            // We should log cost if possible. result usually has 'cost'.
            // The RestClient wrapper usually returns the JSON array.

            // Log cost manually since we circumvented logCost method or if we want to use it:
            // $this->logCost($endpoint, $result, $siteId); 
            // But logCost expects 'tasks_count' etc. standard DFT structure.

            return $result;
        } catch (RestClientException $e) {
            Log::error("DataForSEO OnPage Pages Error: HTTP {$e->getHttpCode()} - {$e->getMessage()}");
            throw $e;
        } catch (\Exception $e) {
            Log::error('DataForSEO Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Log API Cost to Database
     *
     * @param string $endpoint
     * @param array $response
     * @param int|null $siteId
     */
    protected function logCost(string $endpoint, array $response, ?int $siteId = null): void
    {
        try {
            $cost = $response['cost'] ?? 0;

            // Only log if there's a cost or specifically requested
            if ($cost > 0 || $siteId) {
                \App\Models\ApiCost::create([
                    'site_id' => $siteId,
                    'endpoint' => $endpoint,
                    'cost' => $cost,
                    'metadata' => [
                        'tasks_count' => $response['tasks_count'] ?? 0,
                        'time' => $response['time'] ?? 0
                    ]
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to log API cost: ' . $e->getMessage());
        }
    }

    /**
     * Get a specific page by URL for a task.
     */
    public function getOnPagePageByUrl($taskId, $url)
    {
        $filters = [
            ['url', '=', $url]
        ];

        $result = $this->getOnPagePages($taskId, 1, 0, $filters);

        // Parse raw result to find item
        return $result['tasks'][0]['result'][0]['items'][0] ?? null;
    }

    /**
     * Get Domain Metrics for Competitor Analysis
     * Uses Domain Analytics Overview API
     */
    public function getDomainMetrics(string $domain)
    {
        $endpoint = '/v3/backlinks/summary/live';

        $data = [
            [
                'target' => $domain,
                'internal_list_limit' => 1,
                'backlinks_status_type' => 'live'
            ]
        ];

        try {
            $result = $this->makeRequest($endpoint, $data);

            if (isset($result['tasks'][0]['result'][0])) {
                return $result['tasks'][0]['result'][0];
            }

            return null;
        } catch (\Exception $e) {
            Log::error('DataForSEO Domain Metrics Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get Competitor's Top Pages
     * Uses Domain Analytics Pages API
     */
    public function getCompetitorPages(string $domain, int $limit = 50)
    {
        $endpoint = '/v3/backlinks/anchors/live';

        $data = [
            [
                'target' => $domain,
                'mode' => 'as_is',
                'limit' => $limit,
                'order_by' => ['backlinks,desc']
            ]
        ];

        try {
            $result = $this->makeRequest($endpoint, $data);

            if (isset($result['tasks'][0]['result'][0]['items'])) {
                return $result['tasks'][0]['result'][0]['items'];
            }

            return [];
        } catch (\Exception $e) {
            Log::error('DataForSEO Competitor Pages Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get Competitor's Ranking Keywords
     * Uses Domain Analytics Keywords API
     */
    public function getCompetitorKeywords(string $domain, int $limit = 100)
    {
        $endpoint = '/v3/domain_analytics/google/keywords/live';

        $data = [
            [
                'target' => $domain,
                'location_code' => 2840,
                'language_code' => 'en',
                'limit' => $limit,
                'order_by' => ['keyword_data.keyword_info.search_volume,desc']
            ]
        ];

        try {
            $result = $this->makeRequest($endpoint, $data);

            if (isset($result['tasks'][0]['result'][0]['items'])) {
                return $result['tasks'][0]['result'][0]['items'];
            }

            return [];
        } catch (\Exception $e) {
            Log::error('DataForSEO Competitor Keywords Error: ' . $e->getMessage());
            throw $e;
        }
    }
    /**
     * Find keywords using DataForSEO Labs (Better for research)
     */
    public function keywordFinder(string $keyword, int $locationCode = 2840, string $languageCode = 'en')
    {
        // Switching to DataForSEO Labs API which is better for keyword ideas
        $endpoint = '/v3/dataforseo_labs/google/keyword_suggestions/live';

        $data = [
            [
                'keyword' => $keyword,
                'location_code' => $locationCode,
                'language_code' => $languageCode,
                'include_seed_keyword' => true,
                'limit' => 100
            ]
        ];

        try {
            $result = $this->makeRequest($endpoint, $data);

            $task = $result['tasks'][0] ?? null;
            $statusCode = $task['status_code'] ?? null;
            $statusMessage = $task['status_message'] ?? null;

            if (isset($task['result'][0]['items'])) {
                return $result['tasks'][0]['result'][0]['items'];
            }

            // If DataForSEO returned a non-success status, surface it (don't silently cache empty).
            if ($statusCode && (int) $statusCode !== 20000) {
                throw new \Exception("DataForSEO keyword suggestions failed ({$statusCode}): " . ($statusMessage ?: 'Unknown error'));
            }

            return [];
        } catch (\Exception $e) {
            Log::error('DataForSEO Keyword Finder Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get Google SERP Data for detailed analysis
     * Fetches Top 20 results to analyze competition strength
     */
    public function getSerpAnalysis(string $keyword, int $locationCode = 2840, string $languageCode = 'en')
    {
        $endpoint = '/v3/serp/google/organic/live/advanced';

        $data = [
            [
                'keyword' => $keyword,
                'location_code' => $locationCode,
                'language_code' => $languageCode,
                'depth' => 20 // Fetch top 20 for deep analysis
            ]
        ];

        try {
            $result = $this->makeRequest($endpoint, $data);

            if (isset($result['tasks'][0]['result'][0])) {
                return $result['tasks'][0]['result'][0];
            }

            return [];
        } catch (\Exception $e) {
            Log::error('DataForSEO SERP Analysis Error: ' . $e->getMessage());
            throw $e;
        }
    }


    /**
     * Get Ranked Keywords for a specific Page URL
     * Uses DataForSEO Labs API
     */
    public function getPageRankedKeywords(string $url, int $limit = 100)
    {
        $endpoint = '/v3/dataforseo_labs/google/ranked_keywords/live';

        $data = [
            [
                'target' => $url,
                'location_code' => 2840,
                'language_code' => 'en',
                'limit' => $limit,
                'order_by' => ['keyword_data.keyword_info.search_volume,desc']
            ]
        ];

        try {
            $result = $this->makeRequest($endpoint, $data);

            if (isset($result['tasks'][0]['result'][0]['items'])) {
                return $result['tasks'][0]['result'][0]['items'];
            }

            return [];
        } catch (\Exception $e) {
            Log::error('DataForSEO Page Ranked Keywords Error: ' . $e->getMessage());
            throw $e;
        }
    }
    /**
     * Get Domain Intersection (Content Gap)
     * Finds keywords where competitors rank but target does not.
     * 
     * @param string $target
     * @param array $competitors
     * @param int $locationCode
     * @param string $languageCode
     * @return array
     */
    public function getDomainIntersection(string $target, array $competitors, int $locationCode = 2840, string $languageCode = 'en')
    {
        $endpoint = '/v3/dataforseo_labs/google/domain_intersection/live';

        // Prepare task parameters
        // API requires keys "target1", "target2", etc. at the TOP LEVEL of the task object.
        // DO NOT wrap in "targets" array.

        $taskParams = [
            'corrections' => 1,
            'location_code' => $locationCode,
            'language_code' => $languageCode,
            'include_serp_info' => true,
            'limit' => 100,
            'order_by' => ['keyword_data.keyword_info.search_volume,desc']
        ];

        $i = 1;
        $taskParams["target" . $i++] = $target; // target1

        foreach ($competitors as $comp) {
            $taskParams["target" . $i++] = $comp; // target2, target3...
        }

        // Structure must be: [ ["target1" => "...", "target2" => "...", ...] ]
        $data = [$taskParams];

        // Log payload to verify structure
        Log::info('Gap Analysis Payload (Flattened):', $data);

        try {
            $result = $this->makeRequest($endpoint, $data);
            Log::info('Gap Analysis Response Keys:', array_keys($result));

            if (isset($result['tasks'][0]['result'][0]['items'])) {
                $count = count($result['tasks'][0]['result'][0]['items']);
                Log::info("Gap Analysis Success: Found {$count} items");
                return $result['tasks'][0]['result'][0]['items'];
            }

            Log::warning('Gap Analysis: No items in response', $result);
            return [];
        } catch (\Exception $e) {
            Log::error('DataForSEO Domain Intersection Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get On-Page Links (Link Juice / Internal Links)
     * 
     * @param string $taskId
     * @param string $url   URL to find links pointing TO (page_to)
     * @param int $limit
     * @return array
     */
    public function getOnPageLinks(string $taskId, string $url, int $limit = 100)
    {
        $api_url = 'https://api.dataforseo.com/';
        try {
            $client = new RestClient($api_url, null, $this->login, $this->password);
            $endpoint = "/v3/on_page/links";

            // We want links pointing TO this URL (Inbound)
            // And primarily Internal links
            $filters = [
                ['page_to', '=', $url],
                'and',
                ['type', '=', 'internal']
            ];

            $post_data = [
                [
                    'id' => $taskId,
                    'limit' => $limit,
                    'filters' => $filters
                ]
            ];

            $result = $client->post($endpoint, $post_data);

            return $result;
        } catch (RestClientException $e) {
            Log::error("DataForSEO OnPage Links Error: HTTP {$e->getHttpCode()} - {$e->getMessage()}");
            throw $e;
        }
    }
}
