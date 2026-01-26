<?php

namespace App\Services;

class ContentBriefService
{
    /**
     * Generate an AI Master Prompt for content creation
     */
    /**
     * Generate a Complete SEO Strategy (The "Top-Tier" Blueprint)
     */
    public function generateBrief(string $keyword, array $analysis)
    {
        $intent = ucfirst($analysis['intent']);
        $difficulty = $analysis['difficulty_score'] < 30 ? "Low" : ($analysis['difficulty_score'] < 60 ? "Medium" : "High");
        $year = date('Y');

        // 1. Determine Content Angle
        $angle = "Ultimate Guide";
        $keywordLower = strtolower($keyword);

        if (str_starts_with($keywordLower, 'best') || str_starts_with($keywordLower, 'top')) {
            $angle = "Listicle / Round-up";
        } elseif (str_starts_with($keywordLower, 'how') || str_contains($keywordLower, 'tutorial')) {
            $angle = "Step-by-Step Guide";
        } elseif (str_contains($keywordLower, 'review')) {
            $angle = "Product Review";
        } elseif (str_contains($keywordLower, 'vs') || str_contains($keywordLower, 'versus')) {
            $angle = "Comparison";
        }

        // 2. Generate "Golden Title"
        $titles = [
            "Listicle / Round-up" => "7 Best {$keyword} in {$year} (Ranked & Reviewed)",
            "Step-by-Step Guide" => "How to Master {$keyword}: A Beginner's Guide ({$year})",
            "Product Review" => "{$keyword} Review: Is It Really Worth It? (Honest Verdict)",
            "Comparison" => "{$keyword}: Which One Should You Choose? (Detailed Comparison)",
            "Ultimate Guide" => "{$keyword}: The Definitive Guide for Beginners ({$year})"
        ];
        $title = $titles[$angle] ?? $titles["Ultimate Guide"];

        // 3. Generate "Killer Meta Description"
        $meta = "Looking for {$keyword}? Discover everything you need to know in this comprehensive {$angle}. Learn expert tips, common mistakes to avoid, and actionable advice. Read now!";

        // 4. Construct Outline (H2s)
        $outline = [
            "Introduction (Hook + Problem/Solution)",
            "What is {$keyword}?",
        ];

        if ($angle === "Listicle / Round-up") {
            $outline[] = "Top Picks at a Glance";
            $outline[] = "Detailed Reviews of Top 5 Options";
            $outline[] = "Buying Guide: What to Look For";
        } else {
            $outline[] = "Key Benefits & Importance";
            $outline[] = "Step-by-Step Process / How it Works";
            $outline[] = "Common Mistakes to Avoid";
        }

        $outline[] = "Expert Tips for Success";
        $outline[] = "Frequently Asked Questions";
        $outline[] = "Conclusion";

        // 5. Build the Master Prompt (Still useful for AI generation)
        $paaQuestions = "";
        if (!empty($analysis['paa'])) {
            $paaQuestions = "\n**People Also Ask (Include these in FAQs):**";
            foreach (array_slice($analysis['paa'], 0, 5) as $q) {
                $paaQuestions .= "\n- " . ($q['question'] ?? 'Question');
            }
        }

        $prompt = <<<EOT
Write a comprehensive, SEO-optimized article of 1500+ words on the topic: "{$keyword}".

**Strategy:**
- **Title:** {$title}
- **Angle:** {$angle}
- **Target Audience:** Beginners / General Audience
- **Intent:** {$intent}

**Structure Requirements:**
1. **Introduction:** Hook the reader immediately.
2. **Key Sections (H2s):**
   - Use the following outline data but expand on it naturally.
   - What is {$keyword}?
   - (Angle specific sections)
   - FAQs (See below)
3. **Conclusion:** Summary and Call to Action.
{$paaQuestions}

**Tone & Style:**
- Authoritative yet accessible.
- Optimise for Featured Snippets.
EOT;

        return [
            'prompt' => $prompt,
            'strategy' => [
                'title' => $title,
                'meta_description' => $meta,
                'angle' => $angle,
                'outline' => $outline,
                'intent' => $intent,
                'difficulty' => $difficulty
            ]
        ];
    }
}
