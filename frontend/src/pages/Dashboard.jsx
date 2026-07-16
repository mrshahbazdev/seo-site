import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Users, Target } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Dashboard() {
    const { t } = useTranslation();
    const [sites, setSites] = useState([]);
    const [stats, setStats] = useState({
        totalSites: 0,
        totalAudits: 0,
        criticalIssues: 0,
        avgScore: 0,
    });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/sites`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setSites(data.sites || []);
                setStats({
                    totalSites: data.sites?.length || 0,
                    totalAudits: 0,
                    criticalIssues: 0,
                    avgScore: 75,
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#f7fafc'
            }}>
                <div style={{ color: '#718096', fontSize: '16px' }}>{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f7fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px 0'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#1a202c',
                            margin: 0
                        }}>
                            {t('common.appName')}
                        </h1>
                        {user && (
                            <p style={{
                                fontSize: '14px',
                                color: '#718096',
                                margin: '4px 0 0 0'
                            }}>
                                {t('dashboard.welcome', { name: user.name })}
                            </p>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LanguageSwitcher />
                        {user?.is_admin && (
                            <a
                                href="/admin"
                                style={{
                                    padding: '8px 16px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    textDecoration: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Admin
                            </a>
                        )}
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '8px 16px',
                                background: '#e2e8f0',
                                color: '#2d3748',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#cbd5e0'}
                            onMouseLeave={(e) => e.target.style.background = '#e2e8f0'}
                        >
                            {t('auth.logout')}
                        </button>
                    </div>
                </div>
            </header>

            <main style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '32px 24px'
            }}>
                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                }}>
                    {[
                        { label: t('dashboard.totalSites'), value: stats.totalSites, color: '#3b82f6' },
                        { label: t('dashboard.totalAudits'), value: stats.totalAudits, color: '#10b981' },
                        { label: t('dashboard.criticalIssues'), value: stats.criticalIssues, color: '#ef4444' },
                        { label: t('dashboard.avgHealthScore'), value: stats.avgScore, color: '#8b5cf6' }
                    ].map((stat, index) => (
                        <div key={index} style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#718096',
                                marginBottom: '8px'
                            }}>
                                {stat.label}
                            </div>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '700',
                                color: stat.color
                            }}>
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Power Tools Grid */}
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a202c', marginBottom: '16px' }}>{t('dashboard.powerTools')}</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px'
                }}>
                    {/* Opportunity Finder */}
                    <Link to="/opportunities/finder" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            height: '100%',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
                        >
                            <div style={{ background: '#f5f3ff', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <Sparkles size={24} color="#7c3aed" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>{t('dashboard.opportunityFinder')}</h3>
                            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: t('dashboard.opportunityFinderDesc') }} />
                        </div>
                    </Link>

                    {/* Competitor Spy */}
                    <Link to="/competitors/spy" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            height: '100%',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
                        >
                            <div style={{ background: '#fce7f3', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <Users size={24} color="#db2777" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>{t('dashboard.competitorSpy')}</h3>
                            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                                {t('dashboard.competitorSpyDesc')}
                            </p>
                        </div>
                    </Link>

                    {/* Keyword Research */}
                    <Link to="/keywords/research" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            height: '100%',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
                        >
                            <div style={{ background: '#e0f2fe', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <Search size={24} color="#0284c7" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>{t('dashboard.keywordResearch')}</h3>
                            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                                {t('dashboard.keywordResearchDesc')}
                            </p>
                        </div>
                    </Link>

                    {/* Content Gap */}
                    <Link to="/competitors/gap-analysis" style={{ textDecoration: 'none' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            height: '100%',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
                        >
                            <div style={{ background: '#dcfce7', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <Target size={24} color="#166534" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>{t('dashboard.contentGap')}</h3>
                            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                                {t('dashboard.contentGapDesc')}
                            </p>
                        </div>
                    </Link>
                </div>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px'
                    }}>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#1a202c',
                            margin: 0
                        }}>
                            {t('dashboard.yourSites')}
                        </h2>
                        <a
                            href="/sites/add"
                            style={{
                                padding: '10px 20px',
                                background: '#3b82f6',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                            onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                        >
                            {t('dashboard.addNewSite')}
                        </a>
                    </div>

                    {sites.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '48px 24px'
                        }}>
                            <p style={{
                                color: '#718096',
                                marginBottom: '16px',
                                fontSize: '16px'
                            }}>
                                {t('dashboard.noSitesYet')}
                            </p>
                            <a
                                href="/sites/add"
                                style={{
                                    display: 'inline-block',
                                    padding: '10px 20px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                {t('dashboard.addFirstSite')}
                            </a>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {sites.map((site) => (
                                <div
                                    key={site.id}
                                    style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'start'
                                    }}>
                                        <div>
                                            <h3 style={{
                                                fontWeight: '600',
                                                color: '#1a202c',
                                                margin: '0 0 4px 0',
                                                fontSize: '16px'
                                            }}>
                                                {site.name}
                                            </h3>
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#718096',
                                                margin: 0
                                            }}>
                                                {site.domain}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <a
                                                href={`/sites/${site.id}/audit`}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    textDecoration: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {t('dashboard.runAudit')}
                                            </a>
                                            <a
                                                href={`/sites/${site.id}`}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#e2e8f0',
                                                    color: '#2d3748',
                                                    textDecoration: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {t('dashboard.viewDetails')}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
