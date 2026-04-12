/**
 * DataForSEO On-Page `checks` booleans: whether `true` means pass or fail.
 * @see https://docs.dataforseo.com/v3/on_page/pages/
 */

/** When true → issue / fail (show red) */
export const NEGATIVE_WHEN_TRUE = new Set([
    'duplicate_title',
    'duplicate_description',
    'duplicate_content',
    'duplicate_meta_tags',
    'duplicate_title_tag',
    'no_h1_tag',
    'no_title',
    'no_description',
    'no_favicon',
    'is_broken',
    'is_4xx_code',
    'is_5xx_code',
    'high_loading_time',
    'high_waiting_time',
    'is_http',
    'is_redirect',
    'no_image_alt',
    'no_image_title',
    'flash',
    'frame',
    'lorem_ipsum',
    'deprecated_html_tags',
    'no_doctype',
    'no_encoding_meta_tag',
    'https_to_http_links',
    'has_meta_refresh_redirect',
    'size_greater_than_3mb',
    'redirect_loop',
    'redirect_chain',
    'broken_links',
    'broken_resources',
    'canonical_to_broken',
    'canonical_to_redirect',
    'canonical_chain',
    'recursive_canonical',
    'is_orphan_page',
    'is_link_relation_conflict',
    'has_links_to_redirects',
    'low_content_rate',
    'high_content_rate',
    'low_character_count',
    'high_character_count',
    'small_page_size',
    'large_page_size',
    'low_readability_rate',
    'irrelevant_description',
    'irrelevant_title',
    'irrelevant_meta_keywords',
    'title_too_long',
    'title_too_short',
    'has_micromarkup_errors',
    'has_misspelling',
    /** true = charset in HTTP/meta doesn't match page encoding */
    'meta_charset_consistency',
    /** true = has render-blocking scripts/stylesheets (common; not always fixable) */
    'has_render_blocking_resources',
    /** true = page has spell issues if spellcheck enabled */
    'spell',
]);

/** When true → OK / pass (show green) */
export const POSITIVE_WHEN_TRUE = new Set([
    'is_https',
    'seo_friendly_url',
    'has_meta_title',
    'has_h1',
    'canonical',
    /** true = has HTML doctype */
    'has_html_doctype',
    /** true = URL uses only allowed character classes */
    'seo_friendly_url_characters_check',
    /** true = no dynamic parameters in URL */
    'seo_friendly_url_dynamic_check',
    /** true = URL aligns with title */
    'seo_friendly_url_keywords_check',
    /** true = URL length ≤ 120 */
    'seo_friendly_url_relative_length_check',
    /** true = found in sitemap */
    'from_sitemap',
    /** true = follow links (not nofollow meta) */
    'follow',
    'dofollow',
]);

/**
 * @param {string} key
 * @param {boolean} value
 * @returns {'good'|'bad'|'neutral'}
 */
export function getDataForSeoCheckStatus(key, value) {
    if (typeof value !== 'boolean') return 'neutral';
    if (NEGATIVE_WHEN_TRUE.has(key)) {
        return value ? 'bad' : 'good';
    }
    if (POSITIVE_WHEN_TRUE.has(key)) {
        return value ? 'good' : 'bad';
    }
    return 'neutral';
}

/**
 * Summary `page_metrics.checks` keys where a higher count = more pages with that issue.
 * Do not add metrics where a higher number is good (e.g. canonical, is_https, seo_friendly_url).
 */
export const SUMMARY_COUNT_IS_BAD = new Set([
    'is_broken',
    'is_4xx_code',
    'is_5xx_code',
    'duplicate_title',
    'duplicate_description',
    'duplicate_content',
    'duplicate_meta_tags',
    'duplicate_title_tag',
    'no_h1_tag',
    'no_title',
    'no_description',
    'no_image_alt',
    'no_image_title',
    'no_favicon',
    'no_doctype',
    'meta_charset_consistency',
    'has_render_blocking_resources',
    'broken_links',
    'broken_resources',
    'redirect_loop',
    'redirect_chain',
    'links_relation_conflict',
    'title_too_short',
    'title_too_long',
    'high_loading_time',
    'high_waiting_time',
    'is_http',
    'is_redirect',
    'flash',
    'frame',
    'lorem_ipsum',
    'deprecated_html_tags',
    'low_readability_rate',
    'irrelevant_title',
    'irrelevant_description',
    'irrelevant_meta_keywords',
    'canonical_to_broken',
    'canonical_to_redirect',
    'canonical_chain',
    'recursive_canonical',
    'is_orphan_page',
    'is_link_relation_conflict',
    'has_links_to_redirects',
    'has_meta_refresh_redirect',
    'https_to_http_links',
    'has_misspelling',
    'size_greater_than_3mb',
    'no_content_encoding',
    'no_encoding_meta_tag',
    'low_content_rate',
    'high_content_rate',
    'low_character_count',
    'high_character_count',
    'small_page_size',
    'large_page_size',
]);
