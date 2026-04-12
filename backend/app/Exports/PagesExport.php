<?php

namespace App\Exports;

use App\Models\SiteCrawledPage;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PagesExport implements FromQuery, WithHeadings, WithMapping
{
    protected $siteId;

    public function __construct($siteId)
    {
        $this->siteId = $siteId;
    }

    public function query()
    {
        return SiteCrawledPage::query()->where('site_id', $this->siteId);
    }

    public function headings(): array
    {
        return [
            'ID',
            'URL',
            'Status Code',
            'On-Page Score',
            'Title',
            'Meta Description',
            'Internal Links',
            'External Links',
            'Created At',
        ];
    }

    public function map($page): array
    {
        return [
            $page->id,
            $page->url,
            $page->status_code,
            $page->onpage_score,
            $page->title,
            $page->meta['description'] ?? '',
            $page->meta['internal_links_count'] ?? 0,
            $page->meta['external_links_count'] ?? 0,
            $page->created_at,
        ];
    }
}
