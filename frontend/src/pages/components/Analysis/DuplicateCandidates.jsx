import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function DuplicateCandidates({ siteId, pageId, page, onNavigate }) {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                const res = await fetch(
                    `${API_BASE}/sites/${siteId}/onpage/pages/${pageId}/duplicates`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/json',
                        },
                    }
                );
                const json = await res.json();
                if (cancelled) return;
                if (json.success) {
                    setData(json);
                } else {
                    setError(json.message || t('duplicateContent.couldNotLoad'));
                }
            } catch (e) {
                if (!cancelled) setError(e.message || 'Request failed');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [siteId, pageId]);

    const totalPeers =
        (data?.same_title?.length || 0) +
        (data?.same_description?.length || 0) +
        (data?.same_body?.length || 0);

    return (
        <div
            style={{
                background: '#fff1f2',
                border: '1px solid #fda4af',
                borderRadius: '12px',
                padding: '16px 24px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <AlertTriangle size={24} color="#e11d48" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#9f1239', margin: 0 }}>
                    {t('duplicateContent.title')}
                </h3>
            </div>

            <p style={{ fontSize: '14px', color: '#881337', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                {t('duplicateContent.description')}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {page.raw_data?.duplicate_title && <Badge label={t('duplicateContent.flagTitle')} />}
                {page.raw_data?.duplicate_description && <Badge label={t('duplicateContent.flagDescription')} />}
                {page.raw_data?.duplicate_content && <Badge label={t('duplicateContent.flagBody')} />}
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9f1239' }}>
                    <Loader2 size={16} className="dup-spin" />
                    {t('duplicateContent.finding')}
                    <style>{`
                        @keyframes dup-spin { to { transform: rotate(360deg); } }
                        .dup-spin { animation: dup-spin 1s linear infinite; }
                    `}</style>
                </div>
            ) : error ? (
                <div style={{ 
                    padding: '12px', 
                    background: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #fecdd3',
                    fontSize: '13px', 
                    color: '#b91c1c',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <strong>{t('duplicateContent.unableToFetch')}</strong>
                    <p style={{ margin: 0 }}>{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: '12px', marginTop: '4px' }}
                    >
                        {t('duplicateContent.tryRefreshing')}
                    </button>
                </div>
            ) : (
                <>
                    {data?.current && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#881337', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t('duplicateContent.currentPage')}</span>
                                {totalPeers > 0 && <span style={{ fontWeight: 400, opacity: 0.8 }}>{t('duplicateContent.matchedWith', { count: totalPeers })}</span>}
                            </div>
                            <PeerTable
                                rows={[
                                    {
                                        id: data.current.id,
                                        url: data.current.url,
                                        title: data.current.title,
                                        description: data.current.description,
                                        isCurrent: true,
                                    },
                                ]}
                                siteId={siteId}
                                onNavigate={onNavigate}
                            />
                        </div>
                    )}

                    {totalPeers === 0 ? (
                        <p style={{ 
                            fontSize: '13px', 
                            color: '#881337', 
                            margin: '8px 0 0 0', 
                            lineHeight: 1.5,
                            background: '#fff',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #fecdd3'
                        }}>
                            <strong>{t('duplicateContent.noMatches')}</strong><br/>
                            {t('duplicateContent.noMatchesDesc')}
                        </p>
                    ) : (
                        <>
                            <DuplicateSection
                                title={t('duplicateContent.sameTitle')}
                                emptyHint="—"
                                rows={data?.same_title}
                                strategy="title"
                                siteId={siteId}
                                onNavigate={onNavigate}
                                compactEmpty
                                t={t}
                            />
                            <DuplicateSection
                                title={t('duplicateContent.sameDescription')}
                                emptyHint="—"
                                rows={data?.same_description}
                                strategy="description"
                                siteId={siteId}
                                onNavigate={onNavigate}
                                compactEmpty
                                t={t}
                            />
                            <DuplicateSection
                                title={t('duplicateContent.sameBody')}
                                emptyHint="—"
                                rows={data?.same_body}
                                strategy="body"
                                siteId={siteId}
                                onNavigate={onNavigate}
                                compactEmpty
                                t={t}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function DuplicateSection({ title, emptyHint, rows, siteId, onNavigate, compactEmpty, strategy, t }) {
    if (!rows || rows.length === 0) {
        if (compactEmpty) return null;
        return (
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#881337', marginBottom: '6px' }}>{title}</div>
                <div style={{ fontSize: '12px', color: '#9d174d', fontStyle: 'italic' }}>{emptyHint}</div>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#881337', marginBottom: '8px' }}>
                {title}{' '}
                <span style={{ fontWeight: '600', color: '#be185d' }}>({rows.length})</span>
            </div>
            <PeerTable rows={rows} siteId={siteId} onNavigate={onNavigate} strategy={strategy} t={t} />
        </div>
    );
}

function getRecommendation(strategy, t) {
    if (strategy === 'title') return t('duplicateContent.keepUnique');
    if (strategy === 'description') return t('duplicateContent.rewriteDesc');
    if (strategy === 'body') return t('duplicateContent.mergeContent');
    return t('duplicateContent.reviewPage');
}

function PeerTable({ rows, siteId, onNavigate, strategy, t }) {
    return (
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #fda4af', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#ffe4e6', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', color: '#881337', fontWeight: '700' }}>URL</th>
                        <th style={{ padding: '8px 10px', color: '#881337', fontWeight: '700' }}>{t('duplicateContent.titleColumn')}</th>
                        <th style={{ padding: '8px 10px', color: '#881337', fontWeight: '700' }}>{t('duplicateContent.metaDescColumn')}</th>
                        <th style={{ padding: '8px 10px', color: '#881337', fontWeight: '700' }}>{t('duplicateContent.suggestedAction')}</th>
                        <th style={{ padding: '8px 10px', color: '#881337', fontWeight: '700', width: '100px' }} />
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.id}
                            style={{
                                borderTop: '1px solid #fecdd3',
                                background: row.isCurrent ? '#fff7f7' : '#fff',
                            }}
                        >
                            <td style={{ padding: '8px 10px', verticalAlign: 'top', wordBreak: 'break-all' }}>
                                <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                                    {row.url}
                                </a>
                                {row.isCurrent && (
                                    <span
                                        style={{
                                            marginLeft: '6px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            color: '#be185d',
                                        }}
                                    >
                                        ({t('duplicateContent.thisPage')})
                                    </span>
                                )}
                            </td>
                            <td style={{ padding: '8px 10px', verticalAlign: 'top', color: '#334155' }}>
                                {row.title || '—'}
                            </td>
                            <td style={{ padding: '8px 10px', verticalAlign: 'top', color: '#475569', lineHeight: 1.4 }}>
                                {row.description_preview || row.description || '—'}
                            </td>
                            <td style={{ padding: '8px 10px', verticalAlign: 'top', color: '#475569', lineHeight: 1.4 }}>
                                {row.isCurrent ? t('duplicateContent.currentPage') : getRecommendation(strategy, t)}
                            </td>
                            <td style={{ padding: '8px 10px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                {!row.isCurrent && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onNavigate(`/sites/${siteId}/onpage/pages/${row.id}`)}
                                            style={{
                                                fontSize: '12px',
                                                color: '#2563eb',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                marginRight: '8px',
                                            }}
                                        >
                                            {t('phaseTwo.open')}
                                        </button>
                                        <a
                                            href={row.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: 'inline-flex', color: '#64748b' }}
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const Badge = ({ label }) => (
    <span
        style={{
            background: '#fecdd3',
            color: '#881337',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
        }}
    >
        {label}
    </span>
);
