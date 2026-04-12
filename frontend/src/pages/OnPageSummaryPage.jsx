import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, RefreshCw, Shield, Server, Globe, FileText, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SUMMARY_COUNT_IS_BAD } from '../utils/dataforseoChecks';

export default function OnPageSummaryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('loading'); // loading, no_task, in_progress, done, error
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchSummary();
    }, [id]);

    const fetchSummary = async (refresh = false) => {
        try {
            if (refresh) setRefreshing(true);
            else setLoading(true);

            const token = localStorage.getItem('token');
            const url = refresh
                ? `https://seostory.de/api/sites/${id}/onpage/summary?refresh=true`
                : `https://seostory.de/api/sites/${id}/onpage/summary`;

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                setSummary(data.data);
                setStatus('done');
            } else if (data.status === 'no_task') {
                setStatus('no_task');
            } else if (data.status === 'in_progress') {
                setStatus('in_progress');
            } else {
                toast.error(data.message || 'Failed to load summary');
                setStatus('error');
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
            setStatus('error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const startAnalysis = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`https://seostory.de/api/sites/${id}/onpage/crawl`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Analysis started! Please wait...');
                setStatus('in_progress');
                // Poll for updates
                setTimeout(() => fetchSummary(), 5000);
            } else {
                toast.error(data.message || 'Failed to start analysis');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error starting analysis:', error);
            toast.error('Failed to start analysis');
            setLoading(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <RefreshCw size={40} className="animate-spin" color="#3b82f6" />
                    <p style={{ color: '#64748b' }}>Loading Summary...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
                </div>
            </div>
        );
    }

    if (status === 'no_task') {
        return (
            <div style={{ minHeight: '100vh', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', textAlign: 'center' }}>
                <div style={{ marginBottom: '20px', color: '#3b82f6', background: '#dbeafe', padding: '20px', borderRadius: '50%' }}>
                    <FileText size={48} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>No Analysis Found</h1>
                <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px' }}>Start a deep On-Page SEO analysis to get a comprehensive summary of your site's health.</p>
                <button
                    onClick={startAnalysis}
                    style={{ padding: '12px 32px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)' }}
                >
                    Start Analysis
                </button>
            </div>
        );
    }

    if (status === 'in_progress') {
        return (
            <div style={{ minHeight: '100vh', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', textAlign: 'center' }}>
                <RefreshCw size={48} className="animate-spin" color="#3b82f6" style={{ marginBottom: '24px' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Analysis in Progress</h1>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>We are crawling your site. This may take a few minutes depending on the site size.</p>
                <button
                    onClick={() => fetchSummary()}
                    style={{ padding: '10px 24px', background: 'white', color: '#3b82f6', borderRadius: '8px', border: '1px solid #3b82f6', fontWeight: '600', cursor: 'pointer' }}
                >
                    Check Status
                </button>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
            </div>
        );
    }

    if (!summary) return null;

    const { domain_info = {}, page_metrics = {}, crawl_status = {} } = summary || {};

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>On-Page Summary</h1>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>{domain_info.main_domain}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => navigate(`/sites/${id}/onpage/pages`)}
                            style={{
                                padding: '8px 16px',
                                background: 'white',
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <FileText size={14} /> View All Pages
                        </button>
                        <button
                            onClick={() => fetchSummary(true)}
                            disabled={refreshing}
                            style={{
                                padding: '8px 16px',
                                background: refreshing ? '#94a3b8' : 'white',
                                color: refreshing ? 'white' : '#3b82f6',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: refreshing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Data
                        </button>
                        <button
                            onClick={startAnalysis}
                            disabled={loading || refreshing || (summary?.crawl_status?.pages_in_queue > 0)}
                            title={summary?.crawl_status?.pages_in_queue > 0 ? "Analysis in progress (Queue > 0)" : "Start new crawl"}
                            style={{
                                padding: '8px 16px',
                                background: (loading || refreshing || (summary?.crawl_status?.pages_in_queue > 0)) ? '#94a3b8' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: (loading || refreshing || (summary?.crawl_status?.pages_in_queue > 0)) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Shield size={14} /> New Analysis
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px', display: 'grid', gap: '24px' }}>

                {/* Domain & Server Info Card */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={18} color="#3b82f6" /> Domain & Server Checks
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                        <InfoItem label="CMS" value={domain_info?.cms || 'N/A'} icon={<FileText size={16} color="#64748b" />} />
                        <InfoItem label="Server" value={domain_info?.server} icon={<Server size={16} color="#64748b" />} />
                        <InfoItem label="IP Address" value={domain_info?.ip} icon={<Globe size={16} color="#64748b" />} />
                        <InfoItem
                            label="SSL Certificate"
                            value={domain_info?.ssl_info?.valid_certificate ? 'Valid' : 'Invalid'}
                            valueColor={domain_info?.ssl_info?.valid_certificate ? '#166534' : '#ef4444'}
                            subValue={`Issuer: ${domain_info?.ssl_info?.certificate_issuer || 'N/A'}`}
                            icon={<Shield size={16} color={domain_info?.ssl_info?.valid_certificate ? '#166534' : '#ef4444'} />}
                        />
                    </div>

                    {/* Domain Checks Grid */}
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Domain Tests</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                        {domain_info?.checks && Object.entries(domain_info.checks).map(([key, passed]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#475569', textTransform: 'capitalize' }}>{key.replace('test_', '').replace(/_/g, ' ')}</span>
                                {passed ? <CheckCircle size={16} color="#166534" /> : <XCircle size={16} color="#ef4444" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                    {/* Left Column: Metrics & Issues */}
                    <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Score & General Stats */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                            <div style={{ flex: '1 1 200px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>On-Page Score</div>
                                <div style={{ fontSize: '48px', fontWeight: '800', color: (page_metrics?.onpage_score || 0) >= 90 ? '#166534' : (page_metrics?.onpage_score || 0) >= 50 ? '#f59e0b' : '#ef4444' }}>
                                    {page_metrics?.onpage_score || 0}
                                </div>
                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>/ 100</div>
                            </div>

                            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                                <StatBox label="External Links" value={page_metrics?.links_external || 0} />
                                <StatBox label="Internal Links" value={page_metrics?.links_internal || 0} />
                                <StatBox label="Non-Indexable" value={page_metrics?.non_indexable || 0} isBad={(page_metrics?.non_indexable || 0) > 0} onClick={() => navigate(`/sites/${id}/onpage/pages?filter=non_indexable`)} />
                                <StatBox label="Duplicate Content" value={page_metrics?.duplicate_content || 0} isBad={(page_metrics?.duplicate_content || 0) > 0} onClick={() => navigate(`/sites/${id}/onpage/pages?filter=duplicate_content`)} />
                            </div>
                        </div>

                        {/* Detailed Page Checks Grid */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Page Metrics & Checks</h2>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Breakdown of issues found across crawled pages. Click on an issue to see affected pages.</p>
                            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                                Counts come from{' '}
                                <a href="https://docs.dataforseo.com/v3/on_page/summary/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                                    DataForSEO&apos;s crawl
                                </a>
                                . <strong>Render-blocking</strong> resources are common (most sites have some).{' '}
                                <strong>Meta charset consistency</strong> flags when declared encoding doesn&apos;t match detected
                                content. <strong>Duplicate meta tags</strong> means more than one meta of the same type on the
                                page. These are signals to verify in your HTML, not guaranteed Google penalties.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                {/* Primary Metrics */}
                                <CheckItem label="Broken Links" count={page_metrics?.broken_links} isError onClick={() => navigate(`/sites/${id}/onpage/pages?filter=broken_links`)} />
                                <CheckItem label="Broken Resources" count={page_metrics?.broken_resources} isError onClick={() => navigate(`/sites/${id}/onpage/pages?filter=broken_resources`)} />
                                <CheckItem label="Redirect Loops" count={page_metrics?.redirect_loop} isError onClick={() => navigate(`/sites/${id}/onpage/pages?filter=redirect_loop`)} />
                                <CheckItem label="Link Relation Conflicts" count={page_metrics?.links_relation_conflict} isError onClick={() => navigate(`/sites/${id}/onpage/pages?filter=links_relation_conflict`)} />

                                {/* Dynamic Checks from JSON */}
                                {page_metrics?.checks && Object.entries(page_metrics.checks).map(([key, count]) => (
                                    <CheckItem
                                        key={key}
                                        label={key.replace(/_/g, ' ')}
                                        count={count}
                                        isError={
                                            typeof count === 'number' &&
                                            count > 0 &&
                                            SUMMARY_COUNT_IS_BAD.has(key)
                                        }
                                        onClick={() => navigate(`/sites/${id}/onpage/pages?filter=${key}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Crawl Status & Technicals */}
                    <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Crawl Status</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <InfoItem label="Status" value={crawl_status?.extended_crawl_status || crawl_status?.crawl_progress || 'Unknown'} valueColor={crawl_status?.crawl_progress === 'finished' ? '#166534' : '#2563eb'} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <InfoItem label="Pages Crawled" value={crawl_status?.pages_crawled || 0} />
                                    <InfoItem label="In Queue" value={crawl_status?.pages_in_queue || 0} />
                                </div>
                                <InfoItem label="Max Limit" value={crawl_status?.max_crawl_pages} />
                                <InfoItem label="Gateway" value={crawl_status?.crawl_gateway_address} />

                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={12} /> Started: {domain_info?.crawl_start ? new Date(domain_info.crawl_start).toLocaleString() : 'N/A'}
                                    </div>
                                    {domain_info?.crawl_end && (
                                        <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <CheckCircle size={12} /> Ended: {new Date(domain_info.crawl_end).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Codes Breakdown */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Response Codes</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <StatusCodeItem code="404" label="Page Not Found" value={domain_info?.page_not_found_status_code} />
                                <StatusCodeItem code="403" label="Canonicalization" value={domain_info?.canonicalization_status_code} />
                                <StatusCodeItem code="301" label="Directory Browsing" value={domain_info?.directory_browsing_status_code} />
                                <StatusCodeItem code="301" label="WWW Redirect" value={domain_info?.www_redirect_status_code} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

const InfoItem = ({ label, value, subValue, valueColor = '#1e293b', icon }) => (
    <div style={{ display: 'flex', gap: '12px' }}>
        {icon && <div style={{ marginTop: '2px' }}>{icon}</div>}
        <div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: valueColor, wordBreak: 'break-word' }}>{value !== undefined && value !== null ? value : '-'}</div>
            {subValue && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{subValue}</div>}
        </div>
    </div>
);

const StatBox = ({ label, value, isBad, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #f1f5f9',
            cursor: onClick ? 'pointer' : 'default',
            transition: onClick ? 'all 0.2s' : 'none'
        }}
        onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = '#f1f5f9'; }}
        onMouseLeave={(e) => { if (onClick) e.currentTarget.style.background = '#f8fafc'; }}
    >
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: isBad ? '#ef4444' : '#1e293b' }}>{value}</div>
    </div>
);

const CheckItem = ({ label, count, isError, onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #f1f5f9',
            cursor: onClick ? 'pointer' : 'default',
            transition: onClick ? 'all 0.2s' : 'none'
        }}
        onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = '#f1f5f9'; }}
        onMouseLeave={(e) => { if (onClick) e.currentTarget.style.background = '#f8fafc'; }}
    >
        <span style={{ fontSize: '12px', color: '#475569', textTransform: 'capitalize' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{count !== undefined && count !== null ? count : 0}</span>
            {isError && typeof count === 'number' && count > 0 && <AlertTriangle size={14} color="#ef4444" />}
        </div>
    </div>
);

const StatusCodeItem = ({ code, label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
        <span style={{ color: '#64748b' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', fontSize: '12px', fontWeight: '600' }}>{value || '-'}</span>
        </div>
    </div>
);
