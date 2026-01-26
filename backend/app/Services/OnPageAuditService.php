<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OnPageAuditService
{
    protected $apiUrl;
    protected $login;
    protected $password;
    protected $dataForSEO;

    public function __construct(DataForSEOService $dataForSEO)
    {
        $this->dataForSEO = $dataForSEO;
        $this->apiUrl = config('dataforseo.api_url');
        $this->login = config('dataforseo.login');
        $this->password = config('dataforseo.password');
    }

    /**
     * Start complete site crawl
     *
     * @param string $domain
     * @param array $options
     * @return array
     */
    public function startSiteCrawl(string $domain, array $options = []): array
    {
        $endpoint = '/on_page/task_post';

        $data = [
            [
                'target' => $domain,
                'max_crawl_pages' => $options['max_pages'] ?? 500,
                'load_resources' => $options['load_resources'] ?? true,
                'enable_javascript' => $options['enable_javascript'] ?? true,
                'store_raw_html' => $options['store_raw_html'] ?? false,
                'custom_js' => $options['custom_js'] ?? null,
                'tag' => $options['tag'] ?? 'site_audit',
            ]
        ];

        $response = $this->dataForSEO->makeRequest($endpoint, $data, true);

        if (isset($response['tasks'][0]['id'])) {
            return [
                'success' => true,
                'task_id' => $response['tasks'][0]['id'],
                'status_code' => $response['status_code'],
            ];
        }

        throw new \Exception('Failed to start site crawl: ' . json_encode($response));
    }

    /**
     * Get crawl results
     *
     * @param string $taskId
     * @return array
     */
    public function getCrawlResults(string $taskId): array
    {
        $endpoint = "/on_page/summary/{$taskId}";

        $response = $this->dataForSEO->makeRequest($endpoint, [], false);

        if (isset($response['tasks'][0]['result'])) {
            return [
                'success' => true,
                'status' => $response['tasks'][0]['status_message'],
                'results' => $response['tasks'][0]['result'][0] ?? null,
            ];
        }

        return [
            'success' => false,
            'status' => 'pending',
        ];
    }

    /**
     * Run Lighthouse audit (Async with Polling)
     *
     * @param string $url
     * @param string $device
     * @return array
     */
    /**
     * Start Lighthouse audit (Async)
     *
     * @param string $url
     * @param string $device
     * @return string Task ID
     */
    public function startLighthouseAudit(string $url, string $device = 'desktop'): string
    {
        $postEndpoint = $this->apiUrl . '/on_page/lighthouse/task_post';

        $postData = [
            [
                'url' => $url,
                'tag' => 'lighthouse_audit',
                'pingback_url' => null
            ]
        ];

        $postResponse = Http::withBasicAuth($this->login, $this->password)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($postEndpoint, $postData)
            ->json();

        if (empty($postResponse['tasks'][0]['id'])) {
            throw new \Exception('Failed to start Lighthouse task: ' . json_encode($postResponse));
        }

        return $postResponse['tasks'][0]['id'];
    }

    /**
     * Fetch Lighthouse results
     *
     * @param string $taskId
     * @return array|null Returns results array if done, null if processing
     */
    public function fetchLighthouseResults(string $taskId): ?array
    {
        $getEndpoint = $this->apiUrl . '/on_page/lighthouse/task_get/json/' . $taskId;

        $getResponse = Http::withBasicAuth($this->login, $this->password)
            ->withHeaders(['Content-Type' => 'application/json'])
            ->get($getEndpoint)
            ->json();

        if (isset($getResponse['tasks'][0]['status_code']) && $getResponse['tasks'][0]['status_code'] === 20000) {
            if (isset($getResponse['tasks'][0]['result'][0])) {
                $result = $getResponse['tasks'][0]['result'][0];

                return [
                    'scores' => [
                        'performance' => ($result['categories']['performance']['score'] ?? 0) * 100,
                        'accessibility' => ($result['categories']['accessibility']['score'] ?? 0) * 100,
                        'best_practices' => ($result['categories']['best-practices']['score'] ?? 0) * 100,
                        'seo' => ($result['categories']['seo']['score'] ?? 0) * 100,
                    ],
                    'metrics' => $result['audits'] ?? [],
                    'full_result' => $result,
                ];
            }
        }

        return null;
    }

    /**
     * Check for duplicate content
     *
     * @param string $taskId
     * @return array
     */
    public function checkDuplicateContent(string $taskId): array
    {
        $endpoint = "/on_page/duplicate_tags/{$taskId}";

        $response = $this->dataForSEO->makeRequest($endpoint, [], false);

        if (isset($response['tasks'][0]['result'])) {
            $duplicates = $response['tasks'][0]['result'][0] ?? [];

            return [
                'success' => true,
                'duplicate_titles' => $duplicates['duplicate_title'] ?? [],
                'duplicate_descriptions' => $duplicates['duplicate_description'] ?? [],
                'duplicate_h1' => $duplicates['duplicate_h1'] ?? [],
            ];
        }

        return ['success' => false];
    }

    /**
     * Check indexation issues
     *
     * @param string $taskId
     * @return array
     */
    public function checkIndexationIssues(string $taskId): array
    {
        $endpoint = "/on_page/non_indexable/{$taskId}";

        $response = $this->dataForSEO->makeRequest($endpoint, [], false);

        if (isset($response['tasks'][0]['result'])) {
            $issues = $response['tasks'][0]['result'][0] ?? [];

            return [
                'success' => true,
                'blocked_by_robots' => $issues['blocked_by_robots_txt'] ?? [],
                'noindex_pages' => $issues['no_index'] ?? [],
                'canonical_issues' => $issues['canonical'] ?? [],
                'orphan_pages' => $issues['orphan_pages'] ?? [],
            ];
        }

        return ['success' => false];
    }

    /**
     * Parse crawl results and extract issues
     *
     * @param array $results
     * @param string $auditType
     * @return array
     */
    public function extractIssues(array $results, string $auditType = 'full_crawl'): array
    {
        $issues = [];

        // For Lighthouse audits, extract from metrics
        if ($auditType === 'lighthouse' && isset($results['metrics'])) {
            foreach ($results['metrics'] as $key => $metric) {
                if (isset($metric['score']) && $metric['score'] < 0.9 && isset($metric['title'])) {
                    $severity = 'low';
                    if ($metric['score'] < 0.5)
                        $severity = 'critical';
                    elseif ($metric['score'] < 0.7)
                        $severity = 'high';
                    elseif ($metric['score'] < 0.9)
                        $severity = 'medium';

                    $issues[] = [
                        'category' => $this->getCategoryFromMetric($key),
                        'severity' => $severity,
                        'type' => $key,
                        'description' => $metric['title'] . (isset($metric['description']) ? ': ' . substr($metric['description'], 0, 200) : ''),
                        'recommendation' => $metric['displayValue'] ?? 'Review and optimize this metric',
                    ];
                }
            }
        }

        // Check for broken links
        if (isset($results['broken_links'])) {
            foreach ($results['broken_links'] as $link) {
                $issues[] = [
                    'category' => 'technical',
                    'severity' => 'high',
                    'type' => 'broken_link',
                    'page_url' => $link['page_from_url'] ?? '',
                    'description' => "Broken link found: {$link['url_to']}",
                    'recommendation' => 'Fix or remove the broken link',
                ];
            }
        }

        // Check for missing meta descriptions
        if (isset($results['pages'])) {
            foreach ($results['pages'] as $page) {
                if (empty($page['meta']['description'])) {
                    $issues[] = [
                        'category' => 'seo',
                        'severity' => 'medium',
                        'type' => 'missing_meta_description',
                        'page_url' => $page['url'],
                        'description' => 'Page is missing meta description',
                        'recommendation' => 'Add a unique meta description (150-160 characters)',
                    ];
                }

                // Check for missing title
                if (empty($page['meta']['title'])) {
                    $issues[] = [
                        'category' => 'seo',
                        'severity' => 'critical',
                        'type' => 'missing_title',
                        'page_url' => $page['url'],
                        'description' => 'Page is missing title tag',
                        'recommendation' => 'Add a unique, descriptive title tag',
                    ];
                }

                // Check for slow pages
                if (
                    isset($page['page_timing']['time_to_interactive']) &&
                    $page['page_timing']['time_to_interactive'] > 3000
                ) {
                    $issues[] = [
                        'category' => 'performance',
                        'severity' => 'medium',
                        'type' => 'slow_page',
                        'page_url' => $page['url'],
                        'description' => "Page load time: {$page['page_timing']['time_to_interactive']}ms",
                        'recommendation' => 'Optimize images, minify CSS/JS, enable caching',
                    ];
                }
            }
        }

        return $issues;
    }

    /**
     * Get category from metric key
     */
    private function getCategoryFromMetric(string $key): string
    {
        if (str_contains($key, 'performance') || str_contains($key, 'speed') || str_contains($key, 'load')) {
            return 'performance';
        }
        if (str_contains($key, 'accessibility') || str_contains($key, 'aria') || str_contains($key, 'contrast')) {
            return 'accessibility';
        }
        if (str_contains($key, 'seo') || str_contains($key, 'meta') || str_contains($key, 'crawl')) {
            return 'seo';
        }
        return 'technical';
    }

    /**
     * Calculate overall health score
     *
     * @param array $issues
     * @return int
     */
    public function calculateHealthScore(array $issues): int
    {
        $score = 100;

        // Deduct points based on issue severity
        foreach ($issues as $issue) {
            switch ($issue['severity']) {
                case 'critical':
                    $score -= 10;
                    break;
                case 'high':
                    $score -= 5;
                    break;
                case 'medium':
                    $score -= 2;
                    break;
                case 'low':
                    $score -= 1;
                    break;
            }
        }

        return max(0, min(100, $score));
    }
}
