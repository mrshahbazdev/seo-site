import { useState } from 'react';
import { Bell, TrendingUp, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'https://seostory.de/api';

export default function PhaseThreeOps({ siteId }) {
  const [alerts, setAlerts] = useState([]);
  const [roi, setRoi] = useState(null);
  const [loading, setLoading] = useState({ alerts: false, roi: false });

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    Accept: 'application/json',
  };

  const loadAlerts = async () => {
    setLoading((s) => ({ ...s, alerts: true }));
    try {
      const res = await fetch(`${API_BASE}/sites/${siteId}/alerts`, { headers: authHeaders });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load alerts');
      setAlerts(json.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load alerts');
    } finally {
      setLoading((s) => ({ ...s, alerts: false }));
    }
  };

  const loadRoi = async () => {
    setLoading((s) => ({ ...s, roi: true }));
    try {
      const res = await fetch(`${API_BASE}/sites/${siteId}/roi-summary`, { headers: authHeaders });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load ROI summary');
      setRoi(json.data);
    } catch (e) {
      toast.error(e.message || 'Failed to load ROI summary');
    } finally {
      setLoading((s) => ({ ...s, roi: false }));
    }
  };

  const markRead = async (alertId) => {
    try {
      await fetch(`${API_BASE}/sites/${siteId}/alerts/${alertId}/read`, {
        method: 'POST',
        headers: authHeaders,
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read_at: new Date().toISOString() } : a)));
    } catch {
      toast.error('Failed to mark alert as read');
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Phase 3 Operations</h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
        Team workflow, alerts center, and ROI/progress snapshot.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button style={btn('#8b5cf6')} onClick={loadAlerts} disabled={loading.alerts}>
          <Bell size={14} /> {loading.alerts ? 'Loading...' : 'Load Alerts'}
        </button>
        <button style={btn('#16a34a')} onClick={loadRoi} disabled={loading.roi}>
          <TrendingUp size={14} /> {loading.roi ? 'Loading...' : 'Load ROI Snapshot'}
        </button>
      </div>

      {roi && (
        <div style={box()}>
          <div style={{ fontSize: '12px', color: '#334155', fontWeight: 700, marginBottom: '6px' }}>ROI Snapshot</div>
          <div style={grid()}>
            <Metric label="Score Improvement" value={`${roi.score_improvement ?? 0}`} />
            <Metric label="Fixed Issues" value={`${roi.fixed_issues ?? 0}`} />
            <Metric label="Open Issues" value={`${roi.open_issues ?? 0}`} />
            <Metric label="Completed Audits" value={`${roi.completed_audits ?? 0}`} />
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div style={box()}>
          <div style={{ fontSize: '12px', color: '#334155', fontWeight: 700, marginBottom: '6px' }}>Alerts Center</div>
          {alerts.slice(0, 6).map((alert) => (
            <div key={alert.id} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: 600 }}>{alert.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{alert.message}</div>
                </div>
                {!alert.read_at && (
                  <button onClick={() => markRead(alert.id)} style={markBtn()}>
                    <CheckCircle2 size={13} /> Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const btn = (bg) => ({
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 12px',
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

const grid = () => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '8px',
});

function Metric({ label, value }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
      <div style={{ fontSize: '11px', color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{value}</div>
    </div>
  );
}

const markBtn = () => ({
  border: 'none',
  background: '#ecfdf5',
  color: '#166534',
  borderRadius: '999px',
  padding: '6px 10px',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  height: 'fit-content',
});

