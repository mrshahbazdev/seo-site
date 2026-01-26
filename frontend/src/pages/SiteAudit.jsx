import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LinkIcon, FileText, Activity, AlertTriangle, AlertCircle, CheckCircle, Info, Play, Loader2, ArrowLeft } from 'lucide-react';

export default function SiteAudit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [site, setSite] = useState(null);
    const [audits, setAudits] = useState([]);
    const [currentAudit, setCurrentAudit] = useState(null);
    const [issues, setIssues] = useState([]);
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [processingCount, setProcessingCount] = useState(0);

    // UI State
    const [activeTab, setActiveTab] = useState('overview'); // overview, issues, pages
    const [issueCategory, setIssueCategory] = useState('all'); // all, critical, high, medium, low

    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [selectedType, setSelectedType] = useState('full_crawl');

    useEffect(() => {
        fetchSiteData();
    }, [id]);

    // Polling for progress updates
    useEffect(() => {
        let interval;
        if (processingCount > 0 || running) {
            interval = setInterval(() => {
                fetchPages(currentPage);
            }, 3000); // Poll every 3 seconds
        }
        return () => clearInterval(interval);
    }, [processingCount, running, currentPage]);

    const fetchSiteData = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch site details
            const siteRes = await fetch(`http://localhost:8000/api/sites/${id}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const siteData = await siteRes.json();
            setSite(siteData.site);

            // Fetch audits
            const auditsRes = await fetch(`http://localhost:8000/api/sites/${id}/audits`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const auditsData = await auditsRes.json();
            if (auditsData.success && auditsData.audits.data) {
                setAudits(auditsData.audits.data);
                if (auditsData.audits.data.length > 0) {
                    setCurrentAudit(auditsData.audits.data[0]);
                    fetchIssues(auditsData.audits.data[0].id);
                }
            } else {
                setAudits([]);
                setCurrentAudit(null);
                setIssues([]);
            }

            // Fetch pages
            fetchPages();
        } catch (error) {
            console.error('Failed to fetch site data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIssues = async (auditId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/audits/${auditId}/issues`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setIssues(data.issues.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch issues:', error);
        }
    };

    const fetchPages = async (page = 1) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/sites/${id}/pages?page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (data.success && data.pages) {
                setPages(data.pages.data || []);
                setCurrentPage(data.pages.current_page || 1);
                setLastPage(data.pages.last_page || 1);
                setTotalPages(data.pages.total || 0);
                setProcessingCount(data.processing_count || 0);
            }
        } catch (error) {
            console.error('Failed to fetch pages:', error);
        }
    };


    const startAudit = async () => {
        setRunning(true);
        try {
            const token = localStorage.getItem('token');
            if (selectedType === 'full_crawl') {
                const res = await fetch(`http://localhost:8000/api/sites/${id}/crawl`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                const data = await res.json();
                if (data.success) {
                    toast.success(data.message);
                    fetchPages(); // Refresh pages list
                } else {
                    toast.error(data.message || 'Failed to start crawl');
                }
            } else {
                // Placeholder for other types if implemented later
                toast.error("Audit type not fully supported yet.");
            }
        } catch (error) {
            console.error('Failed to start audit:', error);
            toast.error('Failed to start audit. Please try again.');
        } finally {
            setRunning(false);
        }
    };

    const countIssuesBySeverity = (severity) => {
        return issues.filter(i => i.severity === severity).length;
    };

    const filteredIssues = issueCategory === 'all'
        ? issues
        : issues.filter(i => i.severity === issueCategory);

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>Loading...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px', fontFamily: '-apple-system, sans-serif' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px 0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                    <button
                        onClick={() => navigate(`/sites/${id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', marginBottom: '16px', cursor: 'pointer', fontSize: '14px' }}
                    >
                        <ArrowLeft size={16} /> Back to Site Details
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Site Audit Report</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>{site?.domain}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!running && processingCount === 0 && (
                                <button
                                    onClick={startAudit}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    <Play size={16} /> Run New Audit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>

                {/* Progress Bar (if running) */}
                {(processingCount > 0 || running) && (
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <Loader2 className="animate-spin" size={24} color="#3b82f6" />
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Audit in Progress</h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Analyzing {processingCount} pages... Found {totalPages} so far.</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!currentAudit && processingCount === 0 && !running && (
                    <div style={{ textAlign: 'center', padding: '64px', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                        <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Activity size={32} color="#3b82f6" />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>No Audit Data Yet</h2>
                        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 24px' }}>Run a comprehensive technical audit to identify SEO issues, broken links, and optimization opportunities.</p>
                        <button
                            onClick={startAudit}
                            style={{ padding: '12px 32px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }}
                        >
                            Start First Audit
                        </button>
                    </div>
                )}

                {/* Dashboard */}
                {currentAudit && (
                    <>
                        {/* Stats Overview */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                            {/* Score Card */}
                            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '80px', height: '80px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={currentAudit.score >= 90 ? '#22c55e' : currentAudit.score >= 50 ? '#eab308' : '#ef4444'} strokeWidth="3" strokeDasharray={`${currentAudit.score}, 100`} />
                                    </svg>
                                    <div style={{ position: 'absolute', fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>{currentAudit.score}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Health Score</div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>Last updated: {new Date(currentAudit.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>

                            {/* Critical Errors */}
                            <StatsCard
                                label="Critical Errors"
                                value={countIssuesBySeverity('critical')}
                                icon={<AlertCircle size={24} color="#ef4444" />}
                                color="#ef4444"
                                subtext="Immediate attention needed"
                            />

                            {/* Warnings */}
                            <StatsCard
                                label="Warnings"
                                value={countIssuesBySeverity('high') + countIssuesBySeverity('medium')}
                                icon={<AlertTriangle size={24} color="#f59e0b" />}
                                color="#f59e0b"
                                subtext="Impacts SEO performance"
                            />

                            {/* Pages Crawled */}
                            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500', marginBottom: '8px' }}>Pages Crawled</div>
                                <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{currentAudit.pages_crawled}</div>
                                <div style={{ fontSize: '13px', color: '#3b82f6', cursor: 'pointer', marginTop: '4px' }} onClick={() => setActiveTab('pages')}>View all pages →</div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
                            <button
                                onClick={() => setActiveTab('overview')}
                                style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'overview' ? '#3b82f6' : '#64748b', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Overview & Issues
                            </button>
                            <button
                                onClick={() => setActiveTab('pages')}
                                style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'pages' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'pages' ? '#3b82f6' : '#64748b', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Crawled Pages
                            </button>
                        </div>

                        {/* Content Area */}
                        {activeTab === 'overview' ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                                {/* Main Issues List */}
                                <div style={{ flex: '1 1 600px' }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                                        <FilterPill label="All Issues" count={issues.length} active={issueCategory === 'all'} onClick={() => setIssueCategory('all')} />
                                        <FilterPill label="Critical" count={countIssuesBySeverity('critical')} active={issueCategory === 'critical'} onClick={() => setIssueCategory('critical')} color="red" />
                                        <FilterPill label="High" count={countIssuesBySeverity('high')} active={issueCategory === 'high'} onClick={() => setIssueCategory('high')} color="orange" />
                                        <FilterPill label="Medium" count={countIssuesBySeverity('medium')} active={issueCategory === 'medium'} onClick={() => setIssueCategory('medium')} color="yellow" />
                                        <FilterPill label="Notices" count={countIssuesBySeverity('low')} active={issueCategory === 'low'} onClick={() => setIssueCategory('low')} color="blue" />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {filteredIssues.length === 0 ? (
                                            <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                                <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
                                                <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No issues found</h3>
                                                <p style={{ margin: 0 }}>Great job! No issues in this category.</p>
                                            </div>
                                        ) : (
                                            filteredIssues.map((issue, i) => (
                                                <IssueCard key={i} issue={issue} />
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div style={{ flex: '1 1 300px' }}>
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0' }}>Quick Actions</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <button onClick={() => navigate(`/sites/${id}/onpage-summary`)} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                                <FileText size={16} /> View On-Page SEO
                                            </button>
                                            <button onClick={() => navigate(`/sites/${id}/backlinks`)} style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                                <LinkIcon size={16} /> Check Backlinks
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Pages Tab
                            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Page URL</th>
                                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Status</th>
                                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pages.map(page => (
                                            <tr key={page.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px', fontWeight: '500', color: '#334155' }}>
                                                    <a href={page.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>{page.url}</a>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ padding: '4px 8px', background: page.audit_status === 'completed' ? '#dcfce7' : '#f1f5f9', color: page.audit_status === 'completed' ? '#166534' : '#64748b', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                                                        {page.audit_status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', color: (page.analysis_data?.score || 0) >= 80 ? '#16a34a' : '#ca8a04' }}>
                                                    {page.analysis_data?.score || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* Pagination */}
                                <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '12px', borderTop: '1px solid #e2e8f0' }}>
                                    <button onClick={() => fetchPages(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                                    <span style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>Page {currentPage} of {lastPage}</span>
                                    <button onClick={() => fetchPages(currentPage + 1)} disabled={currentPage === lastPage} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: currentPage === lastPage ? 'not-allowed' : 'pointer' }}>Next</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Components
const StatsCard = ({ label, value, icon, color, subtext }) => (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', background: `${color}15` }}>{icon}</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{value}</div>
        </div>
        <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{label}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{subtext}</div>
        </div>
    </div>
);

const FilterPill = ({ label, count, active, onClick, color = 'blue' }) => {
    const activeBg = {
        red: '#fee2e2',
        orange: '#ffedd5',
        yellow: '#fef9c3',
        blue: '#dbeafe'
    }[color];

    const activeText = {
        red: '#991b1b',
        orange: '#9a3412',
        yellow: '#854d0e',
        blue: '#1e40af'
    }[color];

    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: active ? `1px solid ${activeText}` : '1px solid #e2e8f0',
                background: active ? activeBg : 'white',
                color: active ? activeText : '#64748b',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
            }}
        >
            {label} <span style={{ opacity: 0.7, marginLeft: '4px' }}>{count}</span>
        </button>
    );
};

const IssueCard = ({ issue }) => {
    const colors = {
        critical: { border: '#fecaca', bg: '#fef2f2', text: '#991b1b', badge: '#ef4444' },
        high: { border: '#fed7aa', bg: '#fff7ed', text: '#9a3412', badge: '#f97316' },
        medium: { border: '#fde68a', bg: '#fefce8', text: '#854d0e', badge: '#eab308' },
        low: { border: '#bfdbfe', bg: '#eff6ff', text: '#1e40af', badge: '#3b82f6' }
    }[issue.severity] || { border: '#e2e8f0', bg: 'white', text: '#64748b', badge: '#94a3b8' };

    return (
        <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'start' }}>
                <div style={{ marginTop: '4px' }}>
                    {issue.severity === 'critical' ? <AlertCircle color={colors.badge} size={20} /> : <AlertTriangle color={colors.badge} size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: colors.badge, border: `1px solid ${colors.badge}`, padding: '2px 6px', borderRadius: '4px' }}>{issue.severity}</span>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', textTransform: 'capitalize' }}>{issue.category}</span>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                        {issue.issue_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                        {issue.description}
                    </p>

                    {issue.page_url && (
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <FileText size={14} color="#94a3b8" />
                            <a href={issue.page_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{issue.page_url}</a>
                        </div>
                    )}

                    {issue.recommendation && (
                        <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Info size={14} /> How to fix
                            </div>
                            <div style={{ fontSize: '13px', color: '#0c4a6e', lineHeight: '1.5' }}>
                                {issue.recommendation}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
