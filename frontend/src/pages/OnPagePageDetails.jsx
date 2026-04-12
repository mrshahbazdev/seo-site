import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock, Code, FileText, Layout, Server, ExternalLink, Copy, Globe, Target, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import ContentOptimizer from './components/Analysis/ContentOptimizer';
import DeepInspector from './components/Analysis/DeepInspector';
import DuplicateCandidates from './components/Analysis/DuplicateCandidates';
import SocialPreview from './components/Analysis/SocialPreview';
import SchemaValidator from './components/Analysis/SchemaValidator';
import { getDataForSeoCheckStatus } from '../utils/dataforseoChecks';

export default function OnPagePageDetails() {
    const { id, pageId } = useParams();
    const navigate = useNavigate();
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
            const res = await fetch(`https://seostory.de/api/sites/${id}/onpage/pages/${pageId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                setPage(data.data);
            } else if (data.status === 'no_task') {
                toast.error('Analysis session expired. Redirecting...');
                navigate(`/sites/${id}/onpage/summary`);
            } else {
                toast.error(data.message || 'Failed to load page details');
            }
        } catch (error) {
            console.error('Error fetching page details:', error);
            toast.error('Failed to load page details');
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

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading details...</div>;
    if (!page) return <div style={{ padding: '40px', textAlign: 'center' }}>Page not found</div>;

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
                    <div style={{ flexShrink: 0, marginLeft: '16px', display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => window.open(`https://www.google.com/search?q=site:${encodeURIComponent(page.url)}`, '_blank')}
                            style={{ padding: '8px 16px', background: 'white', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        >
                            <Globe size={16} />
                            <span className="btn-text-desktop">Check Index</span>
                            <span className="btn-text-mobile">Index</span>
                        </button>
                        <button
                            onClick={() => setShowRawData(true)}
                            style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        >
                            <Code size={16} />
                            <span className="btn-text-desktop">View Raw Data</span>
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
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{page.title || 'No Title'}</h2>
                                <a href={page.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Visit Page <ArrowLeft size={12} style={{ transform: 'rotate(135deg)' }} />
                                </a>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: getScoreColor(page.onpage_score) }}>
                                    {page.onpage_score ? Number(page.onpage_score).toFixed(0) : '-'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>OnPage Score</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Status Code</div>
                                <div style={{ fontWeight: '600' }}>{page.status_code}</div>
                            </div>
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Size</div>
                                <div style={{ fontWeight: '600' }}>{((page.meta?.size || 0) / 1024).toFixed(1)} KB</div>
                            </div>
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Word Count</div>
                                <div style={{ fontWeight: '600' }}>{page.meta?.content?.plain_text_word_count || page.content?.plain_text_word_count || 0}</div>
                            </div>
                            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Load Time</div>
                                <div style={{ fontWeight: '600' }}>{page.page_timing?.duration_time || 0} ms</div>
                            </div>
                        </div>
                    </div>

                    {/* Resources & Counts */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layout size={18} /> Resources & Counts
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                            {/* Links */}
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Links</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>Internal</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.internal_links_count || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>External</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.external_links_count || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>Inbound</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.inbound_links_count || 0}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Images & Scripts */}
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Assets</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>Images</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.images_count || 0} ({Math.round((page.meta?.images_size || 0) / 1024)} KB)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>Scripts</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.scripts_count || 0} ({Math.round((page.meta?.scripts_size || 0) / 1024)} KB)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>Stylesheets</span>
                                        <span style={{ fontWeight: '500' }}>{page.meta?.stylesheets_count || 0} ({Math.round((page.meta?.stylesheets_size || 0) / 1024)} KB)</span>
                                    </div>
                                </div>
                            </div>
                            {/* Complexity */}
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Complexity</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>DOM Size</span>
                                        <span style={{ fontWeight: '500' }}>{page.total_dom_size ? (page.total_dom_size / 1024).toFixed(1) + ' KB' : '-'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>Text/Code Ratio</span>
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
                                <FileText size={18} /> Content Readability
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Automated Readability</div>
                                    <div style={{ fontWeight: '600' }}>{(page.meta.content.automated_readability_index || 0).toFixed(1)}</div>
                                </div>
                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Flesch Kincaid</div>
                                    <div style={{ fontWeight: '600' }}>{(page.meta.content.flesch_kincaid_readability_index || 0).toFixed(1)}</div>
                                </div>
                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Coleman Liau</div>
                                    <div style={{ fontWeight: '600' }}>{(page.meta.content.coleman_liau_readability_index || 0).toFixed(1)}</div>
                                </div>
                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>SMOG Index</div>
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
                            <AlertTriangle size={18} /> Issues & Checks
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
                                    statusText = 'Pass';
                                } else if (status === 'bad') {
                                    statusColor = '#dc2626';
                                    icon = <XCircle size={16} />;
                                    statusText = 'Fail';
                                } else if (typeof value === 'boolean') {
                                    statusText = value ? 'Yes' : 'No';
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
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '16px 0 0 0', lineHeight: 1.5 }}>
                            Pass/Fail follows{' '}
                            <a href="https://docs.dataforseo.com/v3/on_page/pages/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                                DataForSEO
                            </a>{' '}
                            definitions. <strong>no_image_alt</strong> can flag any image without an alt attribute (including
                            icons or lazy placeholders) even if your main photo has alt text. <strong>has render blocking</strong>{' '}
                            is common for CSS/JS and is not always wrong. <strong>meta charset consistency</strong> compares
                            declared encoding to detected bytes — occasional false positives happen.
                        </p>
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
                            <Code size={18} /> Meta Tags
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Title ({page.meta?.title_length || 0} chars)</div>
                                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{page.meta?.title || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Description ({page.meta?.description_length || 0} chars)</div>
                                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{page.meta?.description || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>H1 Tags</div>
                                {page.meta?.htags?.h1 ? (
                                    <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '14px' }}>
                                        {page.meta.htags.h1.map((h, i) => <li key={i}>{h}</li>)}
                                    </ul>
                                ) : <div style={{ fontSize: '14px', color: '#94a3b8' }}>None</div>}
                            </div>
                        </div>
                    </div>

                    {/* Technical Specs */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Server size={18} /> Technical Specs
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Charset</span>
                                <span style={{ fontWeight: '500', fontSize: '14px' }}>{page.meta?.charset || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Generator</span>
                                <span style={{ fontWeight: '500', fontSize: '14px' }}>{page.meta?.generator || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Encoding</span>
                                <span style={{ fontWeight: '500', fontSize: '14px' }}>{page.meta?.content_encoding || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Media Type</span>
                                <span style={{ fontWeight: '500', fontSize: '14px' }}>{page.meta?.media_type || '-'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Canonical</span>
                                <span style={{ fontWeight: '500', fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={page.meta?.canonical}>
                                    {page.meta?.canonical || '-'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Favicon</span>
                                {page.meta?.favicon ? (
                                    <img src={page.meta.favicon} alt="Favicon" style={{ width: '16px', height: '16px' }} />
                                ) : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Timing */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} /> Performance
                        </h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Total Duration</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.duration_time || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Time to Interactive</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.time_to_interactive || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>DOM Complete</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.dom_complete || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Waiting Time</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.waiting_time || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Connection Time</span>
                                <span style={{ fontWeight: '500' }}>{page.page_timing?.connection_time || 0} ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '14px' }}>Download Time</span>
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
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Raw API Response</h2>
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
    const [keywords, setKeywords] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const fetchKeywords = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`https://seostory.de/api/sites/${siteId}/pages/${pageId}/ranked-keywords`, {
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
                toast.error('Failed to fetch ranked keywords');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching keywords');
        } finally {
            setLoading(false);
        }
    };

    if (!fetched && !loading) {
        return (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Ranked Keywords</h3>
                <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
                    See what keywords this specific page ranks for in Google US.
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
                    <Target size={18} /> Reveal Ranked Keywords
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={18} /> Ranked Keywords
                        <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                            {keywords.length} found
                        </span>
                    </h3>
                    {meta && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Scope: {meta.location} | Page: <span style={{ fontFamily: 'monospace' }}>{meta.url}</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={fetchKeywords}
                    disabled={loading}
                    style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Searching rankings...</div>
            ) : keywords.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Keyword</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Pos</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>Vol</th>
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
                    <div style={{ fontWeight: '600', color: '#475569' }}>No rankings found</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        This specific page doesn't rank in the top 100 for any keywords in US Google.
                        <br />Try checking the <a href={`https://www.google.com/search?q=site:${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Index Status</a>.
                    </div>
                </div>
            )}
        </div>
    );
};

const LinkJuice = ({ siteId, url }) => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [total, setTotal] = useState(0);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`https://seostory.de/api/sites/${siteId}/onpage/links?url=${encodeURIComponent(url)}`, {
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
                toast.error('Failed to fetch internal links');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching internal links');
        } finally {
            setLoading(false);
        }
    };

    if (!fetched && !loading) {
        return (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Internal Link Juice</h3>
                <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
                    See which internal pages are linking to this page (Inbound Links).
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
                    <ExternalLink size={18} /> Check Inbound Links
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ExternalLink size={18} /> Internal Inbound Links
                        <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                            {total} found
                        </span>
                    </h3>
                </div>
                <button
                    onClick={fetchLinks}
                    disabled={loading}
                    style={{ border: 'none', background: 'none', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Finding backlinks...</div>
            ) : links.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Source Page</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Anchor Text</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Type</th>
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
                                        {l.anchor || '(No Text)'}
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
                    <div style={{ fontWeight: '600', color: '#475569' }}>No internal links found</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        This page is an <strong>orphan page</strong>. It has no internal links pointing to it.
                    </div>
                </div>
            )}
        </div>
    );
};

// SEO Quality Alerts Component
const SeoQualityAlerts = ({ page }) => {
    const alerts = [];

    // Title checks
    const titleLength = page.meta?.title_length || 0;
    if (titleLength === 0) {
        alerts.push({ type: 'error', icon: 'XCircle', title: 'Missing Title', message: 'This page has no meta title. Add a descriptive title tag.' });
    } else if (titleLength < 30) {
        alerts.push({ type: 'warning', icon: 'AlertTriangle', title: 'Title Too Short', message: `Title is only ${titleLength} characters. Recommended: 30-60 characters for better SEO.` });
    } else if (titleLength > 60) {
        alerts.push({ type: 'warning', icon: 'AlertTriangle', title: 'Title Too Long', message: `Title is ${titleLength} characters. It may be truncated in search results. Recommended: 30-60 characters.` });
    }

    // Description checks
    const descLength = page.meta?.description_length || 0;
    if (descLength === 0) {
        alerts.push({ type: 'error', icon: 'XCircle', title: 'Missing Description', message: 'This page has no meta description. Add one to improve click-through rates.' });
    } else if (descLength < 120) {
        alerts.push({ type: 'warning', icon: 'AlertTriangle', title: 'Description Too Short', message: `Description is only ${descLength} characters. Recommended: 120-160 characters.` });
    } else if (descLength > 160) {
        alerts.push({ type: 'warning', icon: 'AlertTriangle', title: 'Description Too Long', message: `Description is ${descLength} characters. It may be truncated. Recommended: 120-160 characters.` });
    }

    // Content checks
    const wordCount = page.meta?.content?.plain_text_word_count || page.content?.plain_text_word_count || 0;
    if (wordCount < 300) {
        alerts.push({ type: 'error', icon: 'XCircle', title: 'Thin Content', message: `This page has only ${wordCount} words. Search engines prefer pages with at least 300 words of quality content.` });
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
