import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Link2, RefreshCw, ExternalLink, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompetitorDetailsPage() {
    const { id, competitorId } = useParams();
    const navigate = useNavigate();
    const [competitor, setCompetitor] = useState(null);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPages, setLoadingPages] = useState(false);

    useEffect(() => {
        fetchCompetitor();
        fetchPages(); // Auto-load anchor texts on mount
    }, [competitorId]);

    const fetchCompetitor = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`https://seostory.de/api/sites/${id}/competitors/${competitorId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                setCompetitor(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load competitor');
        } finally {
            setLoading(false);
        }
    };

    const fetchPages = async () => {
        try {
            setLoadingPages(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`https://seostory.de/api/sites/${id}/competitors/${competitorId}/pages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            console.log('Pages API Response:', data); // Debug log
            if (data.success) {
                console.log('Pages data:', data.data); // Debug log
                setPages(data.data);
                toast.success(`Loaded ${data.data.length} pages!`);
            } else {
                toast.error(data.message || 'Failed to load pages');
            }
        } catch (error) {
            console.error('Fetch pages error:', error);
            toast.error('Failed to load pages');
        } finally {
            setLoadingPages(false);
        }
    };

    const handleAnalyze = async () => {
        try {
            const token = localStorage.getItem('token');
            toast.loading('Analyzing competitor...', { id: 'analyze' });

            const res = await fetch(`https://seostory.de/api/sites/${id}/competitors/${competitorId}/analyze`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Analysis complete!', { id: 'analyze' });
                setCompetitor(data.data);
            } else {
                toast.error(data.message || 'Analysis failed', { id: 'analyze' });
            }
        } catch (error) {
            toast.error('Analysis failed', { id: 'analyze' });
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', color: '#64748b' }}>Loading competitor...</div>
            </div>
        );
    }

    if (!competitor) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', color: '#64748b' }}>Competitor not found</div>
            </div>
        );
    }

    const metrics = competitor.metrics_data;
    const hasMetrics = metrics && Object.keys(metrics).length > 0;

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => navigate(`/sites/${id}/competitors`)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '16px'
                    }}
                >
                    <ArrowLeft size={16} /> Back to Competitors
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                            {competitor.name}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                            <Link2 size={16} />
                            <a href={`https://${competitor.domain}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                {competitor.domain}
                            </a>
                            <ExternalLink size={14} />
                        </div>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={18} /> Refresh Metrics
                    </button>
                </div>
            </div>

            {/* Metrics Overview */}
            {hasMetrics ? (
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={20} /> Domain Metrics
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                        <MetricCard label="Total Backlinks" value={metrics.backlinks?.toLocaleString() || '0'} />
                        <MetricCard label="Referring Domains" value={metrics.referring_domains?.toLocaleString() || '0'} />
                        <MetricCard label="Referring IPs" value={metrics.referring_ips?.toLocaleString() || '0'} />
                        <MetricCard label="Referring Subnets" value={metrics.referring_subnets?.toLocaleString() || '0'} />
                    </div>
                    {competitor.last_analyzed && (
                        <div style={{ marginTop: '16px', fontSize: '13px', color: '#94a3b8', textAlign: 'right' }}>
                            Last updated: {new Date(competitor.last_analyzed).toLocaleString()}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '48px',
                    textAlign: 'center',
                    marginBottom: '24px'
                }}>
                    <BarChart3 size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No Metrics Available</h3>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>
                        Click "Refresh Metrics" to fetch competitor data from DataForSEO
                    </p>
                    <button
                        onClick={handleAnalyze}
                        style={{
                            padding: '12px 24px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Refresh Metrics
                    </button>
                </div>
            )}

            {/* Top Anchor Texts Section */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                        Top Anchor Texts
                    </h2>
                    <button
                        onClick={fetchPages}
                        disabled={loadingPages}
                        style={{
                            padding: '10px 20px',
                            background: loadingPages ? '#94a3b8' : '#f1f5f9',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: loadingPages ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <TrendingUp size={16} /> {loadingPages ? 'Loading...' : 'Load Anchor Texts'}
                    </button>
                </div>

                {pages.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#64748b', minWidth: '200px' }}>Anchor Text</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Rank</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Backlinks</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Broken</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Ref. Domains</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Ref. Pages</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Spam Score</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>First Seen</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pages.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', fontWeight: '500', color: '#0f172a' }}>
                                            {item.anchor || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(no anchor text)</span>}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                            {item.rank?.toLocaleString() || '0'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                                            {item.backlinks?.toLocaleString() || '0'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>
                                            {item.broken_backlinks?.toLocaleString() || '0'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                            {item.referring_domains?.toLocaleString() || '0'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                            {item.referring_pages?.toLocaleString() || '0'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                                            <span style={{
                                                color: item.backlinks_spam_score > 50 ? '#dc2626' : item.backlinks_spam_score > 30 ? '#f59e0b' : '#10b981',
                                                padding: '4px 8px',
                                                background: item.backlinks_spam_score > 50 ? '#fef2f2' : item.backlinks_spam_score > 30 ? '#fffbeb' : '#f0fdf4',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {item.backlinks_spam_score || '0'}%
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>
                                            {item.first_seen ? new Date(item.first_seen).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <a
                                                href={`https://www.google.com/search?q="${encodeURIComponent(item.anchor || '')}" site:${competitor.domain}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Search for backlink sources"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '6px 12px',
                                                    background: '#f1f5f9',
                                                    color: '#3b82f6',
                                                    borderRadius: '6px',
                                                    textDecoration: 'none',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    border: '1px solid #e2e8f0',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.background = '#3b82f6';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.background = '#f1f5f9';
                                                    e.currentTarget.style.color = '#3b82f6';
                                                }}
                                            >
                                                <ExternalLink size={14} /> Find Sources
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                        <p>No anchor texts loaded yet. Click "Load Anchor Texts" to fetch data.</p>
                        <p style={{ fontSize: '13px', marginTop: '8px' }}>
                            Shows the most common anchor texts used in backlinks to this domain.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

const MetricCard = ({ label, value }) => (
    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px' }}>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{value}</div>
    </div>
);
