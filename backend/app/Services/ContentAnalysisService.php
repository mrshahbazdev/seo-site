<?php

namespace App\Services;

class ContentAnalysisService
{
    /**
     * Analyze content against a target keyword
     *
     * @param array $pageData Ex: ['title' => '...', 'content' => '...', 'meta' => ['description' => '...']]
     * @param string $keyword
     * @return array
     */
    public function analyze(array $pageData, string $keyword): array
    {
        $keyword = mb_strtolower(trim($keyword));
        $content = mb_strtolower($pageData['content'] ?? '');
        $title = mb_strtolower($pageData['title'] ?? '');
        $description = mb_strtolower($pageData['meta']['description'] ?? '');
        $h1s = array_map('mb_strtolower', $pageData['meta']['htags']['h1'] ?? []);

        // 1. Keyword Density
        $wordCount = str_word_count(strip_tags($content));
        $keywordCount = substr_count($content, $keyword);
        $density = $wordCount > 0 ? ($keywordCount / $wordCount) * 100 : 0;

        // 2. Placement Checks
        $placements = [
            'in_title' => str_contains($title, $keyword),
            'in_description' => str_contains($description, $keyword),
            'in_url' => str_contains(mb_strtolower($pageData['url'] ?? ''), str_replace(' ', '-', $keyword)) || str_contains(mb_strtolower($pageData['url'] ?? ''), $keyword),
            'in_h1' => false,
            'at_start' => false // Starts with keyword in first 100 chars
        ];

        foreach ($h1s as $h1) {
            if (str_contains($h1, $keyword)) {
                $placements['in_h1'] = true;
                break;
            }
        }

        // Check first 200 characters of content
        $initialContent = substr($content, 0, 200);
        if (str_contains($initialContent, $keyword)) {
            $placements['at_start'] = true;
        }

        // 3. Recommendations
        $recommendations = [];
        if (!$placements['in_title']) {
            $recommendations[] = "Include the keyword '$keyword' in the page Title.";
        }
        if (!$placements['in_description']) {
            $recommendations[] = "Add '$keyword' to the Meta Description to improve CTR.";
        }
        if (!$placements['in_h1']) {
            $recommendations[] = "Make sure your main H1 tag contains '$keyword'.";
        }
        if (!$placements['in_url']) {
            $recommendations[] = "Ensure the URL slug includes '$keyword' (e.g., /your-keyword).";
        }
        if (!$placements['at_start']) {
            $recommendations[] = "Mention '$keyword' in the first paragraph (introduction).";
        }

        if ($density < 0.5) {
            $recommendations[] = "Keyword density is low ($density%). Aim for 1-2% by adding '$keyword' naturally.";
        } elseif ($density > 3.0) {
            $recommendations[] = "Keyword density is high ($density%). You might be keyword stuffing. Reduce it to under 3%.";
        }

        return [
            'keyword' => $keyword,
            'density_score' => round($density, 2),
            'keyword_count' => $keywordCount,
            'total_words' => $wordCount,
            'placements' => $placements,
            'recommendations' => $recommendations
        ];
    }
}
