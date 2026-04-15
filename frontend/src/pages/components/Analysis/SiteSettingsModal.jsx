import { useState } from 'react';
import { Settings, X, Bell, Slack, Clock, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'https://seostory.de/api';

export default function SiteSettingsModal({ site, isOpen, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    audit_frequency: site?.audit_frequency || 'manual',
    slack_webhook_url: site?.slack_webhook_url || '',
    notifications_enabled: site?.notifications_enabled ?? true
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/sites/${site.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings updated successfully');
        onSave(data.site ?? data.data ?? {});
        onClose();
      } else {
        toast.error(data.message || 'Failed to update settings');
      }
    } catch (err) {
      toast.error('Network error updating settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="p-6 border-bottom border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Site Settings</h3>
              <p className="text-xs text-slate-500">Configure automation and alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Scheduling Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Clock size={16} className="text-slate-400" />
              Audit Frequency
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['manual', 'daily', 'weekly', 'monthly'].map(freq => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFormData({ ...formData, audit_frequency: freq })}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    formData.audit_frequency === freq 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Bell size={16} className="text-slate-400" />
              Notifications
            </label>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-xs font-medium text-slate-600">Enable Email Alerts</span>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, notifications_enabled: !formData.notifications_enabled })}
                className={`w-10 h-5 rounded-full relative transition-colors ${formData.notifications_enabled ? 'bg-blue-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.notifications_enabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Slack size={14} /> Slack Integration
              </div>
              <input 
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={formData.slack_webhook_url}
                onChange={(e) => setFormData({ ...formData, slack_webhook_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400">Get audit reports directly in your Slack channel.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
