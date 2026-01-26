import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Link as LinkIcon, AlertTriangle, ExternalLink, RotateCw } from 'lucide-react';

export default function BacklinksPage() {
    const { siteId, pageId } = useParams();
    const navigate = useNavigate();
    const [backlinks, setBacklinks] = useState(null);
    const [backlinksList, setBacklinksList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'list'

    const fetchBacklinks = async (refresh = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // If pageId exists, check specific page. If not, check domain (site).
            let url = pageId
                ? `https://seostory.de/api/sites/${siteId}/pages/${pageId}/backlinks/analyze`
                : `https://seostory.de/api/sites/${siteId}/backlinks/analyze`;

            if (refresh) {
                url += `?refresh=true`;
            }

            // Use POST to trigger analysis
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (data.success) {
                setBacklinks(data.data);
            } else {
                toast.error(data.message || 'Failed to load backlinks');
            }
        } catch (error) {
            console.error('Error fetching backlinks:', error);
            toast.error('Failed to load backlink data');
        } finally {
            setLoading(false);
        }
    };

    const fetchBacklinksList = async (refresh = false) => {
        try {
            setListLoading(true);
            const token = localStorage.getItem('token');
            let url = `https://seostory.de/api/sites/${siteId}/backlinks/list`;

            // Append limit if we know total backlinks, else default 100
            // const limit = backlinks?.backlinks > 1000 ? 1000 : backlinks?.backlinks || 100;
            // For now, let's stick to default or passed from backend logic to be safe.
            // But we need to pass refresh param
            if (refresh) {
                url += `?refresh=true`;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ limit: 100 }) // Send limit in body for POST
            });

            const data = await res.json();

            if (data.success) {
                setBacklinksList(data.data);
            } else {
                toast.error(data.message || 'Failed to load backlinks list');
            }
        } catch (error) {
            console.error('Error fetching backlinks list:', error);
            toast.error('Failed to load list');
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchBacklinks();
    }, [siteId, pageId]);

    useEffect(() => {
        if (viewMode === 'list' && !backlinksList) {
            fetchBacklinksList();
        }
    }, [viewMode, backlinksList, siteId]); // Added siteId to dependencies

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#64748b' }}>Analyzing Backlinks...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (!backlinks) {
        return (
            <div style={{ minHeight: '100vh', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', textAlign: 'center' }}>
                <div style={{ marginBottom: '20px', color: '#94a3b8' }}>
                    <AlertTriangle size={48} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>No Backlink Data Found</h1>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>Could not retrieve backlink summary for this page.</p>
                <button
                    onClick={() => navigate(-1)}
                    style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '12px' }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LinkIcon size={20} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>Backlink Analysis</h1>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>Comprehensive link profile summary</div>
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                        <div style={{ background: '#e2e8f0', padding: '4px', borderRadius: '8px', display: 'flex' }}>
                            <button
                                onClick={() => setViewMode('summary')}
                                style={{
                                    padding: '6px 16px',
                                    background: viewMode === 'summary' ? 'white' : 'transparent',
                                    color: viewMode === 'summary' ? '#0f172a' : '#64748b',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: viewMode === 'summary' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                Summary
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    padding: '6px 16px',
                                    background: viewMode === 'list' ? 'white' : 'transparent',
                                    color: viewMode === 'list' ? '#0f172a' : '#64748b',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                Backlinks List
                            </button>
                        </div>
                        <button
                            onClick={() => viewMode === 'list' ? fetchBacklinksList(true) : fetchBacklinks(true)}
                            disabled={loading || listLoading}
                            style={{
                                padding: '8px 16px',
                                background: (loading || listLoading) ? '#94a3b8' : 'white',
                                color: (loading || listLoading) ? 'white' : '#3b82f6',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: (loading || listLoading) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {(loading || listLoading) ? (
                                <>Updating...</>
                            ) : (
                                <>
                                    <RotateCw size={14} /> Refresh Data
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px', display: 'grid', gap: '24px' }}>

                {viewMode === 'list' ? (
                    <>
                        {listLoading && !backlinksList ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading detailed list...</div>
                        ) : backlinksList ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Detailed Backlinks</h2>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>Showing top {backlinksList.items?.length || 0} results</div>
                                </div>
                                <BacklinkTable items={backlinksList.items || []} />
                            </>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No data available. Try refreshing.</div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Summary Cards Row 1: Key Metrics */}
                        {backlinks && (
                            <>
                                {/* Summary Cards Row 1: Key Metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                    <SummaryCard label="Total Backlinks" value={backlinks.backlinks} icon={<LinkIcon size={24} color="#3b82f6" />} />
                                    <SummaryCard label="Refer. Domains" value={backlinks.referring_domains} icon={<ExternalLink size={24} color="#10b981" />} />
                                    <SummaryCard label="Rank" value={backlinks.rank} icon={<div style={{ fontSize: '24px' }}>🏆</div>} />
                                    <SummaryCard label="Spam Score" value={backlinks.backlinks_spam_score} icon={<AlertTriangle size={24} color={backlinks.backlinks_spam_score > 30 ? '#ef4444' : '#f59e0b'} />} />
                                </div>

                                {/* Summary Cards Row 2: Secondary Metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Broken Backlinks</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: backlinks.broken_backlinks > 0 ? '#ef4444' : '#1e293b' }}>{backlinks.broken_backlinks}</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Broken Pages</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: backlinks.broken_pages > 0 ? '#ef4444' : '#1e293b' }}>{backlinks.broken_pages}</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Referring IPs</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{backlinks.referring_ips}</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Refer. Subnets</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{backlinks.referring_subnets}</div>
                                    </div>
                                </div>

                                {/* Main Data Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                                    {/* TLDs */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Top TLDs</h2>
                                        {backlinks.referring_links_tld && Object.keys(backlinks.referring_links_tld).length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {Object.entries(backlinks.referring_links_tld).map(([tld, count]) => (
                                                    <div key={tld} style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: '20px', fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontWeight: '600', color: '#0f172a' }}>.{tld}</span>
                                                        <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p style={{ color: '#64748b' }}>No TLD data available</p>}
                                    </div>

                                    {/* Countries */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Countries</h2>
                                        {backlinks.referring_links_countries && Object.keys(backlinks.referring_links_countries).length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {Object.entries(backlinks.referring_links_countries).map(([country, count]) => (
                                                    <div key={country} style={{ padding: '6px 12px', background: '#f0fdf4', borderRadius: '20px', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontWeight: '600' }}>{country || 'Unknown'}</span>
                                                        <span style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p style={{ color: '#64748b' }}>No country data available</p>}
                                    </div>
                                </div>

                                {/* Attributes & Types (3 Column Grid) */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>

                                    {/* Link Attributes */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Link Attributes</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {backlinks.referring_links_attributes && Object.entries(backlinks.referring_links_attributes).map(([attr, count]) => (
                                                <div key={attr} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{attr}</span>
                                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Platform Types */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Platform Types</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {backlinks.referring_links_platform_types && Object.entries(backlinks.referring_links_platform_types).map(([type, count]) => (
                                                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{type}</span>
                                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Semantic Locations */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Semantic Locations</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {backlinks.referring_links_semantic_locations && Object.entries(backlinks.referring_links_semantic_locations).map(([loc, count]) => (
                                                <div key={loc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{loc || 'General Body'}</span>
                                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {viewMode === 'list' && (
                            <>
                                {listLoading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        <p style={{ color: '#64748b' }}>Loading Backlinks List...</p>
                                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                    </div>
                                ) : backlinksList.length > 0 ? (
                                    <BacklinkTable items={backlinksList} />
                                ) : (
                                    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                        <div style={{ marginBottom: '20px', color: '#94a3b8' }}>
                                            <AlertTriangle size={48} />
                                        </div>
                                        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>No Backlinks Found</h1>
                                        <p style={{ color: '#64748b', marginBottom: '24px' }}>No detailed backlink data available for this {pageId ? 'page' : 'site'}.</p>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                    <SummaryCard label="Total Backlinks" value={backlinks.backlinks} icon={<LinkIcon size={24} color="#3b82f6" />} />
                                    <SummaryCard label="Refer. Domains" value={backlinks.referring_domains} icon={<ExternalLink size={24} color="#10b981" />} />
                                    <SummaryCard label="Rank" value={backlinks.rank} icon={<div style={{ fontSize: '24px' }}>🏆</div>} />
                                    <SummaryCard label="Spam Score" value={backlinks.backlinks_spam_score} icon={<AlertTriangle size={24} color={backlinks.backlinks_spam_score > 30 ? '#ef4444' : '#f59e0b'} />} />
                                </div>

                                {/* Summary Cards Row 2: Secondary Metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Broken Backlinks</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: backlinks.broken_backlinks > 0 ? '#ef4444' : '#1e293b' }}>{backlinks.broken_backlinks}</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Broken Pages</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: backlinks.broken_pages > 0 ? '#ef4444' : '#1e293b' }}>{backlinks.broken_pages}</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Referring IPs</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{backlinks.referring_ips}</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>Refer. Subnets</div>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{backlinks.referring_subnets}</div>
                                    </div>
                                </div>

                                {/* Main Data Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                                    {/* TLDs */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Top TLDs</h2>
                                        {backlinks.referring_links_tld && Object.keys(backlinks.referring_links_tld).length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {Object.entries(backlinks.referring_links_tld).map(([tld, count]) => (
                                                    <div key={tld} style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: '20px', fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontWeight: '600', color: '#0f172a' }}>.{tld}</span>
                                                        <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p style={{ color: '#64748b' }}>No TLD data available</p>}
                                    </div>

                                    {/* Countries */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Countries</h2>
                                        {backlinks.referring_links_countries && Object.keys(backlinks.referring_links_countries).length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {Object.entries(backlinks.referring_links_countries).map(([country, count]) => (
                                                    <div key={country} style={{ padding: '6px 12px', background: '#f0fdf4', borderRadius: '20px', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontWeight: '600' }}>{country || 'Unknown'}</span>
                                                        <span style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p style={{ color: '#64748b' }}>No country data available</p>}
                                    </div>
                                </div>

                                {/* Attributes & Types (3 Column Grid) */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>

                                    {/* Link Attributes */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Link Attributes</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {backlinks.referring_links_attributes && Object.entries(backlinks.referring_links_attributes).map(([attr, count]) => (
                                                <div key={attr} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{attr}</span>
                                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Platform Types */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Platform Types</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {backlinks.referring_links_platform_types && Object.entries(backlinks.referring_links_platform_types).map(([type, count]) => (
                                                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{type}</span>
                                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Semantic Locations */}
                                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>Semantic Locations</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {backlinks.referring_links_semantic_locations && Object.entries(backlinks.referring_links_semantic_locations).map(([loc, count]) => (
                                                <div key={loc} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{loc || 'General Body'}</span>
                                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}



const BacklinkTable = ({ items }) => {
    const [expandedIndex, setExpandedIndex] = useState(null);

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', width: '40px' }}></th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Source Page / Anchor</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Target URL</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', width: '80px' }}>Rank</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', width: '80px' }}>Spam</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', width: '100px' }}>Platform</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600', width: '100px' }}>Last Seen</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <React.Fragment key={index}>
                            <tr style={{ borderBottom: expandedIndex === index ? 'none' : '1px solid #f1f5f9', cursor: 'pointer', background: expandedIndex === index ? '#f8fafc' : 'white' }} onClick={() => toggleExpand(index)}>
                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#94a3b8' }}>
                                    {expandedIndex === index ? '▼' : '▶'}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#334155' }}>
                                    <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <a href={item.url_from} target="_blank" rel="noopener noreferrer" style={{ color: '#0f172a', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                                            {item.url_from.length > 60 ? item.url_from.substring(0, 60) + '...' : item.url_from}
                                        </a>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
                                            {item.dofollow ? 'DoFollow' : 'NoFollow'}
                                        </span>
                                        {item.anchor && (
                                            <span style={{ color: '#3b82f6', fontStyle: 'italic', fontSize: '12px' }}>
                                                "{item.anchor}"
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '12px 16px', color: '#334155' }}>
                                    <a href={item.url_to} target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                                        {item.url_to.replace(/^https?:\/\/[^/]+/, '') || '/'}
                                    </a>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ fontWeight: '600', color: item.rank > 500 ? '#10b981' : '#f59e0b' }}>
                                        {item.rank}
                                    </div>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ fontWeight: '600', color: item.backlink_spam_score > 30 ? '#ef4444' : '#10b981' }}>
                                        {item.backlink_spam_score}
                                    </div>
                                </td>
                                <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: '#64748b' }}>
                                    {item.domain_from_platform_type ? item.domain_from_platform_type.join(', ') : 'Unknown'}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                    {new Date(item.last_seen).toLocaleDateString()}
                                </td>
                            </tr>
                            {expandedIndex === index && (
                                <tr key={`${index}-detail`} style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <td colSpan={7} style={{ padding: '0 24px 24px 24px' }}>
                                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', display: 'grid', gap: '24px' }}>

                                            {/* Top Row: Metrics & Status */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                                <DetailItem label="First Seen" value={item.first_seen ? new Date(item.first_seen).toLocaleString() : 'N/A'} />
                                                <DetailItem label="Last Seen" value={item.last_seen ? new Date(item.last_seen).toLocaleString() : 'N/A'} />
                                                <DetailItem label="Prev Seen" value={item.prev_seen ? new Date(item.prev_seen).toLocaleString() : 'N/A'} />
                                                <DetailItem label="Link Status" value={item.is_new ? 'New' : item.is_lost ? 'Lost' : 'Live'} valueColor={item.is_new ? '#10b981' : item.is_lost ? '#ef4444' : '#3b82f6'} />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                                                {/* Source Domain & Page */}
                                                <div>
                                                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> Source Details
                                                    </h4>
                                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        <DetailItem label="Page Title" value={item.page_from_title || 'N/A'} isFull />
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                            <DetailItem label="Domain IP" value={item.domain_from_ip} />
                                                            <DetailItem label="Country" value={item.domain_from_country} />
                                                            <DetailItem label="Language" value={item.page_from_language} />
                                                            <DetailItem label="Encoding" value={item.page_from_encoding} />
                                                            <DetailItem label="Page Size" value={item.page_from_size ? `${(item.page_from_size / 1024).toFixed(1)} KB` : 'N/A'} />
                                                            <DetailItem label="Platform" value={item.domain_from_platform_type?.join(', ')} />
                                                            <DetailItem label="Status Code" value={item.page_from_status_code} />
                                                            <DetailItem label="HTTPS" value={item.url_from_https ? 'Yes' : 'No'} />
                                                        </div>
                                                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Links Stats</div>
                                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                                <span style={{ fontSize: '13px' }}><strong>Ext:</strong> {item.page_from_external_links}</span>
                                                                <span style={{ fontSize: '13px' }}><strong>Int:</strong> {item.page_from_internal_links}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Link Context & Attributes */}
                                                <div>
                                                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Link Context
                                                    </h4>
                                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        <DetailItem label="Anchor Text" value={item.anchor} isFull valueColor="#3b82f6" />
                                                        {item.alt && <DetailItem label="Image Alt" value={item.alt} isFull />}
                                                        {item.image_url && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <span style={{ fontSize: '12px', color: '#64748b' }}>Image URL</span>
                                                                <a href={item.image_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#3b82f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.image_url}</a>
                                                            </div>
                                                        )}
                                                        {(item.text_pre || item.text_post) && (
                                                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#334155', fontStyle: 'italic', background: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                                                "... {item.text_pre} <strong>{item.anchor}</strong> {item.text_post} ..."
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                                                            <DetailItem label="Type" value={item.item_type} />
                                                            <DetailItem label="Location" value={item.semantic_location} />
                                                            <DetailItem label="Follow" value={item.dofollow ? 'DoFollow' : 'NoFollow'} />
                                                            <DetailItem label="Original" value={item.original ? 'Yes' : 'No'} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Target Target & Rankings */}
                                                <div>
                                                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> Target & Ranks
                                                    </h4>
                                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                            <DetailItem label="Target Status" value={item.url_to_status_code} valueColor={item.url_to_status_code >= 400 ? '#ef4444' : '#10b981'} />
                                                            <DetailItem label="Target Spam" value={item.url_to_spam_score} />
                                                            <DetailItem label="Backlink Spam" value={item.backlink_spam_score} />
                                                            <DetailItem label="Rank" value={item.rank} />
                                                            <DetailItem label="Page Rank" value={item.page_from_rank} />
                                                            <DetailItem label="Domain Rank" value={item.domain_from_rank} />
                                                        </div>
                                                        {item.url_to_redirect_target && (
                                                            <DetailItem label="Redirects To" value={item.url_to_redirect_target} isFull />
                                                        )}
                                                        {item.is_indirect_link && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Indirect Path</div>
                                                                {item.indirect_link_path?.map((hop, i) => (
                                                                    <div key={i} style={{ fontSize: '12px', marginTop: '2px' }}>
                                                                        ↳ {hop.status_code} : {hop.url}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Ranked Keywords</div>
                                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>Top 3: {item.ranked_keywords_info?.page_from_keywords_count_top_3 || 0}</span>
                                                                <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>Top 10: {item.ranked_keywords_info?.page_from_keywords_count_top_10 || 0}</span>
                                                                <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>Top 100: {item.ranked_keywords_info?.page_from_keywords_count_top_100 || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const DetailItem = ({ label, value, isFull = false, valueColor = '#1e293b' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', gridColumn: isFull ? '1 / -1' : 'auto' }}>
        <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: '600' }}>{label}</span>
        <span style={{ fontSize: '13px', color: valueColor, wordBreak: 'break-all', fontWeight: '500' }}>{value !== null && value !== undefined ? value : 'N/A'}</span>
    </div>
);

const SummaryCard = ({ label, value, icon }) => (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                {value ? new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(value) : '0'}
            </div>
        </div>
    </div>
);
