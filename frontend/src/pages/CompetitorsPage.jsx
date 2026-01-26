import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, TrendingUp, Link2, Users, RefreshCw, Trash2, Eye, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompetitorsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [competitors, setCompetitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchCompetitors();
    }, [id]);

    const fetchCompetitors = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/sites/${id}/competitors`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                setCompetitors(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load competitors');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCompetitor = async () => {
        if (!newDomain.trim()) {
            toast.error('Please enter a domain');
            return;
        }

        try {
            setAdding(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/sites/${id}/competitors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    domain: newDomain.trim(),
                    name: newName.trim() || newDomain.trim()
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Competitor added!');
                setShowAddModal(false);
                setNewDomain('');
                setNewName('');
                fetchCompetitors();
            } else {
                toast.error(data.message || 'Failed to add competitor');
            }
        } catch (error) {
            toast.error('Failed to add competitor');
        } finally {
            setAdding(false);
        }
    };

    const handleAnalyze = async (competitorId) => {
        try {
            const token = localStorage.getItem('token');
            toast.loading('Analyzing competitor...', { id: 'analyze' });

            const res = await fetch(`http://localhost:8000/api/sites/${id}/competitors/${competitorId}/analyze`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Analysis complete!', { id: 'analyze' });
                fetchCompetitors();
            } else {
                toast.error(data.message || 'Analysis failed', { id: 'analyze' });
            }
        } catch (error) {
            toast.error('Analysis failed', { id: 'analyze' });
        }
    };

    const handleDelete = async (competitorId, name) => {
        if (!confirm(`Remove ${name} from competitors?`)) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/sites/${id}/competitors/${competitorId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Competitor removed');
                fetchCompetitors();
            }
        } catch (error) {
            toast.error('Failed to remove competitor');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', color: '#64748b' }}>Loading competitors...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => navigate(`/sites/${id}`)}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                            Competitor Analysis
                        </h1>
                        <p style={{ color: '#64748b', margin: 0 }}>
                            Track and compare your competitors' SEO performance
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {competitors.filter(c => c.metrics_data && Object.keys(c.metrics_data).length > 0).length >= 2 && (
                            <button
                                onClick={() => navigate(`/sites/${id}/competitors-comparison`)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: '#f1f5f9',
                                    color: '#0f172a',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <BarChart3 size={18} /> Compare All
                            </button>
                        )}
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
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
                            <Plus size={18} /> Add Competitor
                        </button>
                    </div>
                </div>
            </div>

            {/* Competitors Grid */}
            {competitors.length === 0 ? (
                <div style={{
                    background: 'white',
                    border: '2px dashed #e2e8f0',
                    borderRadius: '12px',
                    padding: '64px',
                    textAlign: 'center'
                }}>
                    <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
                        No Competitors Added
                    </h3>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>
                        Add competitor domains to track their SEO performance
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
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
                        Add Your First Competitor
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {competitors.map(comp => (
                        <CompetitorCard
                            key={comp.id}
                            competitor={comp}
                            onAnalyze={() => handleAnalyze(comp.id)}
                            onDelete={() => handleDelete(comp.id, comp.name)}
                            onView={() => navigate(`/sites/${id}/competitors/${comp.id}`)}
                        />
                    ))}
                </div>
            )}

            {/* Add Competitor Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px',
                        width: '500px',
                        maxWidth: '90%'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
                            Add Competitor
                        </h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                                Domain *
                            </label>
                            <input
                                type="text"
                                placeholder="example.com"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                                Name (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="Friendly name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewDomain('');
                                    setNewName('');
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#f1f5f9',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCompetitor}
                                disabled={adding}
                                style={{
                                    padding: '10px 20px',
                                    background: adding ? '#94a3b8' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: adding ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {adding ? 'Adding...' : 'Add Competitor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const CompetitorCard = ({ competitor, onAnalyze, onDelete, onView }) => {
    const metrics = competitor.metrics_data;
    const hasMetrics = metrics && Object.keys(metrics).length > 0;

    return (
        <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            transition: 'box-shadow 0.2s',
            cursor: 'pointer'
        }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>
                    {competitor.name}
                </h3>
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Link2 size={12} /> {competitor.domain}
                </div>
            </div>

            {hasMetrics ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <MetricBox label="Backlinks" value={metrics.backlinks?.toLocaleString() || 'N/A'} />
                    <MetricBox label="Ref. Domains" value={metrics.referring_domains?.toLocaleString() || 'N/A'} />
                    <MetricBox label="Ref. IPs" value={metrics.referring_ips?.toLocaleString() || 'N/A'} />
                    <MetricBox label="Ref. Subnets" value={metrics.referring_subnets?.toLocaleString() || 'N/A'} />
                </div>
            ) : (
                <div style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    color: '#64748b',
                    fontSize: '13px'
                }}>
                    No metrics yet. Click "Analyze" to fetch data.
                </div>
            )}

            {competitor.last_analyzed && (
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                    Last analyzed: {new Date(competitor.last_analyzed).toLocaleDateString()}
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    <RefreshCw size={14} /> Analyze
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onView(); }}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}
                >
                    <Eye size={14} /> View
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    style={{
                        padding: '8px 12px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

const MetricBox = ({ label, value }) => (
    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{value}</div>
    </div>
);
