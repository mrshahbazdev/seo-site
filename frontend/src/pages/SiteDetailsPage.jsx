import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Users, Link as LinkIcon, FileText, ArrowLeft, Globe } from 'lucide-react';

export default function SiteDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [site, setSite] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch site details (simple fetch for name/domain)
        const fetchSite = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`https://seostory.de/api/sites/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setSite(data.site);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSite();
    }, [id]);

    const Tools = [
        {
            name: 'Site Audit',
            path: `/sites/${id}/audit`,
            icon: <Activity size={24} color="#3b82f6" />,
            desc: 'Technical SEO health check. Crawl pages and find issues.',
            color: '#eff6ff'
        },
        {
            name: 'Competitor Analysis',
            path: `/sites/${id}/competitors`,
            icon: <Users size={24} color="#ef4444" />,
            desc: 'Track and compare performance against your top rivals.',
            color: '#fef2f2'
        },
        {
            name: 'Backlink Profile',
            path: `/sites/${id}/backlinks`,
            icon: <LinkIcon size={24} color="#10b981" />,
            desc: 'Monitor inbound links and referring domains.',
            color: '#ecfdf5'
        },
        {
            name: 'On-Page SEO',
            path: `/sites/${id}/onpage-summary`,
            icon: <FileText size={24} color="#f59e0b" />,
            desc: 'Analyze content, meta tags, and keyword usage per page.',
            color: '#fffbeb'
        }
    ];

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!site) return <div style={{ padding: '40px', textAlign: 'center' }}>Site not found</div>;

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
            <button
                onClick={() => navigate('/dashboard')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    marginBottom: '24px',
                    fontSize: '14px'
                }}
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <Globe size={32} color="#3b82f6" />
                </div>
                <div>
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{site.name}</h1>
                    <a href={site.domain} target="_blank" rel="noreferrer" style={{ color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {site.domain} <LinkIcon size={12} />
                    </a>
                </div>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a202c', marginBottom: '24px' }}>Project Tools</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {Tools.map((tool, i) => (
                    <Link key={i} to={tool.path} style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            height: '100%',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: tool.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px'
                            }}>
                                {tool.icon}
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>{tool.name}</h3>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>{tool.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
