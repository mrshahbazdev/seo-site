import { useState } from 'react';
import { Layout, ArrowRight, Search, TrendingUp, BarChart2, Target, Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GapAnalysisPage() {
    const [target, setTarget] = useState('jobspic.com'); // Default for demo
    const [competitors, setCompetitors] = useState(['rozee.pk', '']);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCompetitorChange = (index, value) => {
        const newComps = [...competitors];
        newComps[index] = value;
        setCompetitors(newComps);
    };

    const addCompetitor = () => {
        if (competitors.length < 3) setCompetitors([...competitors, '']);
    };

    const removeCompetitor = (index) => {
        const newComps = competitors.filter((_, i) => i !== index);
        setCompetitors(newComps);
    };

    const analyze = async () => {
        const activeCompetitors = competitors.filter(c => c.trim() !== '');
        if (!target) return toast.error("Please enter your domain");
        if (activeCompetitors.length === 0) return toast.error("Enter at least 1 competitor");

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/api/tools/gap-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    target_domain: target,
                    competitors: activeCompetitors
                })
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.data);
            } else {
                toast.error(data.message || 'Analysis failed');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Target size={32} color="#3b82f6" /> Content Gap Analysis
                </h1>
                <p style={{ color: '#64748b', fontSize: '16px' }}>
                    Find high-value keywords your competitors rank for, but you don't.
                </p>
            </div>

            {/* Input Section */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>

                {/* Your Site */}
                <div style={{ flex: '1 1 300px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>YOUR WEBSITE</h3>
                    <div style={{ position: 'relative' }}>
                        <Shield style={{ position: 'absolute', left: '12px', top: '12px', color: '#166534' }} size={18} />
                        <input
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder="yoursite.com"
                            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '2px solid #bbf7d0', fontSize: '15px', fontWeight: '500', outline: 'none' }}
                        />
                    </div>
                </div>

                {/* VS */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#94a3b8', fontSize: '14px' }}>VS</div>
                </div>

                {/* Competitors */}
                <div style={{ flex: '2 1 400px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>COMPETITORS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {competitors.map((comp, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={comp}
                                    onChange={(e) => handleCompetitorChange(i, e.target.value)}
                                    placeholder={`Competitor ${i + 1}`}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                                />
                                {competitors.length > 1 && (
                                    <button onClick={() => removeCompetitor(i)} style={{ padding: '0 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
                                )}
                            </div>
                        ))}
                        {competitors.length < 3 && (
                            <button onClick={addCompetitor} style={{ alignSelf: 'start', fontSize: '13px', color: '#3b82f6', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}>+ Add Competitor</button>
                        )}
                    </div>
                </div>

                {/* Action */}
                <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #dae1e7' }}>
                    <button
                        onClick={analyze}
                        disabled={loading}
                        style={{
                            padding: '14px 32px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        {loading ? 'Scanning Gap...' : 'Find Keyword Gaps'} <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Results */}
            {results && (
                <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Content Opportunities ({results.length})</h3>

                    <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Keyword</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Volume</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>KD</th>
                                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#166534', background: '#f0fdf4' }}>You</th>
                                    {competitors.filter(c => c).map((c, i) => (
                                        <th key={i} style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#ea580c', background: '#fff7ed' }}>
                                            {c.replace('https://', '').replace('www.', '').split('/')[0]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', background: item.is_gap ? '#fafafa' : 'white' }}>
                                        <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a' }}>
                                            {item.keyword}
                                            {item.is_gap && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px' }}>GAP</span>}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', color: '#475569' }}>{item.volume?.toLocaleString()}</td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                                                background: item.kd > 70 ? '#fee2e2' : (item.kd > 40 ? '#fef3c7' : '#dcfce7'),
                                                color: item.kd > 70 ? '#991b1b' : (item.kd > 40 ? '#92400e' : '#166534')
                                            }}>
                                                {item.kd || '-'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center', background: '#f0fdf455', fontWeight: 'bold', color: item.ranks[Object.keys(item.ranks).find(k => target.includes(k))] ? '#166534' : '#cbd5e1' }}>
                                            {item.ranks[Object.keys(item.ranks).find(k => target.includes(k))] || '-'}
                                        </td>
                                        {competitors.filter(c => c).map((c, i) => {
                                            const compHost = c.replace('https://', '').replace('/', '').replace('www.', '');
                                            // Simple fuzzy match for key
                                            const rankKey = Object.keys(item.ranks).find(k => k.includes(compHost));
                                            const rank = item.ranks[rankKey];
                                            return (
                                                <td key={i} style={{ padding: '16px', textAlign: 'center', background: '#fff7ed55', fontWeight: 'bold' }}>
                                                    {rank || '-'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
