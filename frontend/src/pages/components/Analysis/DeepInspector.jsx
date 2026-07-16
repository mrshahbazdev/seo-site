import { useState, useEffect } from 'react';
import { ChevronRight, Image as ImageIcon, Link as LinkIcon, Layout, Shield, AlertTriangle, CheckCircle, XCircle, FileText, RefreshCw, Globe, Server, Zap, Gauge, SpellCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../../../i18n/LanguageContext';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function DeepInspector({ siteId, pageId, url, onAnalysisComplete }) {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('structure');
    const [paidData, _setPaidData] = useState(null);

    useEffect(() => {
        if (url) fetchDeepAnalysis();
    }, [url]);

    const fetchDeepAnalysis = async (refresh = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/sites/${siteId}/pages/${pageId}/analyze/deep${refresh ? '?refresh=true' : ''}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const result = await res.json();
            if (result.success) {
                setData(result.data);
                if (onAnalysisComplete) {
                    onAnalysisComplete(result.data);
                }
                // Also check if we have paid data cached in the page object? 
                // The API doesn't return paid data here, `analyze/deep` returns `analysis_data`.
                // We might need to fetch paid data separately or check if it's in the deep response?
                // The Controller `analyzeDeep` returns `analysis_data`.
                // The Controller `analyzePaid` stores in `analysis_data['paid']`.
                // So if we fetched deep analysis, it might be in `result.data.paid` IF `analysis_data` contains it.
                // However, `analyzeDeep` (lines 88-140 in Controller) overwrites `analysis_data` with `$analysis`.
                // WAIT. If `analyzeDeep` OVERWRITES `analysis_data`, we lose `paid` data if it was stored there!
                // I need to fix the controller to MERGE data.

                // For now, let's assume separate storage or merge fix.
                // I will update the frontend assuming I fix the backend merge logic or use separate endpoint.
                // Best is to use `fetchPaidAnalysis` when Performance tab is clicked.
            } else {
                toast.error(result.message || t('deepInspector.analysisFailed'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('deepInspector.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginTop: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={20} color="#3b82f6" /> {t('deepInspector.title')}
                </h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => fetchDeepAnalysis(true)}
                        disabled={loading}
                        style={{
                            fontSize: '13px',
                            color: loading ? '#94a3b8' : '#3b82f6',
                            background: 'none',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {loading && <div style={{ width: '12px', height: '12px', border: '2px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                        {loading ? t('deepInspector.analyzing') : t('deepInspector.reAnalyze')}
                    </button>
                </div>
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
                <TabButton active={activeTab === 'structure'} onClick={() => setActiveTab('structure')} icon={<Layout size={16} />} label={t('deepInspector.structure')} />
                <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={<Zap size={16} />} label={t('deepInspector.performance')} />
                <TabButton active={activeTab === 'images'} onClick={() => setActiveTab('images')} icon={<ImageIcon size={16} />} label={t('deepInspector.images')} count={data?.images?.length} />
                <TabButton active={activeTab === 'links'} onClick={() => setActiveTab('links')} icon={<LinkIcon size={16} />} label={t('deepInspector.links')} count={data?.links?.length} />
                <TabButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<FileText size={16} />} label={t('deepInspector.content')} />
            </div>

            <div style={{ padding: '24px' }}>
                {!data && loading && <div style={{ textAlign: 'center', color: '#64748b' }}>{t('deepInspector.runningAnalysis')}</div>}

                {data && activeTab === 'structure' && <StructureTab headings={data.headings} meta={data.meta} />}
                {activeTab === 'performance' && <PerformanceTab siteId={siteId} pageId={pageId} initialData={paidData} />}
                {data && activeTab === 'images' && <ImagesTab images={data.images} pageUrl={url} />}
                {data && activeTab === 'links' && <LinksTab links={data.links} pageUrl={url} />}
                {data && activeTab === 'content' && <ContentTab text={data.content_text} siteId={siteId} pageId={pageId} />}
            </div>
        </div>
    );
}

const PerformanceTab = ({ siteId, pageId, initialData }) => {
    const { t } = useTranslation();
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);



    const fetchPerformance = async (refresh = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Default to mobile strategy
            const res = await fetch(`${API_BASE}/sites/${siteId}/pages/${pageId}/analyze/speed${refresh ? '?refresh=true' : ''}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ strategy: 'mobile' })
            });
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            } else {
                toast.error(result.message || t('deepInspector.speedFailed'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('deepInspector.speedTestError'));
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>{t('deepInspector.runningPageSpeed')}</div>;

    if (!data) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
                <Zap size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>{t('deepInspector.performanceAudit')}</h3>
                <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                    {t('deepInspector.performanceAuditDesc')}
                    <br /><span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>{t('deepInspector.free')}</span>
                </p>
                <button
                    onClick={() => fetchPerformance(true)}
                    disabled={loading}
                    style={{
                        padding: '10px 24px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Gauge size={18} /> {t('deepInspector.runPageSpeed')}
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Scores Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <MetricCard label="Performance" value={data.scores.performance} unit="" isScore />
                <MetricCard label="Accessibility" value={data.scores.accessibility} unit="" isScore />
                <MetricCard label="Best Practices" value={data.scores.best_practices} unit="" isScore />
                <MetricCard label="SEO" value={data.scores.seo} unit="" isScore />
            </div>

            {/* Core Web Vitals */}
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#334155' }}>{t('deepInspector.coreWebVitals')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <MetricCard label="LCP" value={parseFloat(data.metrics.lcp)} unit="s" good={2.5} bad={4.0} reverse desc="Largest Contentful Paint" />
                <MetricCard label="CLS" value={parseFloat(data.metrics.cls)} unit="" good={0.1} bad={0.25} reverse desc="Cumulative Layout Shift" />
                <MetricCard label="TBT" value={parseFloat(data.metrics.tbt.replace('ms', '').replace(',', ''))} unit="ms" good={200} bad={600} reverse desc="Total Blocking Time" />
                <MetricCard label="Speed Index" value={parseFloat(data.metrics.si)} unit="s" good={3.4} bad={5.8} reverse desc="Speed Index" />
            </div>

            {/* Screenshot if available */}
            {data.screenshot && (
                <div style={{ marginTop: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', maxWidth: '300px' }}>
                    <img src={data.screenshot} alt="Page Screenshot" style={{ width: '100%', display: 'block' }} />
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ label, value, unit, good, bad, reverse, desc, isScore }) => {
    let color = '#3b82f6';
    const num = parseFloat(value);

    if (!isNaN(num)) {
        if (isScore) {
            if (num >= 90) color = '#166534';
            else if (num >= 50) color = '#d97706';
            else color = '#dc2626';
        } else {
            if (reverse) {
                if (num <= good) color = '#166534';
                else if (num <= bad) color = '#d97706';
                else color = '#dc2626';
            }
        }
    }

    return (
        <div style={{ padding: '24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: color, marginBottom: '4px' }}>
                {value}<span style={{ fontSize: '16px', fontWeight: '500', color: '#94a3b8', marginLeft: '2px' }}>{unit}</span>
            </div>
            {desc && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{desc}</div>}
        </div>
    );
};

const ContentTab = ({ text = '', pageId, siteId }) => {
    const { t } = useTranslation();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const charCount = text.length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 wpm

    const [grammarData, setGrammarData] = useState(null);
    const [loading, setLoading] = useState(false);

    const checkGrammar = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/sites/${siteId}/pages/${pageId}/analyze/grammar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            const result = await res.json();
            if (result.success) {
                setGrammarData(result.data);
                toast.success(t('deepInspector.grammarComplete'));
            } else {
                toast.error(result.message || t('deepInspector.grammarFailed'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('deepInspector.grammarError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatPill label={t('deepInspector.words')} value={wordCount} />
                <StatPill label={t('deepInspector.characters')} value={charCount} />
                <StatPill label={t('deepInspector.sentences')} value={sentenceCount} />
                <StatPill label={t('deepInspector.readingTime')} value={`~${readingTime} min`} />
            </div>

            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{t('deepInspector.grammarSpelling')}</h3>
                    <button
                        onClick={checkGrammar}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '13px'
                        }}
                    >
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <SpellCheck size={14} />}
                        {loading ? t('deepInspector.checking') : t('deepInspector.checkNow')}
                    </button>
                </div>

                {grammarData && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                            {t('deepInspector.foundIssues', { count: grammarData.matches.length })}
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {grammarData.matches.length === 0 ? (
                                <div style={{ padding: '24px', textAlign: 'center', color: '#166534', fontWeight: '500' }}>
                                    <CheckCircle size={24} style={{ marginBottom: '8px' }} />
                                    <div>{t('deepInspector.noIssues')}</div>
                                </div>
                            ) : (
                                grammarData.matches.map((match, i) => (
                                    <div key={i} style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <AlertTriangle size={16} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', marginBottom: '4px' }}>{match.message}</div>
                                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontStyle: 'italic', background: '#fffbeb', padding: '8px', borderRadius: '4px' }}>
                                                    "{match.context.text.slice(0, match.context.offset)}
                                                    <span style={{ borderBottom: '2px solid #ef4444', fontWeight: 'bold' }}>
                                                        {match.context.text.slice(match.context.offset, match.context.offset + match.context.length)}
                                                    </span>
                                                    {match.context.text.slice(match.context.offset + match.context.length)}"
                                                </div>
                                                {match.replacements.length > 0 && (
                                                    <div style={{ fontSize: '13px', color: '#166534' }}>
                                                        <span style={{ fontWeight: '600' }}>{t('deepInspector.suggestions')} </span>
                                                        {match.replacements.map(r => r.value).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginBottom: '12px', fontSize: '14px', color: '#64748b' }}>
                {t('deepInspector.rawTextDesc')}
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '500px', overflowY: 'auto', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#334155', fontFamily: 'monospace' }}>
                {text || <i style={{ color: '#94a3b8' }}>{t('deepInspector.noTextContent')}</i>}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        style={{
            flex: '1 1 120px',
            padding: '12px',
            border: 'none',
            background: active ? 'white' : '#f8fafc',
            borderBottom: active ? '2px solid #3b82f6' : '1px solid transparent',
            color: active ? '#0f172a' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px'
        }}
    >
        {icon} {label} {count !== undefined && <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', color: '#475569' }}>{count}</span>}
    </button>
);

const StructureTab = ({ headings = [], meta = {} }) => {
    const { t } = useTranslation();
    return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>{t('deepInspector.headingStructure')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {headings.map((h, i) => (
                    <div key={i} style={{
                        marginLeft: `${Math.min((parseInt(h.tag.replace('h', '')) - 1) * 20, 60)}px`,
                        fontSize: '14px',
                        color: '#334155',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', width: '24px', flexShrink: 0 }}>{h.tag}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text}</span>
                    </div>
                ))}
                {headings.length === 0 && <div style={{ color: '#94a3b8' }}>{t('deepInspector.noHeadings')}</div>}
            </div>
        </div>
        <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>{t('deepInspector.keyMetaTags')}</h3>
            <MetaRow label="Title" value={meta.title} />
            <MetaRow label="Description" value={meta.description} />
            <MetaRow label="Canonical" value={meta.canonical} />
            <MetaRow label="Robots" value={meta.robots} />
        </div>
    </div>
    );
};

const MetaRow = ({ label, value }) => {
    const { t } = useTranslation();
    return (
    <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{value || <span style={{ color: '#ef4444' }}>{t('deepInspector.missing')}</span>}</div>
    </div>
    );
};

// Helper function to construct full URL
const getFullUrl = (href, baseUrl) => {
    if (!href) return null;
    if (href.startsWith('http://') || href.startsWith('https://')) return href;
    if (href.startsWith('#')) return null;

    // Relative URL - construct full URL
    try {
        const base = new URL(baseUrl);
        return new URL(href, base.origin).href;
    } catch {
        return href;
    }
};

const ImagesTab = ({ images = [], pageUrl }) => {
    const { t } = useTranslation();
    return (
        <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <StatPill label={t('deepInspector.totalImages')} value={images.length} />
                <StatPill label={t('deepInspector.missingAlt')} value={images.filter(i => !i.has_alt).length} isBad={images.filter(i => !i.has_alt).length > 0} />
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                        <tr>
                            <th style={thStyle}>Preview</th>
                            <th style={thStyle}>Alt Text</th>
                            <th style={thStyle}>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {images.map((img, i) => {
                            const fullSrc = getFullUrl(img.src, pageUrl);
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={tdStyle}>
                                        <ImagePreview src={fullSrc} />
                                    </td>
                                    <td style={tdStyle}>
                                        {img.has_alt ? (
                                            <span style={{ color: '#166534' }}>{img.alt}</span>
                                        ) : (
                                            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> {t('deepInspector.missingAlt')}</span>
                                        )}
                                    </td>
                                    <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>{img.src}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ImagePreview = ({ src }) => {
    const [broken, setBroken] = useState(false);

    if (!src || broken) {
        return (
            <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '10px', gap: '2px' }}>
                <XCircle size={16} />
                <span>Broken</span>
            </div>
        );
    }

    return (
        <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
                src={src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setBroken(true)}
            />
        </div>
    );
};

const LinksTab = ({ links = [], pageUrl }) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState(null);

    const internalCount = links.filter(l => l.is_internal).length;
    const externalCount = links.filter(l => !l.is_internal).length;
    const missingTextCount = links.filter(l => !l.has_text).length;

    const filteredLinks = filter
        ? links.filter(l => {
            if (filter === 'internal') return l.is_internal;
            if (filter === 'external') return !l.is_internal;
            if (filter === 'missing_text') return !l.has_text;
            return true;
        })
        : links;

    return (
        <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <StatPill
                    label={t('deepInspector.internal')}
                    value={internalCount}
                    onClick={() => setFilter(filter === 'internal' ? null : 'internal')}
                    active={filter === 'internal'}
                    clickable
                />
                <StatPill
                    label={t('deepInspector.external')}
                    value={externalCount}
                    onClick={() => setFilter(filter === 'external' ? null : 'external')}
                    active={filter === 'external'}
                    clickable
                />
                <StatPill
                    label={t('deepInspector.missingAnchor')}
                    value={missingTextCount}
                    isBad={missingTextCount > 0}
                    onClick={() => setFilter(filter === 'missing_text' ? null : 'missing_text')}
                    active={filter === 'missing_text'}
                    clickable
                />
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                        <tr>
                            <th style={thStyle}>Anchor Text</th>
                            <th style={thStyle}>URL</th>
                            <th style={thStyle}>Type</th>
                            <th style={thStyle}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLinks.map((link, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: !link.has_text ? '#fef3c7' : 'transparent' }}>
                                <td style={tdStyle}>
                                    {link.has_text ? (
                                        link.text
                                    ) : (
                                        <span style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                            <AlertTriangle size={12} /> {t('deepInspector.noText')}
                                        </span>
                                    )}
                                </td>
                                <td style={{ ...tdStyle, color: '#3b82f6', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.href}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
                                        background: link.is_internal ? '#dbeafe' : '#fef3c7',
                                        color: link.is_internal ? '#1e40af' : '#92400e'
                                    }}>
                                        {link.is_internal ? t('deepInspector.internal') : t('deepInspector.external')}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <CheckStatusButton url={link.href} autoCheck={link.is_internal} baseUrl={pageUrl} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CheckStatusButton = ({ url, autoCheck, baseUrl }) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const fullUrl = getFullUrl(url, baseUrl);

    useEffect(() => {
        if (autoCheck && fullUrl) {
            check();
        }
    }, [autoCheck, fullUrl]);

    if (!fullUrl) return <span style={{ color: '#cbd5e1' }}>-</span>;

    const check = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/tools/check-resource`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ url: fullUrl })
            });
            const data = await res.json();
            if (data.success) {
                setStatus(data.status_code);
            } else {
                setStatus('Err');
            }
        } catch {
            setStatus('Err');
        } finally {
            setLoading(false);
        }
    };

    if (status) {
        const isBad = status >= 400 || status === 'Err';
        return (
            <span style={{
                color: isBad ? '#ef4444' : '#166534',
                fontWeight: '600',
                fontSize: '12px',
                display: 'flex', alignItems: 'center', gap: '4px'
            }}>
                {isBad ? <XCircle size={12} /> : <CheckCircle size={12} />} {status}
            </span>
        );
    }

    return (
        <button
            onClick={check}
            disabled={loading}
            style={{
                border: '1px solid #e2e8f0',
                background: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
            }}
        >
            {loading ? <RefreshCw size={10} className="animate-spin" /> : <Globe size={10} />} Check
        </button>
    );
};

const StatPill = ({ label, value, isBad, onClick, active, clickable }) => (
    <div
        onClick={clickable ? onClick : undefined}
        style={{
            padding: '6px 12px',
            background: active ? '#3b82f6' : (isBad ? '#fee2e2' : '#f1f5f9'),
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            color: active ? 'white' : (isBad ? '#991b1b' : '#475569'),
            cursor: clickable ? 'pointer' : 'default',
            border: active ? '2px solid #1e40af' : 'none',
            transition: 'all 0.2s'
        }}
    >
        {label}: {value}
    </div>
);

const thStyle = { padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' };
const tdStyle = { padding: '12px' };
