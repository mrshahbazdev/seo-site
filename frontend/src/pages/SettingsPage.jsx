import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Upload, Palette, ExternalLink, CheckCircle, Loader2, X, ArrowLeft, Link2, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'https://seostory.de/api';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function SettingsPage() {
    const navigate = useNavigate();
    const logoInputRef = useRef(null);

    const [settings, setSettings] = useState({
        company_name: '',
        primary_color: '#3b82f6',
        report_footer: '',
        logo_url: null,
    });
    const [googleEmail, setGoogleEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        fetchSettings();
        fetchUserGoogleStatus();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API}/settings`, { headers: authHeader() });
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
                if (data.settings.logo_url) setLogoPreview(data.settings.logo_url);
            }
        } catch (e) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserGoogleStatus = async () => {
        try {
            const res = await fetch(`${API}/user`, { headers: authHeader() });
            const data = await res.json();
            setGoogleEmail(data.google_email || null);
        } catch (_) {}
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`${API}/settings`, {
                method: 'PUT',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: settings.company_name,
                    primary_color: settings.primary_color,
                    report_footer: settings.report_footer,
                }),
            });
            const data = await res.json();
            if (data.success) toast.success('Settings saved!');
            else toast.error(data.message || 'Failed to save');
        } catch (_) {
            toast.error('Network error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview immediately
        setLogoPreview(URL.createObjectURL(file));

        const form = new FormData();
        form.append('logo', file);

        try {
            const res = await fetch(`${API}/settings/logo`, {
                method: 'POST',
                headers: authHeader(),
                body: form,
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Logo uploaded!');
                setSettings(s => ({ ...s, logo_url: data.logo_url }));
                setLogoPreview(data.logo_url);
            } else {
                toast.error(data.message || 'Upload failed');
            }
        } catch (_) {
            toast.error('Upload failed');
        }
    };

    const connectGoogle = async () => {
        try {
            const res = await fetch(`${API}/google/auth-url`, { headers: authHeader() });
            const data = await res.json();
            if (data.url) window.open(data.url, '_blank', 'width=600,height=700');
        } catch (_) {
            toast.error('Failed to get Google auth URL');
        }
    };

    const disconnectGoogle = async () => {
        try {
            const res = await fetch(`${API}/google/disconnect`, { method: 'DELETE', headers: authHeader() });
            const data = await res.json();
            if (data.success) {
                setGoogleEmail(null);
                toast.success('Google disconnected');
            }
        } catch (_) {
            toast.error('Failed to disconnect');
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <Loader2 className="animate-spin" size={32} color="#3b82f6" />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '60px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            {/* Header */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px 0' }}>
                <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '12px', fontSize: '14px' }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Agency Settings</h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0' }}>Customize your branding and integrations</p>
                </div>
            </div>

            <div style={{ maxWidth: '860px', margin: '32px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Branding Card */}
                <form onSubmit={handleSave}>
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '10px' }}>
                                <Building2 size={20} color="#3b82f6" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Agency Branding</h2>
                                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Customize PDF reports and the platform header</p>
                            </div>
                        </div>
                        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Logo Upload */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                                    <Upload size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    Agency Logo
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div
                                        onClick={() => logoInputRef.current?.click()}
                                        style={{
                                            width: '120px', height: '60px', borderRadius: '10px',
                                            border: '2px dashed #cbd5e1', background: logoPreview ? 'white' : '#f8fafc',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.2s',
                                        }}
                                    >
                                        {logoPreview
                                            ? <img src={logoPreview} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                            : <Upload size={20} color="#94a3b8" />
                                        }
                                    </div>
                                    <div>
                                        <button type="button" onClick={() => logoInputRef.current?.click()} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: '#374151' }}>
                                            {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                        </button>
                                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>PNG, JPG, SVG — max 2MB</p>
                                    </div>
                                </div>
                                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                            </div>

                            {/* Company Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Company Name</label>
                                <input
                                    type="text"
                                    value={settings.company_name}
                                    onChange={e => setSettings(s => ({ ...s, company_name: e.target.value }))}
                                    placeholder="Your Agency Name"
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Primary Color */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    <Palette size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    Brand Color
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="color"
                                        value={settings.primary_color}
                                        onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                                        style={{ width: '48px', height: '40px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', padding: '2px' }}
                                    />
                                    <input
                                        type="text"
                                        value={settings.primary_color}
                                        onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                                        style={{ width: '140px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }}
                                    />
                                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Used in PDF reports &amp; UI</span>
                                </div>
                            </div>

                            {/* Report Footer */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Report Footer Text</label>
                                <input
                                    type="text"
                                    value={settings.report_footer}
                                    onChange={e => setSettings(s => ({ ...s, report_footer: e.target.value }))}
                                    placeholder="Generated by Your Agency Name"
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{ alignSelf: 'flex-start', padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                Save Branding
                            </button>
                        </div>
                    </div>
                </form>

                {/* Google Search Console Card */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: '#fef3f2', borderRadius: '10px' }}>
                            {/* Google logo inline SVG */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Google Search Console</h2>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Connect to see real clicks, impressions, and keyword rankings</p>
                        </div>
                    </div>
                    <div style={{ padding: '28px' }}>
                        {googleEmail ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CheckCircle size={20} color="#16a34a" />
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#15803d', fontSize: '14px' }}>Connected</div>
                                        <div style={{ fontSize: '12px', color: '#374151' }}>{googleEmail}</div>
                                    </div>
                                </div>
                                <button onClick={disconnectGoogle} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'white', border: '1px solid #fca5a5', borderRadius: '8px', color: '#ef4444', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                                    <Unlink size={14} /> Disconnect
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                                    Link your Google account to display real-time Search Console data — clicks, impressions, and CTR — directly on your site dashboard.
                                </p>
                                <button
                                    onClick={connectGoogle}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    <Link2 size={16} /> Connect Google Account
                                </button>
                                <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                                    Requires a Google Cloud project with Search Console API enabled. <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Open Cloud Console <ExternalLink size={10} style={{display:'inline'}}/></a>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
