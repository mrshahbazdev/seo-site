<?php

namespace App\Services;

class CompetitorAnalyzer
{
    protected $dataForSEO;

    public function __construct(DataForSEOService $dataForSEO)
    {
        $this->dataForSEO = $dataForSEO;
    }

    /**
     * Analyze competitor pages
     *
     * @param array $urls
     * @return array
     */
    public function analyzeCompetitorPages(array $urls): array
    {
        $competitors = [];

        foreach ($urls as $url) {
            try {
                $pageData = $this->dataForSEO->analyzePageContent($url);

                if (isset($pageData['tasks'][0]['result'][0])) {
                    $result = $pageData['tasks'][0]['result'][0];
                    $competitors[] = $this->extractPageMetrics($result, $url);
                }
            } catch (\Exception $e) {
                // Log error and continue with next URL
                \Log::error('Failed to analyze competitor page', [
                    'url' => $url,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return [
            'competitors' => $competitors,
            'average_metrics' => $this->calculateAverageMetrics($competitors),
            'content_structure' => $this->extractContentStructure($competitors),
            'content_gaps' => $this->identifyContentGaps($competitors),
        ];
    }

    /**
     * Extract page metrics from On-Page API response
     *
     * @param array $pageData
     * @param string $url
     * @return array
     */
    protected function extractPageMetrics(array $pageData, string $url): array
    {
        $meta = $pageData['meta'] ?? [];

        return [
            'url' => $url,
            'domain' => parse_url($url, PHP_URL_HOST),
            'title' => [
                'text' => $meta['title'] ?? '',
                'length' => mb_strlen($meta['title'] ?? ''),
            ],
            'description' => [
                'text' => $meta['description'] ?? '',
                'length' => mb_strlen($meta['description'] ?? ''),
            ],
            'h1' => $meta['htags']['h1'][0] ?? '',
            'h2_headings' => $meta['htags']['h2'] ?? [],
            'h3_headings' => $meta['htags']['h3'] ?? [],
            'word_count' => $meta['content']['plain_text_word_count'] ?? 0,
            'images_count' => $meta['images_count'] ?? 0,
            'internal_links_count' => $meta['internal_links_count'] ?? 0,
            'external_links_count' => $meta['external_links_count'] ?? 0,
            'content_size' => $meta['content']['plain_text_size'] ?? 0,
        ];
    }

    /**
     * Calculate average metrics across competitors
     *
     * @param array $competitors
     * @return array
     */
    public function calculateAverageMetrics(array $competitors): array
    {
        if (empty($competitors)) {
            return [];
        }

        $count = count($competitors);
        $totals = [
            'title_length' => 0,
            'description_length' => 0,
            'word_count' => 0,
            'images_count' => 0,
            'internal_links' => 0,
            'external_links' => 0,
            'h2_count' => 0,
        ];

        foreach ($competitors as $comp) {
            $totals['title_length'] += $comp['title']['length'];
            $totals['description_length'] += $comp['description']['length'];
            $totals['word_count'] += $comp['word_count'];
            $totals['images_count'] += $comp['images_count'];
            $totals['internal_links'] += $comp['internal_links_count'];
            $totals['external_links'] += $comp['external_links_count'];
            $totals['h2_count'] += count($comp['h2_headings']);
        }

        return [
            'avg_title_length' => round($totals['title_length'] / $count),
            'avg_description_length' => round($totals['description_length'] / $count),
            'avg_word_count' => round($totals['word_count'] / $count),
            'avg_images' => round($totals['images_count'] / $count),
            'avg_internal_links' => round($totals['internal_links'] / $count),
            'avg_external_links' => round($totals['external_links'] / $count),
            'avg_h2_count' => round($totals['h2_count'] / $count),
        ];
    }

    /**
     * Extract common content structure from competitors
     *
     * @param array $competitors
     * @return array
     */
    public function extractContentStructure(array $competitors): array
    {
        $allH2s = [];

        foreach ($competitors as $comp) {
            foreach ($comp['h2_headings'] as $h2) {
                $normalized = $this->normalizeHeading($h2);
                if (!isset($allH2s[$normalized])) {
                    $allH2s[$normalized] = [
                        'original' => $h2,
                        'count' => 0,
                    ];
                }
                $allH2s[$normalized]['count']++;
            }
        }

        // Sort by frequency
        uasort($allH2s, function ($a, $b) {
            return $b['count'] - $a['count'];
        });

        $commonTopics = [];
        $uniqueTopics = [];

        foreach ($allH2s as $h2Data) {
            if ($h2Data['count'] >= 3) {
                $commonTopics[] = [
                    'heading' => $h2Data['original'],
                    'found_in' => $h2Data['count'],
                    'priority' => 'high',
                ];
            } elseif ($h2Data['count'] >= 2) {
                $commonTopics[] = [
                    'heading' => $h2Data['original'],
                    'found_in' => $h2Data['count'],
                    'priority' => 'medium',
                ];
            } else {
                $uniqueTopics[] = $h2Data['original'];
            }
        }

        return [
            'common_topics' => $commonTopics,
            'unique_topics' => array_slice($uniqueTopics, 0, 10),
        ];
    }

    /**
     * Identify content gaps
     *
     * @param array $competitors
     * @return array
     */
    public function identifyContentGaps(array $competitors): array
    {
        // Topics covered by some but not all competitors
        $structure = $this->extractContentStructure($competitors);
        $gaps = [];

        foreach ($structure['common_topics'] as $topic) {
            if ($topic['found_in'] < count($competitors) && $topic['found_in'] >= 2) {
                $gaps[] = [
                    'topic' => $topic['heading'],
                    'opportunity' => 'Include this topic - ' . $topic['found_in'] . ' out of ' . count($competitors) . ' competitors cover it',
                ];
            }
        }

        return $gaps;
    }

    /**
     * Normalize heading for comparison
     *
     * @param string $heading
     * @return string
     */
    protected function normalizeHeading(string $heading): string
    {
        // Remove numbers, special chars, convert to lowercase
        $normalized = strtolower($heading);
        $normalized = preg_replace('/[0-9]+\.?\s*/', '', $normalized);
        $normalized = preg_replace('/[^a-z\s]/', '', $normalized);
        $normalized = trim($normalized);

        return $normalized;
    }
}
