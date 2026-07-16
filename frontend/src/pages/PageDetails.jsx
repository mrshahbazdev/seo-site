import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronRight, Layout, Image as ImageIcon, Link as LinkIcon, FileText, Globe } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function PageDetails() {
    const { t } = useTranslation();
    const { siteId, pageId } = useParams();
    const navigate = useNavigate();
    const [, setPage] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [analyzingPaid, setAnalyzingPaid] = useState(false);

    const fetchAnalysis = async (refresh = false) => {
        try {
            setLoading(true);
            if (refresh) setAnalyzing(true);

            const token = localStorage.getItem('token');
            const url = `${API_BASE}/sites/${siteId}/pages/${pageId}${refresh ? '?refresh=true' : ''}`;

            console.log('Fetching analysis from:', url);

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', res.status);

            // Check content type
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                const text = await res.text();
                console.error('Received non-JSON response:', text.substring(0, 500));
                throw new Error("Server returned non-JSON response. Check console for details.");
            }

            const data = await res.json();

            if (data.success) {
                setPage(data.page);
                setAnalysis(data.analysis);
            } else {
                toast.error(data.message || t('pageDetails.failedToLoadAnalysis'));
            }
        } catch (error) {
            console.error('Error fetching analysis:', error);
            toast.error(t('pageDetails.failedToLoadAnalysis'));
        } finally {
            setLoading(false);
            if (refresh) setAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, [siteId, pageId]);

    const handlePaidAnalysis = async () => {
        // If we already have data, just go to the page
        if (analysis.dataforseo) {
            navigate(`/sites/${siteId}/pages/${pageId}/paid-analysis`);
            return;
        }

        if (!window.confirm(t('pageDetails.paidAnalysisConfirm'))) return;

        try {
            setAnalyzingPaid(true);
            const token = localStorage.getItem('token');
            const url = `${API_BASE}/sites/${siteId}/pages/${pageId}/analyze/paid`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                toast.success(t('pageDetails.deepAnalysisComplete'));
                // Navigate to the new page
                navigate(`/sites/${siteId}/pages/${pageId}/paid-analysis`);
            } else {
                toast.error(data.message || t('pageDetails.analysisFailed'));
            }
        } catch (error) {
            console.error('Paid Analysis error:', error);
            toast.error(t('pageDetails.failedToRunPaid'));
        } finally {
            setAnalyzingPaid(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#64748b' }}>{t('pageDetails.analyzingPageStructure')}</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (!analysis) return <div>{t('pageDetails.failedToLoadAnalysis')}</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '12px' }}>
                        <ArrowLeft size={16} /> {t('pageDetails.backToAudit')}
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {/* Score Circle */}
                            <div style={{
                                position: 'relative',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: `conic-gradient(${analysis.score >= 90 ? '#22c55e' : analysis.score >= 50 ? '#f59e0b' : '#ef4444'} ${analysis.score * 3.6}deg, #e2e8f0 0deg)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                viewBox: '0 0 60 60',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '800',
                                    fontSize: '18px',
                                    color: '#1e293b'
                                }}>
                                    {analysis.score ?? '?'}
                                </div>
                            </div>

                            <div>
                                <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0', wordBreak: 'break-all' }}>
                                    {analysis.overview.title || t('pageDetails.untitledPage')}
                                </h1>
                                <a href={analysis.overview.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Globe size={14} /> {analysis.overview.url}
                                </a>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <LanguageSwitcher />
                            <button
                                onClick={handlePaidAnalysis}
                                disabled={analyzingPaid}
                                style={{ padding: '8px 16px', background: analyzingPaid ? '#94a3b8' : analysis.dataforseo ? '#22c55e' : '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: analyzingPaid ? 'not-allowed' : 'pointer' }}
                            >
                                {analyzingPaid ? 'Processing...' : analysis.dataforseo ? 'View Paid Analysis' : '⚡ Paid Deep Analysis'}
                            </button>
                            <button
                                onClick={() => fetchAnalysis(true)}
                                disabled={analyzing}
                                style={{ padding: '8px 16px', background: analyzing ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: analyzing ? 'not-allowed' : 'pointer' }}
                            >
                                {analyzing ? 'Analyzing...' : 'Re-Analyze Page'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 24px', display: 'grid', gap: '24px' }}>

                {/* Screenshot & Visual Preview */}
                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{t('pageDetails.onPagePreview')}</h2>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{t('pageDetails.extendedCapture')}</span>
                    </div>
                    <div style={{ position: 'relative', height: '600px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
                        <img
                            src={`https://image.thum.io/get/width/1200/crop/1200/noanimate/${analysis.overview.url}`}
                            alt="Page Preview"
                            style={{ width: '100%', minHeight: '100%', objectFit: 'contain', objectPosition: 'top' }}
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1200x800?text=Preview+Unavailable'; }}
                        />
                    </div>
                </div>

                {/* Issues Summary Panel */}
                <IssuesPanel analysis={analysis} />

                {/* 1. URL & Crawl Overview */}
                <Section title={t('pageDetails.urlCrawlOverview')} icon={<Globe size={20} />}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <InfoItem label={t('pageDetails.statusCode')} value={analysis.overview.status_code} status="success" />
                        <InfoItem label={t('pageDetails.responseTime')} value={analysis.performance?.load_time ? `${analysis.performance.load_time}ms` : 'N/A'} status={!analysis.performance?.load_time ? 'neutral' : analysis.performance.load_time < 500 ? 'success' : analysis.performance.load_time < 1000 ? 'warning' : 'error'} />
                        <InfoItem label={t('pageDetails.indexable')} value={analysis.overview.indexable ? 'YES' : 'NO'} status={analysis.overview.indexable ? 'success' : 'error'} />
                        <InfoItem label={t('pageDetails.canonical')} value={analysis.overview.canonical || t('pageDetails.missing')} status={analysis.overview.canonical ? 'success' : 'warning'} />
                        <InfoItem label={t('pageDetails.depth')} value="1" />
                    </div>
                </Section>

                {/* 2. Indexing & Robots */}
                <Section title={t('pageDetails.indexingRobots')} icon={<FileText size={20} />}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <InfoItem label={t('pageDetails.metaRobots')} value={analysis.meta.robots || t('pageDetails.noneLabel')} />
                        <InfoItem label={t('pageDetails.metaDescription')} value={analysis.meta.description || t('pageDetails.missing')} status={analysis.meta.description ? 'neutral' : 'warning'} />
                        <InfoItem label={t('pageDetails.langAttribute')} value={analysis.overview.lang || t('pageDetails.missing')} status={analysis.overview.lang ? 'success' : 'error'} />
                        <InfoItem label={t('pageDetails.charsetLabel')} value={analysis.overview.charset || t('pageDetails.missing')} status={analysis.overview.charset ? 'success' : 'error'} />
                    </div>
                </Section>

                {/* 2b. Social & Mobile */}
                <Section title={t('pageDetails.socialTechTags')} icon={<Layout size={20} />}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <InfoItem label={t('pageDetails.viewportTag')} value={analysis.meta.viewport ? t('pageDetails.present') : t('pageDetails.missing')} status={analysis.meta.viewport ? 'success' : 'error'} />
                        <InfoItem label={t('pageDetails.ogTitle')} value={analysis.meta.og_title ? t('pageDetails.present') : t('pageDetails.missing')} status={analysis.meta.og_title ? 'success' : 'warning'} />
                        <InfoItem label={t('pageDetails.ogImage')} value={analysis.meta.og_image ? t('pageDetails.present') : t('pageDetails.missing')} status={analysis.meta.og_image ? 'success' : 'warning'} />
                        <InfoItem label={t('pageDetails.twitterCard')} value={analysis.meta.twitter_card ? t('pageDetails.present') : t('pageDetails.missing')} status={analysis.meta.twitter_card ? 'success' : 'warning'} />
                    </div>
                </Section>

                {/* 3. HTML Structure */}
                <Section title={t('pageDetails.fullHtmlStructure')} icon={<Layout size={20} />}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                        <InfoItem label={t('pageDetails.htmlSize')} value={`${Math.round(analysis.structure.html_size / 1024)} KB`} status={analysis.structure.html_size > 100000 ? 'warning' : 'success'} />
                        <InfoItem label={t('pageDetails.domElements')} value={analysis.structure.dom_elements} status={analysis.structure.dom_elements > 1500 ? 'warning' : 'success'} />
                        <InfoItem label={t('pageDetails.externalJs')} value={analysis.structure.external_js} status={analysis.structure.external_js > 15 ? 'warning' : 'neutral'} />
                        <InfoItem label={t('pageDetails.externalCss')} value={analysis.structure.external_css} />
                        <InfoItem label={t('pageDetails.inlineCss')} value={analysis.structure.inline_css ? 'YES' : 'NO'} status="neutral" />
                    </div>

                    {/* Resources List */}
                    <div style={{ marginTop: '20px', display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        {/* External JS */}
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>{t('pageDetails.externalJavascript')} ({analysis.structure.external_js})</h3>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                                {analysis.structure.external_js_list && analysis.structure.external_js_list.length > 0 ? (
                                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#64748b' }}>
                                        {analysis.structure.external_js_list.map((url, i) => (
                                            <li key={i} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>
                                                <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>{url.split('/').pop() || url}</a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t('pageDetails.noneDetected')}</span>}
                            </div>
                        </div>
                        {/* Internal JS */}
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>{t('pageDetails.internalJavascript')} ({analysis.structure.internal_js_list?.length || 0})</h3>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                                {analysis.structure.internal_js_list && analysis.structure.internal_js_list.length > 0 ? (
                                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#64748b' }}>
                                        {analysis.structure.internal_js_list.map((url, i) => (
                                            <li key={i} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>
                                                <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>{url.split('/').pop() || url}</a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t('pageDetails.noneDetected')}</span>}
                            </div>
                        </div>
                        {/* External CSS */}
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>{t('pageDetails.externalCssLabel')} ({analysis.structure.external_css})</h3>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                                {analysis.structure.external_css_list && analysis.structure.external_css_list.length > 0 ? (
                                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#64748b' }}>
                                        {analysis.structure.external_css_list.map((url, i) => (
                                            <li key={i} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>
                                                <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>{url.split('/').pop() || url}</a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t('pageDetails.noneDetected')}</span>}
                            </div>
                        </div>
                        {/* Internal CSS */}
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>{t('pageDetails.internalCssLabel')} ({analysis.structure.internal_css_list?.length || 0})</h3>
                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>
                                {analysis.structure.internal_css_list && analysis.structure.internal_css_list.length > 0 ? (
                                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#64748b' }}>
                                        {analysis.structure.internal_css_list.map((url, i) => (
                                            <li key={i} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>
                                                <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>{url.split('/').pop() || url}</a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t('pageDetails.noneDetected')}</span>}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 4. Heading Structure */}
                <HeadingsSection analysis={analysis} />

                {/* 5. Content Analysis */}
                <Section title={t('pageDetails.contentAnalysis')} icon={<FileText size={20} />}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', flex: 1 }}>
                            <InfoItem label={t('pageDetails.wordCountLabel')} value={analysis.content.word_count} status={analysis.content.word_count < 300 ? 'warning' : 'success'} />
                            <InfoItem label={t('pageDetails.paragraphsLabel')} value={analysis.content.paragraph_count || 0} />
                        </div>
                        <button
                            onClick={() => navigate(`/sites/${siteId}/pages/${pageId}/content`)}
                            style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <FileText size={14} /> {t('pageDetails.viewContent')}
                        </button>
                    </div>

                    {analysis.content.paragraphs && analysis.content.paragraphs.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>{t('pageDetails.paragraphAnalysis')}</h3>
                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                                {analysis.content.paragraphs.map((p, i) => (
                                    <div key={i} style={{ marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>{t('pageDetails.lengthChars', { count: p.length })}</span>
                                            {p.length > 300 && <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold' }}>{t('pageDetails.tooLong')}</span>}
                                        </div>
                                        <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: '1.5' }}>{p.text.substring(0, 150)}{p.text.length > 150 ? '...' : ''}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Section>

                {/* 6. Images */}
                <Section title={t('pageDetails.imagesAnalysis')} icon={<ImageIcon size={20} />}>
                    <div style={{ marginBottom: '12px', display: 'flex', gap: '16px' }}>
                        <div style={{ color: '#ef4444', fontWeight: 'bold' }}>{analysis.images.missing_alt_count} {t('pageDetails.missingAlt')}</div>
                        <div style={{ color: '#64748b' }}>{analysis.images.total} {t('pageDetails.totalImages')}</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>{t('pageDetails.imageSource')}</th>
                                    <th style={{ padding: '8px' }}>{t('pageDetails.altText')}</th>
                                    <th style={{ padding: '8px' }}>{t('common.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.images.list.map((img, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteWhiteSpace: 'nowrap' }} title={img.src}>{img.src}</td>
                                        <td style={{ padding: '8px', color: img.missing_alt ? '#ef4444' : '#10b981' }}>
                                            {img.missing_alt ? t('pageDetails.missingLabel') : img.alt}
                                        </td>
                                        <td style={{ padding: '8px' }}>200</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>

                {/* 7. Links */}
                <LinksSection analysis={analysis} />
            </div>
        </div>
    );
}



const HeadingsSection = ({ analysis }) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState('all'); // all, h1, h2, h3, h4, h5, h6

    const filteredHeadings = analysis.headings.list.filter(h => {
        if (filter === 'all') return true;
        return h.tag === filter;
    });

    return (
        <Section title={t('pageDetails.headingStructure')} icon={<Layout size={20} />}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setFilter('all')}
                    style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: filter === 'all' ? '#2d3748' : 'white', color: filter === 'all' ? 'white' : '#4a5568', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                    {t('common.all')}
                </button>
                {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(tag => (
                    <button
                        key={tag}
                        onClick={() => setFilter(tag)}
                        style={{
                            padding: '4px 12px', borderRadius: '6px', border: 'none',
                            background: filter === tag ? '#2d3748' : (tag === 'h1' && analysis.headings.count[tag] !== 1) ? '#fee2e2' : '#e0f2fe',
                            color: filter === tag ? 'white' : (tag === 'h1' && analysis.headings.count[tag] !== 1) ? '#991b1b' : '#075985',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                            display: 'flex', gap: '4px', alignItems: 'center'
                        }}
                    >
                        {tag.toUpperCase()}: {analysis.headings.count[tag] || 0}
                    </button>
                ))}
            </div>

            {analysis.headings.hierarchy_errors && analysis.headings.hierarchy_errors.length > 0 && (
                <div style={{ marginBottom: '16px', background: '#fffbeb', border: '1px solid #fcd34d', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#b45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={14} /> {t('pageDetails.structureIssuesDetected')}:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {analysis.headings.hierarchy_errors.map((err, i) => (
                            <li key={i} style={{ fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>
                                {t('pageDetails.headingSkip', { transition: err.replace('Skipped heading level: ', '') })}
                                <span style={{ display: 'block', fontStyle: 'italic', fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                                    {t('pageDetails.headingSkipRecommendation')}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                {filteredHeadings.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '16px' }}>{t('pageDetails.noHeadingsFilter', { filter: filter.toUpperCase() })}</div>
                ) : (
                    filteredHeadings.map((h, i) => (
                        <div key={i} style={{
                            marginLeft: filter !== 'all' ? 0 : h.tag === 'h1' ? 0 : h.tag === 'h2' ? '20px' : h.tag === 'h3' ? '40px' : h.tag === 'h4' ? '60px' : '80px',
                            padding: '6px 0',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#334155',
                            borderBottom: '1px dashed #e2e8f0'
                        }}>
                            <span style={{
                                textTransform: 'uppercase',
                                fontSize: '10px',
                                fontWeight: '700',
                                color: '#64748b',
                                background: 'white',
                                border: '1px solid #cbd5e1',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                minWidth: '28px',
                                textAlign: 'center'
                            }}>{h.tag}</span>
                            {h.text || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>{t('pageDetails.emptyHeading')}</span>}
                        </div>
                    ))
                )}
            </div>
        </Section>
    );
};

const LinksSection = ({ analysis }) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState('all'); // all, internal, external

    const filteredLinks = analysis.links.list.filter(link => {
        if (filter === 'internal') return link.is_internal;
        if (filter === 'external') return !link.is_internal;
        return true;
    });

    return (
        <Section title={t('pageDetails.linksAnalysis')} icon={<LinkIcon size={20} />}>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <button
                    onClick={() => setFilter('all')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px', fontWeight: filter === 'all' ? '700' : '400', color: filter === 'all' ? '#3b82f6' : '#64748b' }}
                >
                    {t('pageDetails.allLinks')}
                </button>
                <button
                    onClick={() => setFilter('internal')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px', fontWeight: filter === 'internal' ? '700' : '400', color: filter === 'internal' ? '#3b82f6' : '#64748b' }}
                >
                    <strong>{analysis.links.internal_count}</strong> {t('onPage.internalLinks')}
                </button>
                <button
                    onClick={() => setFilter('external')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px', fontWeight: filter === 'external' ? '700' : '400', color: filter === 'external' ? '#3b82f6' : '#64748b' }}
                >
                    <strong>{analysis.links.external_count}</strong> {t('onPage.externalLinks')}
                </button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {filteredLinks.map((link, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '16px' }}>
                            <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>{link.href}</a>
                        </div>
                        <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                            background: link.is_internal ? '#dbeafe' : '#f3f4f6',
                            color: link.is_internal ? '#1e40af' : '#4b5563'
                        }}>
                            {link.is_internal ? t('onPage.internalLinks') : t('onPage.externalLinks')}
                        </span>
                    </div>
                ))}
                {filteredLinks.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>{t('pageDetails.noLinksFound')}</div>}
            </div>
        </Section>
    );
};

const IssuesPanel = ({ analysis }) => {
    const { t } = useTranslation();
    const issues = {
        critical: [],
        warning: [],
        passed: []
    };

    // Calculate issues
    if (analysis.overview.canonical === null) issues.critical.push(t('pageDetails.missingCanonical'));
    if (!analysis.overview.title) issues.critical.push(t('pageDetails.missingTitleTag'));
    else if (analysis.overview.title.length > 60) issues.warning.push(t('pageDetails.titleTooLong', { count: analysis.overview.title.length }));

    if (analysis.headings.count.h1 !== 1) issues.critical.push(analysis.headings.count.h1 === 0 ? t('pageDetails.missingH1') : t('pageDetails.multipleH1'));

    // Warnings
    if (analysis.images.missing_alt_count > 0) issues.warning.push(t('pageDetails.missingAltImages', { count: analysis.images.missing_alt_count }));
    if (analysis.content.word_count < 300) issues.warning.push(t('pageDetails.thinContent'));
    if (analysis.structure.dom_elements > 1500) issues.warning.push(t('pageDetails.excessiveDom'));

    // Performance checks
    if (analysis.performance?.load_time > 1000) issues.critical.push(t('pageDetails.verySlowResponse', { time: analysis.performance.load_time }));
    else if (analysis.performance?.load_time > 500) issues.warning.push(t('pageDetails.slowResponse', { time: analysis.performance.load_time }));

    if (!analysis.meta.description) issues.warning.push(t('pageDetails.missingMetaDesc'));
    else if (analysis.meta.description.length < 50) issues.warning.push(t('pageDetails.metaDescTooShort'));
    else if (analysis.meta.description.length > 160) issues.warning.push(t('pageDetails.metaDescTooLong', { count: analysis.meta.description.length }));

    if (!analysis.meta.viewport) issues.warning.push(t('pageDetails.missingViewport'));
    if (!analysis.overview.lang) issues.warning.push(t('pageDetails.missingLangAttr'));
    if (!analysis.meta.og_title) issues.warning.push(t('pageDetails.missingOgTags'));

    // Passed
    if (analysis.overview.indexable) issues.passed.push(t('pageDetails.pageIsIndexable'));
    if (analysis.headings.count.h1 === 1) issues.passed.push(t('pageDetails.h1Correct'));
    if (analysis.overview.charset) issues.passed.push(t('pageDetails.charsetDeclared', { charset: analysis.overview.charset }));
    if (analysis.meta.viewport) issues.passed.push(t('pageDetails.mobileViewportSet'));

    return (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>{t('pageDetails.issuesSummaryPanel')}</h2>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} /> {t('pageDetails.criticalErrors')} ({issues.critical.length})
                    </h3>
                    {issues.critical.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>{t('pageDetails.noneLabel')}</p> : (
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {issues.critical.map((issue, i) => (
                                <li key={i} style={{ fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>{issue}</li>
                            ))}
                        </ul>
                    )}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} /> {t('pageDetails.warningsLabel')} ({issues.warning.length})
                    </h3>
                    {issues.warning.length === 0 ? <p style={{ fontSize: '13px', color: '#64748b' }}>{t('pageDetails.noneLabel')}</p> : (
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {issues.warning.map((issue, i) => (
                                <li key={i} style={{ fontSize: '13px', color: '#b45309', marginBottom: '4px' }}>{issue}</li>
                            ))}
                        </ul>
                    )}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={16} /> {t('pageDetails.passedChecks')} ({issues.passed.length})
                    </h3>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {issues.passed.map((item, i) => (
                            <li key={i} style={{ fontSize: '13px', color: '#047857', marginBottom: '4px' }}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, icon, children }) => (
    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {icon} {title}
        </h2>
        {children}
    </div>
);

const InfoItem = ({ label, value, status = 'neutral' }) => {
    const colors = {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        neutral: '#1e293b'
    };
    return (
        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontWeight: '600', color: colors[status], fontSize: '15px' }}>{value}</div>
        </div>
    );
};

const Badge = ({ label, count, color }) => {
    const bg = color === 'success' ? '#dcfce7' : color === 'error' ? '#fee2e2' : '#e0f2fe';
    const text = color === 'success' ? '#166534' : color === 'error' ? '#991b1b' : '#075985';
    return (
        <span style={{ padding: '4px 12px', borderRadius: '6px', background: bg, color: text, fontSize: '13px', fontWeight: '600' }}>
            {label}: {count}
        </span>
    );
};
