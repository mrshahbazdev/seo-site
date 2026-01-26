import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertTriangle, CheckCircle, XCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OnPageCrawledPages() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeFilter = searchParams.get('filter');

    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 50;

    useEffect(() => {
        fetchPages();
    }, [id, currentPage, activeFilter]);

    const fetchPages = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const filterQuery = activeFilter ? `&filter=${activeFilter}` : '';
            const url = `http://localhost:8000/api/sites/${id}/onpage/pages?limit=${limit}&page=${currentPage}${forceRefresh ? '&refresh=true' : ''}${filterQuery}`;
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                // Backend now normalizes response. `data.data` is the array.
                setPages(data.data || []);
                setTotal(data.total_count || 0);
            } else if (data.status === 'no_task') {
                toast.error('Analysis session expired. Redirecting...');
                navigate(`/sites/${id}/onpage/summary`);
            } else {
                toast.error(data.message || 'Failed to load pages');
            }
        } catch (error) {
            console.error('Error fetching pages:', error);
            toast.error('Failed to load pages');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (code) => {
        if (code >= 200 && code < 300) return '#166534'; // Green
        if (code >= 300 && code < 400) return '#d97706'; // Orange
        if (code >= 400 && code < 600) return '#dc2626'; // Red
        return '#4b5563'; // Gray
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => navigate(`/sites/${id}/onpage-summary`)} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>Crawled Pages</h1>
                                {activeFilter && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                                        <AlertTriangle size={12} />
                                        Issue: {activeFilter.replace(/_/g, ' ')}
                                        <button
                                            onClick={() => navigate(`/sites/${id}/onpage/pages`)}
                                            style={{ border: 'none', background: 'none', marginLeft: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#991b1b' }}
                                        >
                                            <XCircle size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                                Found {total} Pages
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchPages(true)}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            background: loading ? '#f1f5f9' : 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            color: loading ? '#94a3b8' : '#475569',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? 'Refreshing...' : 'Refresh List'}
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {loading && pages.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading pages...</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>URL</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600', width: '80px' }}>Status</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Title</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Issues</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pages.map((page, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button
                                                        onClick={() => navigate(`/sites/${id}/onpage/pages/${page.id}`)}
                                                        style={{ color: '#2563eb', textDecoration: 'none', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                                                    >
                                                        {page.url}
                                                    </button>
                                                    <a href={page.url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink size={12} color="#94a3b8" />
                                                    </a>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    background: getStatusColor(page.status_code) + '20',
                                                    color: getStatusColor(page.status_code),
                                                    fontWeight: '600',
                                                    fontSize: '12px'
                                                }}>
                                                    {page.status_code}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', maxWidth: '250px' }}>
                                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1e293b' }}>
                                                    {page.meta?.title || '-'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {page.checks && Object.entries(page.checks)
                                                        .filter(([k, v]) => v === true && ['duplicate_title', 'duplicate_description', 'no_h1_tag', 'is_broken', 'is_4xx_code', 'is_5xx_code'].includes(k))
                                                        .map(([k, v]) => (
                                                            <span key={k} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b' }}>
                                                                {k.replace(/_/g, ' ')}
                                                            </span>
                                                        ))}
                                                    {(!page.checks || !Object.entries(page.checks).some(([k, v]) => v === true && ['duplicate_title', 'duplicate_description', 'no_h1_tag', 'is_broken'].includes(k))) && (
                                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                <div style={{ fontWeight: '600', color: (page.onpage_score || 0) >= 90 ? '#166534' : (page.onpage_score || 0) >= 50 ? '#d97706' : '#dc2626' }}>
                                                    {page.onpage_score ? Number(page.onpage_score).toFixed(0) : '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            disabled={currentPage === 1 || loading}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            style={{ padding: '8px 16px', background: currentPage === 1 ? '#f1f5f9' : 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#475569' }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>
                            {total > 0 ? `Showing ${(currentPage - 1) * limit + 1}-${Math.min(currentPage * limit, total)} of ${total}` : 'No pages found'}
                        </span>
                        <button
                            disabled={currentPage * limit >= total || loading}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            style={{ padding: '8px 16px', background: currentPage * limit >= total ? '#f1f5f9' : 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: currentPage * limit >= total ? 'not-allowed' : 'pointer', color: currentPage * limit >= total ? '#94a3b8' : '#475569' }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
