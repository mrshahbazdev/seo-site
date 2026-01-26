<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LanguageToolService
{
    protected $baseUrl = 'https://api.languagetool.org/v2';

    /**
     * Check text for grammar and spelling errors.
     *
     * @param string $text
     * @param string $language
     * @return array
     */
    public function check(string $text, string $language = 'en-US')
    {
        try {
            // LanguageTool API limits and best practices:
            // - Respect rate limits (IP based for free tier)
            // - Text length limit usually around 20k chars per request

            // Truncate if too long to avoid immediate rejection, 
            // though ideal is splitting into chunks. For now simple truncate.
            $text = substr($text, 0, 10000);

            $response = Http::asForm()->post("{$this->baseUrl}/check", [
                'text' => $text,
                'language' => $language,
            ]);

            if ($response->successful()) {
                return $this->formatResponse($response->json());
            }

            Log::error('LanguageTool API Error', ['status' => $response->status(), 'body' => $response->body()]);
            return [
                'error' => true,
                'message' => 'Failed to check grammar',
                'details' => $response->json()
            ];

        } catch (\Exception $e) {
            Log::error('LanguageTool Service Exception: ' . $e->getMessage());
            return ['error' => true, 'message' => $e->getMessage()];
        }
    }

    protected function formatResponse(array $data)
    {
        $matches = $data['matches'] ?? [];

        // Filter and format useful info
        $formatted = array_map(function ($match) {
            return [
                'message' => $match['message'],
                'short_message' => $match['shortMessage'] ?? '',
                'offset' => $match['offset'],
                'length' => $match['length'],
                'context' => [
                    'text' => $match['context']['text'],
                    'offset' => $match['context']['offset'],
                    'length' => $match['context']['length']
                ],
                'replacements' => array_slice($match['replacements'], 0, 5), // Top 5
                'rule' => [
                    'id' => $match['rule']['id'],
                    'description' => $match['rule']['description'],
                    'issue_type' => $match['rule']['issueType'], // e.g., 'misspelling', 'typographical'
                ]
            ];
        }, $matches);

        return [
            'success' => true,
            'language' => $data['language']['name'] ?? 'Unknown',
            'matches' => $formatted
        ];
    }
}
