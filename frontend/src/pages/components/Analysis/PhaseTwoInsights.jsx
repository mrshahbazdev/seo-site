import { useState } from 'react';
import { Link2, AlertCircle, TrendingDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'https://seostory.de/api';

export default function PhaseTwoInsights({ siteId, onNavigate }) {
  const [keyword, setKeyword] = useState('');
  const [cannibalization, setCannibalization] = useState(null);
  const [linking, setLinking] = useState(null);
  const [decay, setDecay] = useState(null);
  const [loading, setLoading] = useState({ c: false, l: false, d: false });

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    Accept: 'application/json',
  });

  const runCannibalization = async () => {
    if (!keyword.trim()) {
      toast.error('Enter a keyword first');
      return;
    }
    setLoading((s) => ({ ...s, c: true }));
    try {
      const res = await fetch(`${API_BASE}/sites/${siteId}/insights/cannibalization?keyword=${encodeURIComponent(keyword.trim())}`, { headers: headers() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      setCannibalization(data.data);
    } catch (e) {
      toast.error(e.message || 'Failed to load cannibalization');
    } finally {
      setLoading((s) => ({ ...s, c: false }));
    }
  };

  const runInternalLinking = async () => {
    setLoading((s) => ({ ...s, l: true }));
    try {
      const res = await fetch(`${API_BASE}/sites/${siteId}/insights/internal-linking?limit=10`, { headers: headers() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      setLinking(data.data);
    } catch (e) {
      toast.error(e.message || 'Failed to load linking opportunities');
    } finally {
      setLoading((s) => ({ ...s, l: false }));
    }
  };

  const runDecayAlerts = async () => {
    setLoading((s) => ({ ...s, d: true }));
    try {
      const res = await fetch(`${API_BASE}/sites/${siteId}/insights/decay-alerts`, { headers: headers() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      setDecay(data.data);
    } catch (e) {
      toast.error(e.message || 'Failed to load decay alerts');
    } finally {
      setLoading((s) => ({ ...s, d: false }));
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Phase 2 Insights</h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
        Cannibalization, internal-link opportunities, and content decay alerts.
      </p>

      <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Keyword for cannibalization (e.g. arbeitsschutz beratung)"
            style={{ flex: '1 1 260px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '13px' }}
          />
          <button onClick={runCannibalization} style={btn('#2563eb')} disabled={loading.c}>
            <Search size={14} /> {loading.c ? 'Checking...' : 'Check Cannibalization'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={runInternalLinking} style={btn('#0ea5e9')} disabled={loading.l}>
            <Link2 size={14} /> {loading.l ? 'Loading...' : 'Find Internal Linking Opportunities'}
          </button>
          <button onClick={runDecayAlerts} style={btn('#8b5cf6')} disabled={loading.d}>
            <TrendingDown size={14} /> {loading.d ? 'Loading...' : 'Check Decay Alerts'}
          </button>
        </div>
      </div>

      {cannibalization && (
        <div style={box()}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
            Cannibalization Risk: <span style={{ color: riskColor(cannibalization.risk) }}>{cannibalization.risk}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{cannibalization.recommendation}</div>
          {(cannibalization.pages || []).slice(0, 5).map((p) => (
            <div key={p.id} style={row()}>
              <span style={{ fontSize: '12px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title || p.url}</span>
              <button onClick={() => onNavigate(`/sites/${siteId}/onpage/pages/${p.id}`)} style={linkBtn()}>Open</button>
            </div>
          ))}
        </div>
      )}

      {linking && (
        <div style={box()}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
            Internal Link Opportunities ({linking.suggestions?.length || 0})
          </div>
          {(linking.suggestions || []).slice(0, 5).map((s, i) => (
            <div key={`${s.target?.id}-${i}`} style={{ borderTop: i ? '1px solid #e2e8f0' : 'none', paddingTop: i ? '8px' : 0, marginTop: i ? '8px' : 0 }}>
              <div style={{ fontSize: '12px', color: '#334155' }}>
                Target: <strong>{s.target?.title || s.target?.url}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Source: {s.source?.title || s.source?.url} | Anchors: {(s.anchor_suggestions || []).join(', ') || 'n/a'}
              </div>
            </div>
          ))}
        </div>
      )}

      {decay && (
        <div style={box()}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '6px' }}>
            Decay Alerts
          </div>
          {(decay.alerts || []).length === 0 ? (
            <div style={{ fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} /> No strong decay alert in recent audit history.
            </div>
          ) : (
            (decay.alerts || []).map((a, idx) => (
              <div key={idx} style={{ fontSize: '12px', color: a.severity === 'high' ? '#b91c1c' : '#92400e', marginBottom: '6px' }}>
                - {a.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const btn = (bg) => ({
  background: bg,
  border: 'none',
  color: 'white',
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
});

const box = () => ({
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '12px',
  marginBottom: '10px',
});

const row = () => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '8px',
  marginTop: '8px',
  gap: '8px',
});

const linkBtn = () => ({
  border: 'none',
  background: 'none',
  color: '#2563eb',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
});

const riskColor = (risk) => (risk === 'high' ? '#b91c1c' : risk === 'medium' ? '#b45309' : '#166534');

