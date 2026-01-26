<?php

namespace App\Services;

use Symfony\Component\DomCrawler\Crawler;
use Illuminate\Support\Facades\Log;

class AdvancedSeoAnalyzer
{
    /**
     * Analyze HTML structure
     *
     * @param string $html
     * @return array
     */
    public function analyze(string $html, string $url = null): array
    {
        if (empty($html)) {
            return [];
        }

        $crawler = new Crawler($html);

        return [
            'headings' => $this->analyzeHeadings($crawler),
            'images' => $this->analyzeImages($crawler),
            'links' => $this->analyzeLinks($crawler, $url),
            'meta' => $this->analyzeMeta($crawler), // Essential tags
            'json_ld' => $this->extractJsonLd($crawler),
            'content_text' => $this->extractPlainText($crawler),
        ];
    }

    /**
     * Extract JSON-LD Scripts
     */
    protected function extractJsonLd(Crawler $crawler): array
    {
        $schemas = [];
        $crawler->filter('script[type="application/ld+json"]')->each(function (Crawler $node) use (&$schemas) {
            try {
                $json = json_decode($node->text(), true);
                if ($json) {
                    if (isset($json['@graph']) && is_array($json['@graph'])) {
                        // Some plugins output a graph array
                        $schemas = array_merge($schemas, $json['@graph']);
                    } else {
                        $schemas[] = $json;
                    }
                }
            } catch (\Exception $e) {
                // Ignore bad json
            }
        });
        return $schemas;
    }

    protected function extractPlainText(Crawler $crawler): string
    {
        try {
            // Filter body
            $body = $crawler->filter('body');

            if ($body->count()) {
                // Get inner HTML of body
                $html = $body->html();

                // Aggressively strip scripts, styles, and other non-text elements using Regex
                // /is modifier: i=case insensitive, s=dot matches newline
                $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', " ", $html);
                $html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', " ", $html);
                $html = preg_replace('/<noscript\b[^>]*>(.*?)<\/noscript>/is', " ", $html);
                $html = preg_replace('/<iframe\b[^>]*>(.*?)<\/iframe>/is', " ", $html);
                $html = preg_replace('/<!--(.*?)-->/is', " ", $html); // Comments

                // Strip tags
                $text = strip_tags($html);

                // Clean whitespace (collapse multiple spaces/newlines)
                return trim(preg_replace('/\s+/', ' ', $text));
            }

            return '';
        } catch (\Exception $e) {
            return '';
        }
    }

    /**
     * Extract Headings Tree
     */
    protected function analyzeHeadings(Crawler $crawler): array
    {
        $headings = [];
        $crawler->filter('h1, h2, h3, h4, h5, h6')->each(function (Crawler $node) use (&$headings) {
            $headings[] = [
                'tag' => strtolower($node->nodeName()),
                'text' => trim($node->text()),
                'length' => strlen(trim($node->text()))
            ];
        });
        return $headings;
    }

    /**
     * Analyze Images (Alt tags)
     */
    protected function analyzeImages(Crawler $crawler): array
    {
        $images = [];
        $crawler->filter('img')->each(function (Crawler $node) use (&$images) {
            $src = $node->attr('src');
            $alt = $node->attr('alt');

            $images[] = [
                'src' => $src,
                'alt' => $alt,
                'has_alt' => !empty($alt),
                'is_decorative' => $alt === "", // explicit empty alt
            ];
        });
        return $images;
    }

    /**
     * Analyze Links
     */
    protected function analyzeLinks(Crawler $crawler, ?string $baseUrl = null): array
    {
        $links = [];
        $baseHost = $baseUrl ? parse_url($baseUrl, PHP_URL_HOST) : null;
        // Normalize base host (remove www and scheme if present in host string, though parse_url handles host)
        $baseHost = $baseHost ? preg_replace('/^www\./', '', $baseHost) : null;

        $crawler->filter('a')->each(function (Crawler $node) use (&$links, $baseHost) {
            $href = $node->attr('href');
            $text = trim($node->text());
            $rel = $node->attr('rel');

            if ($href) {
                $isInternal = false;

                // 1. Relative paths are internal
                if (str_starts_with($href, '/') || str_starts_with($href, '#') || str_starts_with($href, '?')) {
                    $isInternal = true;
                }
                // 2. Absolute paths matching domain
                elseif ($baseHost) {
                    $host = parse_url($href, PHP_URL_HOST);
                    $host = $host ? preg_replace('/^www\./', '', $host) : null;
                    if ($host === $baseHost) {
                        $isInternal = true;
                    }
                }

                $links[] = [
                    'href' => $href,
                    'text' => $text,
                    'has_text' => !empty($text),
                    'rel' => $rel,
                    'is_internal' => $isInternal
                ];
            }
        });
        return $links;
    }

    /**
     * Analyze Meta Tags
     */
    protected function analyzeMeta(Crawler $crawler): array
    {
        $meta = [];

        $tags = [
            'title' => 'title',
            'meta[name="description"]' => 'description', // selector => key
            'meta[name="robots"]' => 'robots',
            'link[rel="canonical"]' => 'canonical',
            'meta[property="og:title"]' => 'og:title',
            'meta[property="og:image"]' => 'og:image',
        ];

        // Title
        try {
            $meta['title'] = $crawler->filter('title')->count() ? $crawler->filter('title')->text() : null;
        } catch (\Exception $e) {
        }

        // Canonical
        try {
            $meta['canonical'] = $crawler->filter('link[rel="canonical"]')->count() ? $crawler->filter('link[rel="canonical"]')->attr('href') : null;
        } catch (\Exception $e) {
        }

        // Meta tags
        $crawler->filter('meta')->each(function (Crawler $node) use (&$meta) {
            $name = $node->attr('name');
            $property = $node->attr('property');
            $content = $node->attr('content');

            if ($name && $content) {
                $meta[$name] = $content;
            }
            if ($property && $content) {
                $meta[$property] = $content;
            }
        });

        return $meta;
    }
}
