import { useNavigate } from 'react-router-dom';
import { Search, BarChart3, Users, Zap, Globe, Shield, TrendingUp, Target } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LandingPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const features = [
        { icon: <Search size={28} color="#3b82f6" />, title: t('landing.featureSiteAudit'), desc: t('landing.featureSiteAuditDesc') },
        { icon: <BarChart3 size={28} color="#8b5cf6" />, title: t('landing.featureKeywordResearch'), desc: t('landing.featureKeywordResearchDesc') },
        { icon: <Users size={28} color="#ec4899" />, title: t('landing.featureCompetitorAnalysis'), desc: t('landing.featureCompetitorAnalysisDesc') },
        { icon: <Globe size={28} color="#10b981" />, title: t('landing.featureBacklinks'), desc: t('landing.featureBacklinksDesc') },
        { icon: <Target size={28} color="#f59e0b" />, title: t('landing.featureOpportunityFinder'), desc: t('landing.featureOpportunityFinderDesc') },
        { icon: <Shield size={28} color="#06b6d4" />, title: t('landing.featureOnPage'), desc: t('landing.featureOnPageDesc') },
    ];

    const stats = [
        { value: '50+', label: t('landing.statSeoChecks') },
        { value: '3', label: t('landing.statLanguages') },
        { value: '24/7', label: t('landing.statMonitoring') },
        { value: '100%', label: t('landing.statFree') },
    ];

    return (
        <div style={{ minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {/* Navigation */}
            <nav style={{
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px 24px',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TrendingUp size={28} color="#3b82f6" />
                        <span style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{t('common.appName')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LanguageSwitcher />
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '8px 20px',
                                background: 'transparent',
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            {t('auth.signIn')}
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            style={{
                                padding: '8px 20px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            {t('auth.signUp')}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #f5f3ff 100%)',
                padding: '80px 24px',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '24px',
                    }}>
                        {t('landing.badge')}
                    </div>
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: '800',
                        color: '#0f172a',
                        lineHeight: '1.2',
                        margin: '0 0 20px 0',
                    }}>
                        {t('landing.heroTitle')}
                    </h1>
                    <p style={{
                        fontSize: '20px',
                        color: '#475569',
                        lineHeight: '1.6',
                        margin: '0 0 40px 0',
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                    }}>
                        {t('landing.heroSubtitle')}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/register')}
                            style={{
                                padding: '14px 32px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                            }}
                        >
                            {t('landing.getStarted')}
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '14px 32px',
                                background: 'white',
                                color: '#334155',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            {t('landing.signInExisting')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section style={{ padding: '60px 24px', background: 'white' }}>
                <div style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '32px',
                    textAlign: 'center',
                }}>
                    {stats.map((stat, i) => (
                        <div key={i}>
                            <div style={{ fontSize: '36px', fontWeight: '800', color: '#3b82f6' }}>{stat.value}</div>
                            <div style={{ fontSize: '16px', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '80px 24px', background: '#f8fafc' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: '12px' }}>
                        {t('landing.featuresTitle')}
                    </h2>
                    <p style={{ fontSize: '18px', color: '#64748b', textAlign: 'center', marginBottom: '48px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                        {t('landing.featuresSubtitle')}
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '24px',
                    }}>
                        {features.map((feature, i) => (
                            <div key={i} style={{
                                background: 'white',
                                padding: '32px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                transition: 'box-shadow 0.2s',
                            }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    background: '#f1f5f9',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px',
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                                    {feature.title}
                                </h3>
                                <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '80px 24px',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
                        {t('landing.ctaTitle')}
                    </h2>
                    <p style={{ fontSize: '18px', color: '#bfdbfe', marginBottom: '32px', lineHeight: '1.6' }}>
                        {t('landing.ctaSubtitle')}
                    </p>
                    <button
                        onClick={() => navigate('/register')}
                        style={{
                            padding: '14px 40px',
                            background: 'white',
                            color: '#1e40af',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                        }}
                    >
                        {t('landing.ctaButton')}
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '32px 24px', background: '#0f172a', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                    <TrendingUp size={20} color="#3b82f6" />
                    <span style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{t('common.appName')}</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                    {t('landing.footerText')}
                </p>
            </footer>
        </div>
    );
}
