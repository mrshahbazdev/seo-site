import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Globe } from 'lucide-react';

export default function PaidAnalysisPage() {
    const { siteId, pageId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalysis = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const url = `https://seostory.de/api/sites/${siteId}/pages/${pageId}`;

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            // Check content type
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                const text = await res.text();
                console.error('Received non-JSON response:', text.substring(0, 500));
                throw new Error("Server returned non-JSON response.");
            }

            const data = await res.json();

            if (data.success) {
                setPage(data.page);
                setAnalysis(data.analysis);
            } else {
                toast.error(data.message || 'Failed to load analysis');
            }
        } catch (error) {
            console.error('Error fetching analysis:', error);
            toast.error('Failed to load analysis data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, [siteId, pageId]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#64748b' }}>Loading DataForSEO Report...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (!analysis || !analysis.dataforseo) {
        return (
            <div style={{ minHeight: '100vh', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', textAlign: 'center' }}>
                <div style={{ marginBottom: '20px', color: '#94a3b8' }}>
                    <AlertTriangle size={48} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>No Paid Analysis Found</h1>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>This page has not been analyzed with the Deep Analysis tool yet.</p>
                <button
                    onClick={() => navigate(`/sites/${siteId}/pages/${pageId}`)}
                    style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                    Go Back & Run Analysis
                </button>
            </div>
        );
    }

    const data = analysis.dataforseo;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <button onClick={() => navigate(`/sites/${siteId}/pages/${pageId}`)} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '12px' }}>
                        <ArrowLeft size={16} /> Back to Page Details
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#8b5cf6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', numberOfLines: 1 }}>
                            <span style={{ fontSize: '20px', color: 'white' }}>⚡</span>
                        </div>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>Paid Deep Analysis Report</h1>
                            <a href={analysis.overview.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Globe size={13} /> {analysis.overview.url}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px', display: 'grid', gap: '24px' }}>

                {/* Score & Timing Card */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    {/* OnPage Score */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: `conic-gradient(${data.onpage_score >= 90 ? '#22c55e' : data.onpage_score >= 50 ? '#f59e0b' : '#ef4444'} ${data.onpage_score * 3.6}deg, #e2e8f0 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '24px', color: '#1e293b' }}>
                                {data.onpage_score}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>OnPage Score</div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>Comprehensive DataForSEO Audit</div>
                        </div>
                    </div>

                    {/* Performance Timing */}
                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '32px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Performance Metrics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <MetricItem label="Dom Complete" value={data.page_timing?.dom_complete} />
                            <MetricItem label="Connection" value={data.page_timing?.connection_time} />
                            <MetricItem label="Interactive" value={data.page_timing?.time_to_interactive} />
                            <MetricItem label="Download" value={data.page_timing?.download_time} />
                        </div>
                    </div>
                </div>

                {/* Errors & Issues */}
                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Detailed Issues & Findings</h2>
                    </div>
                    <div style={{ padding: '24px' }}>

                        {/* Resource Errors */}
                        {data.resource_errors?.errors?.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <XCircle size={16} /> Resource Errors
                                </h3>
                                <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '16px', border: '1px solid #fecaca' }}>
                                    {data.resource_errors.errors.map((err, i) => (
                                        <div key={`err-${i}`} style={{ marginBottom: '8px', fontSize: '13px', color: '#b91c1c', display: 'flex', gap: '8px' }}>
                                            <span style={{ fontWeight: '600' }}>Line {err.line}:</span> {err.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Spell Check */}
                        {data.spell?.misspelled?.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#d97706', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={16} /> Spell Check Warnings
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {data.spell.misspelled.map((item, i) => (
                                        <span key={i} style={{ fontSize: '13px', background: '#fffbeb', color: '#b45309', padding: '4px 10px', borderRadius: '20px', border: '1px solid #fcd34d' }}>
                                            {item.word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Checks Grid */}
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '16px' }}>Technical Checks</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                {Object.entries(data.checks || {}).filter(([_, val]) => val === true || val === false).map(([key, val]) => (
                                    <div key={key} style={{
                                        padding: '10px 12px', borderRadius: '8px', border: '1px solid',
                                        borderColor: val ? '#dcfce7' : '#fee2e2',
                                        background: val ? '#f0fdf4' : '#fef2f2',
                                        fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px',
                                        color: val ? '#166534' : '#991b1b'
                                    }}>
                                        {val ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                                        <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

const MetricItem = ({ label, value }) => (
    <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{value ? `${value}ms` : 'N/A'}</div>
    </div>
);
