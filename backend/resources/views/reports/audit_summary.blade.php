<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SEO Audit Report - {{ $site->domain }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 0; }
        .header { background: {{ $settings['primary_color'] ?? '#3b82f6' }}; color: white; padding: 32px 40px; display: flex; align-items: center; gap: 20px; }
        .header-logo { max-height: 48px; max-width: 140px; object-fit: contain; }
        .header-text h1 { margin: 0; font-size: 26px; }
        .header-text p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
        .container { padding: 40px; }
        .section { margin-bottom: 40px; }
        h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
        .score-circle {
            width: 150px; height: 150px; border-radius: 50%;
            background: #f8fafc; border: 10px solid {{ $settings['primary_color'] ?? '#3b82f6' }};
            margin: 20px auto; line-height: 150px; font-size: 48px;
            font-weight: bold; color: {{ $settings['primary_color'] ?? '#3b82f6' }}; text-align: center;
        }
        .stats-grid { display: block; margin-top: 20px; }
        .stat-item {
            display: inline-block; width: 30%; background: #f9fafb;
            padding: 15px; border-radius: 8px; margin: 1%; text-align: center;
        }
        .stat-value { font-size: 24px; font-weight: bold; color: #111827; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .footer { text-align: center; font-size: 12px; color: #9ca3af; padding: 20px; border-top: 1px solid #e5e7eb; margin-top: 40px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; color: #4b5563; font-size: 12px; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($settings['logo_url']))
            <img src="{{ $settings['logo_url'] }}" alt="Agency Logo" class="header-logo">
        @endif
        <div class="header-text">
            <h1>{{ $settings['company_name'] ?? 'SEO Platform' }} — Audit Report</h1>
            <p>{{ $site->url }} &bull; Generated on {{ $date }}</p>
        </div>
    </div>

    <div class="container">
        <div class="section" style="text-align: center;">
            <h2>Optimization Score</h2>
            <div class="score-circle">
                {{ $summary['page_metrics']['onpage_score'] ?? 0 }}
            </div>
            <p style="color: #6b7280;">Overall Health Score (out of 100)</p>
        </div>

        <div class="section">
            <h2>Key Metrics Summary</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">{{ $summary['crawl_status']['pages_crawled'] ?? 0 }}</div>
                    <div class="stat-label">Pages Crawled</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{{ $summary['page_metrics']['links_internal'] ?? 0 }}</div>
                    <div class="stat-label">Internal Links</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{{ $summary['page_metrics']['links_external'] ?? 0 }}</div>
                    <div class="stat-label">External Links</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Technical Health Checks</h2>
            <table>
                <thead>
                    <tr>
                        <th>Check Name</th>
                        <th>Result / Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Broken Links</td>
                        <td><span class="badge {{ ($summary['page_metrics']['broken_links'] ?? 0) > 0 ? 'badge-error' : 'badge-success' }}">{{ $summary['page_metrics']['broken_links'] ?? 0 }}</span></td>
                    </tr>
                    <tr>
                        <td>Broken Resources</td>
                        <td><span class="badge {{ ($summary['page_metrics']['broken_resources'] ?? 0) > 0 ? 'badge-error' : 'badge-success' }}">{{ $summary['page_metrics']['broken_resources'] ?? 0 }}</span></td>
                    </tr>
                    <tr>
                        <td>Duplicate Content</td>
                        <td><span class="badge {{ ($summary['page_metrics']['duplicate_content'] ?? 0) > 0 ? 'badge-error' : 'badge-success' }}">{{ $summary['page_metrics']['duplicate_content'] ?? 0 }}</span></td>
                    </tr>
                    <tr>
                        <td>SSL Certificate</td>
                        <td><span class="badge {{ $summary['domain_info']['ssl_info']['valid_certificate'] ? 'badge-success' : 'badge-error' }}">{{ $summary['domain_info']['ssl_info']['valid_certificate'] ? 'Valid' : 'Invalid' }}</span></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Recommendations</h2>
            <p>Based on our audit, here are the top areas to focus on:</p>
            <ul>
                @if(($summary['page_metrics']['broken_links'] ?? 0) > 0)
                    <li><strong>Fix Broken Links:</strong> You have {{ $summary['page_metrics']['broken_links'] }} broken links. Fix them to ensure search engines can crawl your site.</li>
                @endif
                @if(($summary['page_metrics']['duplicate_content'] ?? 0) > 0)
                    <li><strong>Address Duplicates:</strong> {{ $summary['page_metrics']['duplicate_content'] }} pages have duplicate content issues. Use canonical tags or unique copy.</li>
                @endif
                <li><strong>Optimize Page Speed:</strong> Ensure all pages load in under 2 seconds for optimal ranking.</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        {{ $settings['report_footer'] ?? 'Generated by SEO Platform' }} &copy; {{ date('Y') }}
    </div>
</body>
</html>
