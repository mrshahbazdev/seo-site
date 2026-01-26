import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Smartphone, Monitor } from 'lucide-react';

export default function PageContent() {
    const { siteId, pageId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('desktop'); // desktop, mobile

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`https://seostory.de/api/sites/${siteId}/pages/${pageId}/analyze`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                const data = await res.json();
                if (data.success) {
                    setPage(data.page);
                    setAnalysis(data.analysis);
                }
            } catch (error) {
                console.error("Failed to load content", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [siteId, pageId]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b' }}>
            Loading content...
        </div>
    );

    if (!analysis) return <div>Failed to load content.</div>;

    const paragraphs = analysis.content.paragraphs || [];

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '12px' }}>
                        <ArrowLeft size={16} /> Back to Analysis
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
                                Extracted Content View
                            </h1>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{analysis.overview.url}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                            <button
                                onClick={() => setViewMode('desktop')}
                                style={{
                                    padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600',
                                    background: viewMode === 'desktop' ? 'white' : 'transparent',
                                    color: viewMode === 'desktop' ? '#0f172a' : '#64748b',
                                    boxShadow: viewMode === 'desktop' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <Monitor size={14} /> Desktop
                            </button>
                            <button
                                onClick={() => setViewMode('mobile')}
                                style={{
                                    padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600',
                                    background: viewMode === 'mobile' ? 'white' : 'transparent',
                                    color: viewMode === 'mobile' ? '#0f172a' : '#64748b',
                                    boxShadow: viewMode === 'mobile' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <Smartphone size={14} /> Mobile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div style={{ maxWidth: viewMode === 'mobile' ? '375px' : '800px', margin: '32px auto', transition: 'max-width 0.3s ease' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '24px', lineHeight: '1.3' }}>
                        {analysis.overview.title}
                    </h1>

                    {paragraphs.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                            <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>No text content extracted.</p>
                        </div>
                    ) : (
                        <div style={{ fontSize: '18px', lineHeight: '1.8', color: '#334155' }}>
                            {paragraphs.map((p, i) => (
                                <div key={i} style={{ marginBottom: '24px', paddingRight: viewMode === 'desktop' ? '120px' : '0', position: 'relative' }}>
                                    <p style={{ margin: 0 }}>{p.text}</p>
                                    <div style={{
                                        position: 'absolute', right: 0, top: 0, width: '100px',
                                        fontSize: '11px', color: '#94a3b8', textAlign: 'right',
                                        display: viewMode === 'desktop' ? 'block' : 'none',
                                        background: '#f8fafc', padding: '4px', borderRadius: '4px'
                                    }}>
                                        {p.word_count} words
                                        {p.length > 300 && <span style={{ color: '#d97706', display: 'block', fontWeight: 'bold' }}>⚠️ Too Long</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                    Showing extracted text only. Styles and layout are stripped for SEO analysis.
                </div>
            </div>
        </div>
    );
}
