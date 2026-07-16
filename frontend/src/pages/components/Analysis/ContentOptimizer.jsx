import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function ContentOptimizer({ siteId, pageId, savedAnalysis }) {
    const { t } = useTranslation();
    const [keyword, setKeyword] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (savedAnalysis) {
            setKeyword(savedAnalysis.keyword || '');
            setResult(savedAnalysis);
        }
    }, [savedAnalysis]);

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!keyword.trim()) return;

        try {
            setAnalyzing(true);
            const token = localStorage.getItem('token');
            // Correct API endpoint as defined in api.php
            const res = await fetch(`http://localhost:8000/api/sites/${siteId}/onpage/pages/${pageId}/analyze-content`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ keyword })
            });

            const data = await res.json();
            if (data.success) {
                setResult(data.data);
            } else {
                toast.error(data.message || t('contentOptimizer.analysisFailed'));
            }
        } catch (error) {
            console.error('Analysis error:', error);
            toast.error(t('contentOptimizer.failedToRun'));
        } finally {
            setAnalyzing(false);
        }
    };

    const getScoreColor = (density) => {
        if (density >= 1 && density <= 3) return '#166534'; // Green (Good)
        if (density > 0.5 && density < 4) return '#d97706'; // OK
        return '#dc2626'; // Bad (Too low or Too high)
    };

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} /> {t('contentOptimizer.title')}
            </h3>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                {t('contentOptimizer.description')}
            </p>

            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: result ? '24px' : '0' }}>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={t('contentOptimizer.placeholder')}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <button
                    type="submit"
                    disabled={analyzing || !keyword.trim()}
                    style={{
                        padding: '10px 20px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: (analyzing || !keyword.trim()) ? 'not-allowed' : 'pointer',
                        opacity: (analyzing || !keyword.trim()) ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    {analyzing ? (
                        <>{t('contentOptimizer.parsing')}</>
                    ) : (
                        <><Search size={16} /> {t('contentOptimizer.analyze')}</>
                    )}
                </button>
            </form>

            {result && (
                <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                    {/* Density Score */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>{t('contentOptimizer.keywordDensity')}</div>
                            <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                                {t('contentOptimizer.foundTimes', { count: result.keyword_count, total: result.total_words })}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: getScoreColor(result.density_score) }}>
                                {result.density_score}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{t('contentOptimizer.target')}</div>
                        </div>
                    </div>

                    {/* Placements Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                        <PlacementBadge label={t('contentOptimizer.inTitle')} active={result.placements?.in_title} />
                        <PlacementBadge label={t('contentOptimizer.inH1')} active={result.placements?.in_h1} />
                        <PlacementBadge label={t('contentOptimizer.inDescription')} active={result.placements?.in_description} />
                        <PlacementBadge label={t('contentOptimizer.inUrl')} active={result.placements?.in_url} />
                        <PlacementBadge label={t('contentOptimizer.first100Words')} active={result.placements?.at_start} />
                    </div>

                    {/* Recommendations */}
                    {result.recommendations.length > 0 ? (
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>{t('contentOptimizer.optimizationTips')}</h4>
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '8px' }}>
                                {result.recommendations.map((rec, i) => (
                                    <li key={i} style={{ padding: '10px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '14px', display: 'flex', gap: '8px' }}>
                                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <CheckCircle size={18} />
                            <span>{t('contentOptimizer.noIssues')}</span>
                        </div>
                    )}
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

const PlacementBadge = ({ label, active }) => (
    <div style={{
        padding: '10px',
        border: active ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
        background: active ? '#f0fdf4' : 'white',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    }}>
        <span style={{ fontSize: '13px', color: '#475569' }}>{label}</span>
        {active ? <CheckCircle size={16} color="#166534" /> : <XCircle size={16} color="#e2e8f0" />}
    </div>
);

