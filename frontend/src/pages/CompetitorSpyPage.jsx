import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Globe, TrendingUp, DollarSign, ArrowLeft, Target, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompetitorSpyPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [keywords, setKeywords] = useState(null);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://seostory.de/api/competitors-spy/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    domain: data.domain
                })
            });

            const dataRes = await res.json();
            if (dataRes.success) {
                setKeywords(dataRes.data);
                toast.success(`Found ${dataRes.data.length} keywords!`);
            } else {
                toast.error(dataRes.message || 'Analysis failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '16px'
                    }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={28} color="#ec4899" /> Competitor Spy
                </h1>
                <p style={{ color: '#64748b', margin: 0 }}>
                    Enter a competitor's domain to see every keyword they rank for. Steal their traffic!
                </p>
            </div>

            {/* Input Section */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Globe size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            {...register('domain', { required: true })}
                            placeholder="competitor.com (e.g., neilpatel.com)"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 50px',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                fontSize: '18px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#ec4899'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0 40px',
                            background: '#ec4899',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Search />}
                        Spy Now
                    </button>
                </form>
            </div>

            {/* Results */}
            {keywords && (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Ranking Keywords ({keywords.length})</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', width: '40%' }}>Keyword</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Position</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Volume</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>CPC</th>
                                <th style={{ padding: '16px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Est. Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {keywords.map((k, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a' }}>
                                        <a href={k.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                                            {k.keyword}
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400', marginTop: '2px' }}>{k.url}</span>
                                        </a>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            background: k.rank <= 3 ? '#dcfce7' : (k.rank <= 10 ? '#e0f2fe' : '#f1f5f9'),
                                            color: k.rank <= 3 ? '#166534' : (k.rank <= 10 ? '#0369a1' : '#475569'),
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            fontWeight: '700',
                                            fontSize: '13px'
                                        }}>
                                            #{k.rank}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#475569' }}>{k.search_volume.toLocaleString()}</td>
                                    <td style={{ padding: '16px', color: '#475569' }}>${k.cpc.toFixed(2)}</td>
                                    <td style={{ padding: '16px', fontWeight: '700', color: '#166534' }}>${(k.traffic_cost).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
