<?php

namespace App\Http\Controllers\Api;

use App\Exports\PagesExport;
use App\Http\Controllers\Controller;
use App\Models\Site;
use App\Models\SiteAudit;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    /**
     * Download PDF Audit Report
     */
    public function downloadPdf(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        
        // Get the latest summary data
        $summary = $site->on_page_summary;
        
        if (!$summary) {
            return response()->json(['success' => false, 'message' => 'No audit data found to generate report'], 404);
        }

        $data = [
            'site' => $site,
            'summary' => $summary,
            'date' => now()->format('F j, Y'),
        ];

        $pdf = Pdf::loadView('reports.audit_summary', $data);
        
        return $pdf->download("seo-report-{$site->domain}.pdf");
    }

    /**
     * Download CSV export of all pages
     */
    public function downloadCsv(Request $request, $siteId)
    {
        $site = $request->user()->sites()->findOrFail($siteId);
        
        return Excel::download(new PagesExport($site->id), "seo-pages-{$site->domain}.csv");
    }
}
