import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock, Code, FileText, Layout, Server, ExternalLink, Copy, Globe, Target, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ContentOptimizer from './components/Analysis/ContentOptimizer';
import DeepInspector from './components/Analysis/DeepInspector';
import DuplicateCandidates from './components/Analysis/DuplicateCandidates';
import SocialPreview from './components/Analysis/SocialPreview';
import SchemaValidator from './components/Analysis/SchemaValidator';
import { getDataForSeoCheckStatus } from '../utils/dataforseoChecks';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function OnPagePageDetails() {
    const { id, pageId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showRawData, setShowRawData] = useState(false);

    useEffect(() => {
        fetchPageDetails();
    }, [id, pageId]);

    const fetchPageDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/sites/${id}/onpage/pages/${pageId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                setPage(data.data);
            } else if (data.status === 'no_task') {
                toast.error(t('onPage.sessionExpired'));
                navigate(`/sites/${id}/onpage/summary`);
            } else {
                toast.error(data.message || t('onPage.failedToLoadPages'));
            }
        } catch (error) {
            console.error('Error fetching page details:', error);
            toast.error(t('onPage.failedToLoadPages'));
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (!score) return '#94a3b8';
        if (score >= 90) return '#166534';
        if (score >= 50) return '#d97706';
        return '#dc2626';
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('onPage.loadingDetails')}</div>;
    if (!page) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('onPage.pageNotFound')}</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
                        <button onClick={() => navigate(`/sites/${id}/onpage/pages`)} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div style={{ overflow: 'hidden', minWidth: 0 }}>
                            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {page.url}
                            </h1>
                        </div>
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <LanguageSwitcher />
                        <button
                            onClick={() => window.open(`https://www.google.com/search?q=site:${encodeURIComponent(page.url)}`, '_blank')}
                            style={{ padding: '8px 16px', background: 'white', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        >
                            <Globe size={16} />
                            <span className="btn-text-desktop">{t('onPage.checkIndex')}</span>
                            <span className="btn-text-mobile">Index</span>
                        </button>
                        <button
                            onClick={() => setShowRawData(true)}
                            style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        >
                            <Code size={16} />
                            <span className="btn-text-desktop">{t('onPage.viewRawData')}</span>
                            <span className="btn-text-mobile">Raw</span>
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                .btn-text-desktop { display: none; }
                .btn-text-mobile { display: inline; }
                @media (min-width: 640px) {
                    .btn-text-desktop { display: inline; }
                    .btn-text-mobile { display: none; }
                }
            `}</style>

            <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap', gap: '24px' }}>

                {/* Main Content */}
                <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Duplicate Alert */}
                    {(page.raw_data?.duplicate_content || page.raw_data?.duplicate_title || page.raw_data?.duplicate_description) && (
                        <DuplicateCandidates
                            siteId={id}
                            pageId={pageId}
                            page={page}
                            onNavigate={navigate}
                        />
                    )}

                    {/* SEO Quality Alerts */}
                    <SeoQualityAlerts page={page} />

                    {/* Ranked Keywords */}
                    <RankedKeywords siteId={id} pageId={pageId} url={page.url} />

                    {/* Internal Link Juice */}
                    <LinkJuice siteId={id} url={page.url} />

                    {/* Basic Info Card */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{page.title || t('common.noTitle')}</h2>
                                <a href={page.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {t('common.visitPage')} <ArrowLeft size={12} style={{ transform: 'rotate(135deg)' }} />
                                </a>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: getScoreColor(page.onpage_score) }}>
                                    {page.onpage_score ? Number(page.onpage_score).toFixed(0) : '-'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{t('onPage.onpageScore')}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.statusCode')}</div>
                                <div style={{ fontWeight: '600' }}>{page.status_code}</div>
                            </div>
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.size')}</div>
                                <div style={{ fontWeight: '600' }}>{((page.meta?.size || 0) / 1024).toFixed(1)} KB</div>
                            </div>
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.wordCount')}</div>
                                <div style={{ fontWeight: '600' }}>{page.meta?.content?.plain_text_word_count || page.content?.plain_text_word_count || 0}</div>
                            </div>
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.loadTime')}</div>
                                <div style={{ fontWeight: '600' }}>{page.page_timing?.duration_time || 0} ms</div>
                            </div>
                        </div>
                    </div>

                    {/* Resources & Counts */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layout size={18} /> {t('onPage.resourcesCounts')}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                            {/* Links */}
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>{t('onPage.linksLabel')}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>{t('onPage.internalLinks')}</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.internal_links_count || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>{t('onPage.externalLinks')}</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.external_links_count || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>{t('onPage.inbound')}</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.inbound_links_count || 0}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Images & Scripts */}
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>{t('onPage.assets')}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>{t('onPage.imagesLabel')}</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.images_count || 0} ({Math.round((page.meta?.images_size || 0) / 1024)} KB)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>{t('onPage.scripts')}</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.scripts_count || 0} ({Math.round((page.meta?.scripts_size || 0) / 1024)} KB)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>{t('onPage.stylesheets')}</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.stylesheets_count || 0} ({Math.round((page.meta?.stylesheets_size || 0) / 1024)} KB)</span>
                                    </div>
                                </div>
                            </div>
                            {/* Complexity */}
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>{t('onPage.complexity')}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>{t('onPage.domSize')}</span>
                                        <span style={{ fontWeight: '500' }}>{page.total_dom_size ? (page.total_dom_size / 1024).toFixed(1) + ' KB' : '-'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>{t('onPage.textCodeRatio')}</span>
                                        <span style={{ fontWeight: '500' }}>{((page.meta?.content?.plain_text_rate || 0) * 100).toFixed(2)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Readability */}
                    {page.meta?.content && (
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} /> {t('onPage.contentReadability')}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.automatedReadability')}</div>
                                    <div style={{ fontWeight: '600' }}>{(page.meta.content.automated_readability_index || 0).toFixed(1)}</div>
                                </div>
                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.fleschKincaid')}</div>
                                    <div style={{ fontWeight: '600' }}>{(page.meta.content.flesch_kincaid_readability_index || 0).toFixed(1)}</div>
                                </div>
                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.colemanLiau')}</div>
                                    <div style={{ fontWeight: '600' }}>{(page.meta.content.coleman_liau_readability_index || 0).toFixed(1)}</div>
                                </div>
                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.smogIndex')}</div>
                                    <div style={{ fontWeight: '600' }}>{(page.meta.content.smog_readability_index || 0).toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Preview Cards */}
                    {page.meta && (
                        <SocialPreview meta={page.meta} url={page.url} />
                    )}

                    {/* Schema Validator */}
                    <SchemaValidator page={page} />

                    {/* Checks / Issues */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} /> {t('onPage.issuesChecks')}
                        </h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {page.checks && Object.entries(page.checks).map(([key, value]) => {
                                const status = getDataForSeoCheckStatus(key, value);
                                let statusColor = '#64748b'; // Neutral
                                let icon = null;
                                let statusText = String(value);

                                if (status === 'good') {
                                    statusColor = '#166534';
                                    icon = <CheckCircle size={16} />;
                                    statusText = t('onPage.pass');
                                } else if (status === 'bad') {
                                    statusColor = '#dc2626';
                                    icon = <XCircle size={16} />;
                                    statusText = t('onPage.fail');
                                } else if (typeof value === 'boolean') {
                                    statusText = value ? t('common.yes') : t('common.no');
                                }

                                return (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ textTransform: 'capitalize', color: '#334155' }}>{key.replace(/_/g, ' ')}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: statusColor, fontWeight: '600' }}>
                                            {icon}
                                            <span style={{ fontSize: '14px' }}>{statusText}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '16px 0 0 0', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: t('onPage.dataForSeoChecksDesc').replace('<link>', '<a href="https://docs.dataforseo.com/v3/on_page/pages/" target="_blank" rel="noopener noreferrer" style="color:#2563eb">').replace('</link>', '</a>') }} />
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Content Optimizer */}
                    <ContentOptimizer
                        siteId={id}
                        pageId={pageId}
                        url={page.url}
                        savedAnalysis={page.content_analysis}
                    />

                    {/* Deep Inspector */}
                    <DeepInspector
                        siteId={id}
                        pageId={pageId}
                        url={page.url}
                        onAnalysisComplete={(newData) => {
                            setPage(prev => ({ ...prev, analysis_data: newData }));
                        }}
                    />

                    {/* Meta Info */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Code size={18} /> {t('onPage.metaTags')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.titleChars', { count: page.meta?.title_length || 0 })}</div>
                                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{page.meta?.title || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.descriptionChars', { count: page.meta?.description_length || 0 })}</div>
                                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{page.meta?.description || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('onPage.h1Tags')}</div>
                                {page.meta?.htags?.h1 ? (
                                    <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '14px' }}>
                                        {page.meta.htags.h1.map((h, i) => <li key={i}>{h}</li>)}
                                    </ul>
                                ) : <div style={{ fontSize: '14px', color: '#94a3b8' }}>{t('onPage.none')}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Technical Specs */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Server size={18} /> {t('onPage.technicalSpecs')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.charsetLabel')}</span>
                                <span style={{ fontWeight: '500', fontSize: '14px' }}>{page.meta?.charset || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.generator')}</span>
                                <span style={{ fontWeight: '500', fontSize: '14px' }}>{page.meta?.generator || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.encoding')}</span>
                                <span style={{ fontWeight: '500', fontSize: '14px' }}>{page.meta?.content_encoding || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.mediaType')}</span>
                                <span style={{ fontWeight: '500', fontSize: '14px' }}>{page.meta?.media_type || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.canonicalLabel')}</span>
                                <span style={{ fontWeight: '500', fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={page.meta?.canonical}>
                                    {page.meta?.canonical || '-'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.faviconLabel')}</span>
                                {page.meta?.favicon ? (
                                    <img src={page.meta.favicon} alt="Favicon" style={{ width: '16px', height: '16px' }} />
                                ) : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Timing */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} /> {t('onPage.performanceLabel')}
                        </h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.totalDuration')}</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.duration_time || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.timeToInteractive')}</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.time_to_interactive || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.domComplete')}</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.dom_complete || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.waitingTime')}</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.waiting_time || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.connectionTime')}</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.connection_time || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>{t('onPage.downloadTime')}</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.download_time || 0} ms</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Raw Data Modal */}
            {showRawData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: 'white', width: '90%', maxWidth: '1000px', height: '90%', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{t('onPage.rawApiResponse')}</h2>
                            <button onClick={() => setShowRawData(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><XCircle size={24} /></button>
                        </div>
                        <div style={{ padding: '24px', overflow: 'auto', background: '#f8fafc', flex: 1 }}>
                            <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace' }}>
                                {JSON.stringify(page, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const RankedKeywords = ({ siteId, pageId, url }) => {
    const { t } = useTranslation();
    const [keywords, setKeywords] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const fetchKeywords = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/sites/${siteId}/pages/${pageId}/ranked-keywords`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                setKeywords(data.data);
                setMeta(data.meta);
                setFetched(true);
            } else {
                toast.error(t('onPage.failedToFetchKeywords'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('onPage.errorFetchingKeywords'));
        } finally {
            setLoading(false);
        }
    };

    if (!fetched && !loading) {
        return (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>{t('onPage.rankedKeywords')}</h3>
                <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
                    {t('onPage.rankedKeywordsDesc')}
                </p>
                <button
                    onClick={fetchKeywords}
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
                    <Target size={18} /> {t('onPage.revealRankedKeywords')}
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={18} /> {t('onPage.rankedKeywords')}
                        <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                            {t('onPage.found', { count: keywords.length })}
                        </span>
                    </h3>
                    {meta && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {t('onPage.scope')}: {meta.location} | Page: <span style={{ fontFamily: 'monospace' }}>{meta.url}</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={fetchKeywords}
                    disabled={loading}
                    style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {t('common.refresh')}
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>{t('onPage.searchingRankings')}</div>
            ) : keywords.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{t('onPage.keyword')}</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{t('onPage.pos')}</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>{t('onPage.vol')}</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>CPC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {keywords.map((k, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', fontWeight: '500', color: '#1e293b' }}>{k.keyword_data?.keyword_info?.keyword}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <div style={{
                                            display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px',
                                            background: k.ranked_serp_element?.serp_item?.rank_group <= 3 ? '#dcfce7' : (k.ranked_serp_element?.serp_item?.rank_group <= 10 ? '#e0f2fe' : '#f1f5f9'),
                                            color: k.ranked_serp_element?.serp_item?.rank_group <= 3 ? '#166534' : (k.ranked_serp_element?.serp_item?.rank_group <= 10 ? '#075985' : '#475569')
                                        }}>
                                            {k.ranked_serp_element?.serp_item?.rank_group || '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>
                                        {k.keyword_data?.keyword_info?.search_volume?.toLocaleString() || '-'}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>
                                        ${k.keyword_data?.keyword_info?.cpc || '0.00'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <Search size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div style={{ fontWeight: '600', color: '#475569' }}>{t('onPage.noRankingsFound')}</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        {t('onPage.noRankingsFoundDesc')}
                        <br />Try checking the <a href={`https://www.google.com/search?q=site:${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>{t('onPage.checkIndexStatus')}</a>.
                    </div>
                </div>
            )}
        </div>
    );
};

const LinkJuice = ({ siteId, url }) => {
    const { t } = useTranslation();
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [total, setTotal] = useState(0);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/sites/${siteId}/onpage/links?url=${encodeURIComponent(url)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                setLinks(data.data);
                setTotal(data.total_count || data.data.length);
                setFetched(true);
            } else {
                toast.error(t('onPage.failedToFetchLinks'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('onPage.errorFetchingLinks'));
        } finally {
            setLoading(false);
        }
    };

    if (!fetched && !loading) {
        return (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>{t('onPage.internalLinkJuice')}</h3>
                <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
                    {t('onPage.internalLinkJuiceDesc')}
                </p>
                <button
                    onClick={fetchLinks}
                    style={{
                        padding: '10px 24px',
                        background: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <ExternalLink size={18} /> {t('onPage.checkInboundLinks')}
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ExternalLink size={18} /> {t('onPage.internalInboundLinks')}
                        <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                            {t('onPage.found', { count: total })}
                        </span>
                    </h3>
                </div>
                <button
                    onClick={fetchLinks}
                    disabled={loading}
                    style={{ border: 'none', background: 'none', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {t('common.refresh')}
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>{t('onPage.findingBacklinks')}</div>
            ) : links.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{t('onPage.sourcePage')}</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>{t('onPage.anchorTextLabel')}</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>{t('onPage.typeLabel')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {links.map((l, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', maxWidth: '300px' }}>
                                        <a href={l.page_from} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {l.page_from}
                                        </a>
                                    </td>
                                    <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: l.anchor ? 'normal' : 'italic', color: l.anchor ? '#1e293b' : '#94a3b8' }}>
                                        {l.anchor || t('onPage.noText')}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#64748b' }}>
                                            {l.link_type || 'text'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <ExternalLink size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div style={{ fontWeight: '600', color: '#475569' }}>{t('onPage.noInternalLinks')}</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }} dangerouslySetInnerHTML={{ __html: t('onPage.orphanPageDesc') }} />
                </div>
            )}
        </div>
    );
};

// SEO Quality Alerts Component
const SeoQualityAlerts = ({ page }) => {
    const { t } = useTranslation();
    const alerts = [];

    // Title checks
    const titleLength = page.meta?.title_length || 0;
    if (titleLength === 0) {
        alerts.push({ type: 'error', icon: 'XCircle', title: t('onPage.alertMissingTitle'), message: t('onPage.alertMissingTitleDesc') });
    } else if (titleLength < 30) {
        alerts.push({ type: 'warning', icon: 'AlertTriangle', title: t('onPage.alertTitleTooShort'), message: t('onPage.alertTitleTooShortDesc', { count: titleLength }) });
    } else if (titleLength > 60) {
        alerts.push({ type: 'warning', icon: 'AlertTriangle', title: t('onPage.alertTitleTooLong'), message: t('onPage.alertTitleTooLongDesc', { count: titleLength }) });
    }

    // Description checks
    const descLength = page.meta?.description_length || 0;
    if (descLength === 0) {
        alerts.push({ type: 'error', icon: 'XCircle', title: t('onPage.alertMissingDesc'), message: t('onPage.alertMissingDescDesc') });
    } else if (descLength < 120) {
        alerts.push({ type: 'warning', icon: 'AlertTriangle', title: t('onPage.alertDescTooShort'), message: t('onPage.alertDescTooShortDesc', { count: descLength }) });
    } else if (descLength > 160) {
        alerts.push({ type: 'warning', icon: 'AlertTriangle', title: t('onPage.alertDescTooLong'), message: t('onPage.alertDescTooLongDesc', { count: descLength }) });
    }

    // Content checks
    const wordCount = page.meta?.content?.plain_text_word_count || page.content?.plain_text_word_count || 0;
    if (wordCount < 300) {
        alerts.push({ type: 'error', icon: 'XCircle', title: t('onPage.alertThinContent'), message: t('onPage.alertThinContentDesc', { count: wordCount }) });
    }

    if (alerts.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((alert, i) => (
                <div
                    key={i}
                    style={{
                        background: alert.type === 'error' ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${alert.type === 'error' ? '#fecaca' : '#fde68a'}`,
                        borderRadius: '12px',
                        padding: '16px 24px'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        {alert.icon === 'XCircle' ? <XCircle size={20} color={alert.type === 'error' ? '#dc2626' : '#d97706'} /> : <AlertTriangle size={20} color="#d97706" />}
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: alert.type === 'error' ? '#991b1b' : '#92400e', margin: 0 }}>
                            {alert.title}
                        </h3>
                    </div>
                    <p style={{ fontSize: '14px', color: alert.type === 'error' ? '#7f1d1d' : '#78350f', margin: 0, lineHeight: '1.5' }}>
                        {alert.message}
                    </p>
                </div>
            ))}
        </div>
    );
};
