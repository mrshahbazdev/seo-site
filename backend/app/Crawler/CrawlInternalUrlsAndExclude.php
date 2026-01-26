<?php

namespace App\Crawler;

use Spatie\Crawler\CrawlProfiles\CrawlInternalUrls;
use Psr\Http\Message\UriInterface;

class CrawlInternalUrlsAndExclude extends CrawlInternalUrls
{
    public function shouldCrawl(UriInterface $url): bool
    {
        if (!parent::shouldCrawl($url)) {
            return false;
        }

        $path = $url->getPath();
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        $excludedExtensions = [
            'jpg',
            'jpeg',
            'png',
            'gif',
            'bmp',
            'svg',
            'webp',
            'ico',
            'pdf',
            'doc',
            'docx',
            'xls',
            'xlsx',
            'ppt',
            'pptx',
            'zip',
            'rar',
            'tar',
            'gz',
            'iso',
            'exe',
            'dmg',
            'mp3',
            'mp4',
            'avi',
            'mov',
            'wmv',
            'flv',
            'css',
            'js',
            'json',
            'xml',
            'woff',
            'woff2',
            'ttf',
            'eot'
        ];

        if (in_array($extension, $excludedExtensions)) {
            return false;
        }

        return true;
    }
}
