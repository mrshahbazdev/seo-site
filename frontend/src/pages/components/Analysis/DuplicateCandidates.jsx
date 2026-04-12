import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://seostory.de/api';

export default function DuplicateCandidates({ siteId, pageId, page, onNavigate }) {
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
                    setError(json.message || 'Could not load duplicate peers');
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
                    Duplicate content
                </h3>
            </div>

            <p style={{ fontSize: '14px', color: '#881337', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                DataForSEO flagged this URL. Below we match <strong>other crawled pages on this site</strong> that
                share the same <strong>title</strong>, <strong>meta description</strong>, or{' '}
                <strong>normalized body text</strong> so you can open and compare them.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {page.raw_data?.duplicate_title && <Badge label="Flag: duplicate title" />}
                {page.raw_data?.duplicate_description && <Badge label="Flag: duplicate description" />}
                {page.raw_data?.duplicate_content && <Badge label="Flag: duplicate body" />}
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9f1239' }}>
                    <Loader2 size={16} className="dup-spin" />
                    Finding pages with matching title, description, or body…
                    <style>{`
                        @keyframes dup-spin { to { transform: rotate(360deg); } }
                        .dup-spin { animation: dup-spin 1s linear infinite; }
                    `}</style>
                </div>
            ) : error ? (
                <div style={{ fontSize: '13px', color: '#b91c1c' }}>{error}</div>
            ) : (
                <>
                    {data?.current && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#881337', marginBottom: '8px' }}>
                                This page
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
                        <p style={{ fontSize: '13px', color: '#881337', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                            No other crawled pages on this site matched by <strong>same title</strong>,{' '}
                            <strong>same meta description</strong>, or <strong>identical normalized body text</strong>.
                            DataForSEO can still flag near-duplicate or template overlap — use filters on the page list or
                            re-crawl after changes.
                        </p>
                    ) : (
                        <>
                            <DuplicateSection
                                title="Same title (other URLs)"
                                emptyHint="—"
                                rows={data?.same_title}
                                siteId={siteId}
                                onNavigate={onNavigate}
                                compactEmpty
                            />
                            <DuplicateSection
                                title="Same meta description"
                                emptyHint="—"
                                rows={data?.same_description}
                                siteId={siteId}
                                onNavigate={onNavigate}
                                compactEmpty
                            />
                            <DuplicateSection
                                title="Same body text (normalized)"
                                emptyHint="—"
                                rows={data?.same_body}
                                siteId={siteId}
                                onNavigate={onNavigate}
                                compactEmpty
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function DuplicateSection({ title, emptyHint, rows, siteId, onNavigate, compactEmpty }) {
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
            <PeerTable rows={rows} siteId={siteId} onNavigate={onNavigate} />
        </div>
    );
}

function PeerTable({ rows, siteId, onNavigate }) {
    return (
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #fda4af', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ background: '#ffe4e6', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', color: '#881337', fontWeight: '700' }}>URL</th>
                        <th style={{ padding: '8px 10px', color: '#881337', fontWeight: '700' }}>Title</th>
                        <th style={{ padding: '8px 10px', color: '#881337', fontWeight: '700' }}>Meta description</th>
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
                                        (this page)
                                    </span>
                                )}
                            </td>
                            <td style={{ padding: '8px 10px', verticalAlign: 'top', color: '#334155' }}>
                                {row.title || '—'}
                            </td>
                            <td style={{ padding: '8px 10px', verticalAlign: 'top', color: '#475569', lineHeight: 1.4 }}>
                                {row.description_preview || row.description || '—'}
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
                                            Open
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
