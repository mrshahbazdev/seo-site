<?php

namespace App\Services;

use App\Models\KeywordAnalysis;

class RankingOpportunityService
{
    protected $dataForSEO;

    public function __construct(DataForSEOService $dataForSEO)
    {
        $this->dataForSEO = $dataForSEO;
    }

    /**
     * Analyze a keyword and calculate ranking weakness score
     */
    public function analyzeKeyword(string $keyword)
    {
        // 1. Fetch Top 20 SERP Data
        $serpData = $this->dataForSEO->getSerpAnalysis($keyword);

        if (empty($serpData) || !isset($serpData['items'])) {
            throw new \Exception("No SERP data found for keyword: $keyword");
        }

        // 2. Fetch Keyword Metrics (Volume, CPC)
        // Note: keywordFinder returns an array of items. We need the first one matching our keyword.
        $metricsItems = $this->dataForSEO->keywordFinder($keyword);
        $metrics = $metricsItems[0]['keyword_info'] ?? [];

        $items = $serpData['items'] ?? [];
        $paa = $serpData['people_also_ask'] ?? [];
        $related = $serpData['related_searches'] ?? [];

        // 3. Calculate Metrics
        $analysis = $this->calculateMetrics($keyword, $items, $paa, $related, $metrics);

        // 4. Save to Database
        return KeywordAnalysis::updateOrCreate(
            ['keyword' => $keyword],
            [
                'serp_data' => $serpData,
                'difficulty_score' => $analysis['difficulty_score'],
                'opportunity_score' => $analysis['opportunity_score'],
                'title_matches' => $analysis['title_matches'],
                'avg_da' => $analysis['avg_da'],
                'forum_count' => $analysis['forum_count'],
                'intent' => $analysis['intent'],
                // New Metrics
                'search_volume' => $metrics['search_volume'] ?? 0,
                'cpc' => $metrics['cpc'] ?? 0,
                'competition' => $metrics['competition_level'] === 'HIGH' ? 1.0 : ($metrics['competition_level'] === 'MEDIUM' ? 0.5 : 0.1),
                'paa_data' => $paa,
                'related_data' => $related
            ]
        );
    }

    /**
     * Core Algorithm: Calculate Opportunity Score
     */
    protected function calculateMetrics(string $keyword, array $items, array $paa = [], array $related = [], array $metrics = [])
    {
        $top10 = array_slice($items, 0, 10);

        $titleMatches = 0;
        $totalDA = 0; // Using Domain Authority or Rank
        $forumCount = 0;
        $adsCount = 0; // Need to check separate result, but for now focus on organic

        $forums = ['quora.com', 'reddit.com', 'pinterest.com', 'facebook.com', 'medium.com', 'linkedin.com'];

        $keywordLower = strtolower($keyword);

        foreach ($top10 as $item) {
            $title = strtolower($item['title'] ?? '');
            $domain = $item['domain'] ?? '';
            $rank = $item['rank_group'] ?? 0; // Rank position

            // 1. Title Match Check (Exact Match is Strong)
            if (str_contains($title, $keywordLower)) {
                $titleMatches++;
            }

            // 2. "Weakness" Check - Forums
            foreach ($forums as $forum) {
                if (str_contains($domain, $forum)) {
                    $forumCount++;
                }
            }

            // 3. DA (Rank) Proxy - Usually external API needed for true DA. 
            // We'll use DataForSEO's 'domain_rank' if avl, or Rank Group as proxy.
            // For now, let's assume 'rank_absolute' is a signal.
            // Wait, DataForSEO SERP items have 'rank_absolute' etc. but NOT DA directly in SERP item.
            // We'd need domain_analytics for DA. 
            // WORKAROUND: Use "Forum Presence" as a major Low DA proxy.
            // If Forum is in Top 10, it implies Low DA competition.
        }

        // --- Custom Scoring Formula ---

        // Base Difficulty (0-100)
        $difficulty = 0;

        // Factor 1: Title Matches (Weight: 40%)
        // If 10/10 have exact title, KD += 40. If 0/10, KD += 0.
        $difficulty += ($titleMatches / 10) * 40;

        // Factor 2: Forum Presence (Analysis of Weakness)
        // If forums exist, it REDUCES difficulty.
        // Each forum found reduces KD by 10 points.
        $difficulty -= ($forumCount * 10);

        // Factor 3: Content/Intent (Simplified)
        // Longer keywords (>4 words) usually easier.
        $wordCount = str_word_count($keyword);
        if ($wordCount >= 4) {
            $difficulty -= 10;
        }

        // Normalize Score (Main between 0-100)
        $difficulty = max(5, min(95, $difficulty));
        // Example: 10 matches = 40. No forums = 40. Short keyword = 40. Total 40 (Medium).
        // Example: 2 matches = 8. 2 forums = -20. Long keyword = -10. Total -22 -> Clamped to 5 (Very Easy).

        $opportunityScore = 100 - $difficulty;

        // Simple Intent Classification
        $intent = 'informational';
        if (str_contains($keywordLower, 'buy') || str_contains($keywordLower, 'price') || str_contains($keywordLower, 'cheap')) {
            $intent = 'commercial';
        }

        return [
            'difficulty_score' => round($difficulty, 1),
            'opportunity_score' => round($opportunityScore, 1),
            'title_matches' => $titleMatches,
            'avg_da' => 0, // Placeholder until deeper integration
            'forum_count' => $forumCount,
            'intent' => $intent,
            'paa' => $paa,
            'related' => $related
        ];
    }
}
