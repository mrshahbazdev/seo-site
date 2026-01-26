import { useState, useEffect } from 'react';
import { AlertTriangle, Copy, ExternalLink, Loader2 } from 'lucide-react';

export default function DuplicateCandidates({ siteId, pageId, page, onNavigate }) {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (page.title) {
            findCandidates();
        }
    }, [page.title]);

    const findCandidates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`https://seostory.de/api/sites/${siteId}/onpage/pages?search=${encodeURIComponent(page.title)}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                // Filter out current page
                const others = data.data.filter(p => p.id !== parseInt(pageId));
                setCandidates(others);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#fff1f2', border: '1px solid #fda4af', borderRadius: '12px', padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <AlertTriangle size={24} color="#e11d48" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#9f1239', margin: 0 }}>Duplicate Content Detected</h3>
            </div>

            <p style={{ fontSize: '14px', color: '#881337', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                This page is flagged as a duplicate. Below are other pages with the <strong>same title</strong> or <strong>similar content</strong>:
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {page.raw_data?.duplicate_title && <Badge label="Duplicate Title" />}
                {page.raw_data?.duplicate_description && <Badge label="Duplicate Description" />}
                {page.raw_data?.duplicate_content && <Badge label="Duplicate Body" />}
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9f1239' }}>
                    <Loader2 size={16} className="animate-spin" /> Searching for copies...
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
                </div>
            ) : (
                candidates.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#881337' }}>Found {candidates.length} potential copies:</div>
                        {candidates.map(candidate => (
                            <div key={candidate.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fda4af' }}>
                                <div style={{ fontSize: '13px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>
                                    {candidate.url}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => onNavigate(`/sites/${siteId}/onpage/pages/${candidate.id}`)}
                                        style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        Inspect
                                    </button>
                                    <a
                                        href={candidate.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontSize: '13px', color: '#881337', fontStyle: 'italic' }}>
                        No exact title matches found. The duplication might be partial or cross-site.
                    </div>
                )
            )}
        </div>
    );
}

const Badge = ({ label }) => (
    <span style={{ background: '#fecdd3', color: '#881337', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
        {label}
    </span>
);
