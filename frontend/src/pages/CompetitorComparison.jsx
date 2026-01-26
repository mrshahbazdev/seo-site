import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Award, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompetitorComparison() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [competitors, setCompetitors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompetitors();
    }, [id]);

    const fetchCompetitors = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`https://seostory.de/api/sites/${id}/competitors`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                // Only include competitors with metrics
                const withMetrics = data.data.filter(c => c.metrics_data && Object.keys(c.metrics_data).length > 0);
                setCompetitors(withMetrics);

                if (withMetrics.length === 0) {
                    toast.error('No competitors with metrics found. Analyze competitors first.');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load competitors');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', color: '#64748b' }}>Loading comparison...</div>
            </div>
        );
    }

    if (competitors.length === 0) {
        return (
            <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate(`/sites/${id}/competitors`)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '24px'
                    }}
                >
                    <ArrowLeft size={16} /> Back to Competitors
                </button>

                <div style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '64px',
                    textAlign: 'center'
                }}>
                    <AlertCircle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No Data to Compare</h3>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>
                        Add competitors and analyze them to see comparison data.
                    </p>
                    <button
                        onClick={() => navigate(`/sites/${id}/competitors`)}
                        style={{
                            padding: '12px 24px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Go to Competitors
                    </button>
                </div>
            </div>
        );
    }

    // Extract metrics for comparison
    const metrics = {
        backlinks: competitors.map(c => ({ name: c.name, value: c.metrics_data.backlinks || 0 })),
        referring_domains: competitors.map(c => ({ name: c.name, value: c.metrics_data.referring_domains || 0 })),
        referring_ips: competitors.map(c => ({ name: c.name, value: c.metrics_data.referring_ips || 0 })),
        referring_subnets: competitors.map(c => ({ name: c.name, value: c.metrics_data.referring_subnets || 0 }))
    };

    // Find best performers
    const bestBacklinks = [...metrics.backlinks].sort((a, b) => b.value - a.value)[0];
    const bestDomains = [...metrics.referring_domains].sort((a, b) => b.value - a.value)[0];

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => navigate(`/sites/${id}/competitors`)}
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
                    <ArrowLeft size={16} /> Back to Competitors
                </button>

                <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                    Competitor Comparison
                </h1>
                <p style={{ color: '#64748b', margin: 0 }}>
                    Comparing {competitors.length} competitor{competitors.length > 1 ? 's' : ''}
                </p>
            </div>

            {/* Winners Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <WinnerCard title="Most Backlinks" winner={bestBacklinks.name} value={bestBacklinks.value.toLocaleString()} />
                <WinnerCard title="Most Referring Domains" winner={bestDomains.name} value={bestDomains.value.toLocaleString()} />
            </div>

            {/* Comparison Table */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Metrics Comparison</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Competitor</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Backlinks</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Ref. Domains</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Ref. IPs</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Ref. Subnets</th>
                            </tr>
                        </thead>
                        <tbody>
                            {competitors.map((comp, i) => {
                                const m = comp.metrics_data;
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>{comp.name}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                            {(m.backlinks || 0).toLocaleString()}
                                            {m.backlinks === bestBacklinks.value && <Award size={14} color="#f59e0b" style={{ marginLeft: '4px', display: 'inline' }} />}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                            {(m.referring_domains || 0).toLocaleString()}
                                            {m.referring_domains === bestDomains.value && <Award size={14} color="#f59e0b" style={{ marginLeft: '4px', display: 'inline' }} />}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                            {(m.referring_ips || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                            {(m.referring_subnets || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <BarChart title="Backlinks Comparison" data={metrics.backlinks} />
                <BarChart title="Referring Domains Comparison" data={metrics.referring_domains} />
            </div>
        </div>
    );
}

const WinnerCard = ({ title, winner, value }) => (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '24px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Award size={20} />
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: 0, opacity: 0.9 }}>{title}</h3>
        </div>
        <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{winner}</div>
        <div style={{ fontSize: '16px', opacity: 0.8 }}>{value}</div>
    </div>
);

const BarChart = ({ title, data }) => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.map((item, i) => (
                    <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                            <span style={{ fontWeight: '600', color: '#334155' }}>{item.name}</span>
                            <span style={{ color: '#64748b' }}>{item.value.toLocaleString()}</span>
                        </div>
                        <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                            <div style={{
                                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                                height: '100%',
                                width: `${(item.value / maxValue) * 100}%`,
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
