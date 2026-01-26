<?php

namespace App\Services;

class ContentBriefGenerator
{
    protected $serpAnalyzer;
    protected $keywordAnalyzer;
    protected $competitorAnalyzer;

    public function __construct(
        SERPAnalyzer $serpAnalyzer,
        KeywordAnalyzer $keywordAnalyzer,
        CompetitorAnalyzer $competitorAnalyzer
    ) {
        $this->serpAnalyzer = $serpAnalyzer;
        $this->keywordAnalyzer = $keywordAnalyzer;
        $this->competitorAnalyzer = $competitorAnalyzer;
    }

    /**
     * Generate complete content brief
     *
     * @param string $keyword
     * @param array $options
     * @return array
     */
    public function generateBrief(string $keyword, array $options = []): array
    {
        $locationCode = $options['location_code'] ?? 2840;
        $languageCode = $options['language_code'] ?? 'en';

        // Step 1: SERP Analysis
        $serpData = $this->serpAnalyzer->analyzeKeyword($keyword, $locationCode, $languageCode);

        // Step 2: Keyword Research
        $keywordData = $this->keywordAnalyzer->analyzeKeyword($keyword, $locationCode, $languageCode);

        // Step 3: Competitor Analysis (Top 5 URLs)
        $topUrls = array_slice(array_column($serpData['top_results'], 'url'), 0, 5);
        $competitorData = $this->competitorAnalyzer->analyzeCompetitorPages($topUrls);

        // Step 4: Generate Suggestions
        $brief = [
            'target_keyword' => $keyword,
            'search_volume' => $this->estimateSearchVolume($keywordData),
            'difficulty' => $this->calculateDifficulty($keywordData),
            'title_suggestions' => $this->generateTitleSuggestions($keyword, $serpData, $competitorData),
            'meta_descriptions' => $this->generateMetaDescriptions($keyword, $competitorData),
            'content_structure' => $this->generateContentStructure($competitorData, $serpData),
            'lsi_keywords' => $keywordData['lsi_keywords'],
            'competitor_insights' => [
                'avg_word_count' => $competitorData['average_metrics']['avg_word_count'] ?? 0,
                'avg_images' => $competitorData['average_metrics']['avg_images'] ?? 0,
                'common_topics' => $competitorData['content_structure']['common_topics'] ?? [],
                'content_gaps' => $competitorData['content_gaps'] ?? [],
            ],
            'serp_opportunities' => $this->generateSERPOptimizations($serpData),
            'quality_score' => 0, // Will be calculated
        ];

        $brief['quality_score'] = $this->calculateQualityScore($brief);

        return $brief;
    }

    /**
     * Generate title suggestions
     */
    protected function generateTitleSuggestions(string $keyword, array $serpData, array $competitorData): array
    {
        $suggestions = [];
        $avgLength = $competitorData['average_metrics']['avg_title_length'] ?? 60;

        // Pattern 1: Best X + Year
        $suggestions[] = [
            'title' => 'Best ' . ucwords($keyword) . ' ' . date('Y') . ': Complete Guide',
            'length' => strlen('Best ' . ucwords($keyword) . ' ' . date('Y') . ': Complete Guide'),
            'pattern' => 'Best X + Year + Guide',
            'keyword_position' => 'beginning',
            'power_words' => ['Best', 'Complete'],
            'score' => 95,
        ];

        // Pattern 2: How to X
        $suggestions[] = [
            'title' => 'How to ' . ucwords($keyword) . ': Step-by-Step Guide',
            'length' => strlen('How to ' . ucwords($keyword) . ': Step-by-Step Guide'),
            'pattern' => 'How to X + Guide',
            'keyword_position' => 'beginning',
            'power_words' => ['Step-by-Step'],
            'score' => 90,
        ];

        // Pattern 3: Ultimate Guide
        $suggestions[] = [
            'title' => 'The Ultimate ' . ucwords($keyword) . ' Guide [' . date('Y') . ']',
            'length' => strlen('The Ultimate ' . ucwords($keyword) . ' Guide [' . date('Y') . ']'),
            'pattern' => 'Ultimate X Guide',
            'keyword_position' => 'middle',
            'power_words' => ['Ultimate'],
            'score' => 88,
        ];

        return $suggestions;
    }

    /**
     * Generate meta descriptions
     */
    protected function generateMetaDescriptions(string $keyword, array $competitorData): array
    {
        $descriptions = [];

        $descriptions[] = [
            'description' => 'Discover everything about ' . $keyword . '. Complete guide with examples, tips, and best practices. Updated ' . date('Y') . '.',
            'length' => strlen('Discover everything about ' . $keyword . '. Complete guide with examples, tips, and best practices. Updated ' . date('Y') . '.'),
            'keywords_included' => [$keyword, 'guide', 'tips'],
            'has_cta' => false,
            'score' => 90,
        ];

        return $descriptions;
    }

    /**
     * Generate content structure
     */
    protected function generateContentStructure(array $competitorData, array $serpData): array
    {
        $avgWordCount = $competitorData['average_metrics']['avg_word_count'] ?? 2000;

        return [
            'recommended_word_count' => $avgWordCount,
            'word_count_range' => ($avgWordCount - 500) . '-' . ($avgWordCount + 500),
            'h2_sections' => $competitorData['content_structure']['common_topics'] ?? [],
            'faq_section' => [
                'include' => !empty($serpData['paa_questions']),
                'questions' => array_slice(array_column($serpData['paa_questions'], 'question'), 0, 5),
            ],
        ];
    }

    /**
     * Generate SERP optimizations
     */
    protected function generateSERPOptimizations(array $serpData): array
    {
        return [
            'featured_snippet' => [
                'opportunity' => $serpData['serp_features']['has_featured_snippet'] ?? false,
                'optimization' => 'Create concise 40-60 word definition in first paragraph',
            ],
            'people_also_ask' => [
                'opportunity' => $serpData['serp_features']['has_people_also_ask'] ?? false,
                'questions_to_answer' => array_slice(array_column($serpData['paa_questions'] ?? [], 'question'), 0, 5),
            ],
        ];
    }

    /**
     * Calculate quality score
     */
    protected function calculateQualityScore(array $brief): int
    {
        $score = 0;

        // Title optimization (30 points)
        if (!empty($brief['title_suggestions'])) {
            $score += 30;
        }

        // Content structure (25 points)
        if (!empty($brief['content_structure']['h2_sections'])) {
            $score += 25;
        }

        // Competitor coverage (20 points)
        if (!empty($brief['competitor_insights']['common_topics'])) {
            $score += 20;
        }

        // SERP features (15 points)
        if (!empty($brief['serp_opportunities'])) {
            $score += 15;
        }

        // LSI keywords (10 points)
        if (!empty($brief['lsi_keywords'])) {
            $score += 10;
        }

        return min($score, 100);
    }

    protected function estimateSearchVolume(array $keywordData): int
    {
        return $keywordData['related_keywords'][0]['search_volume'] ?? 0;
    }

    protected function calculateDifficulty(array $keywordData): int
    {
        // Simple difficulty estimation based on competition
        $avgCompetition = 0;
        $count = 0;

        foreach ($keywordData['related_keywords'] as $kw) {
            if (isset($kw['competition'])) {
                $avgCompetition += $kw['competition'];
                $count++;
            }
        }

        return $count > 0 ? round(($avgCompetition / $count) * 100) : 50;
    }
}
