import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';

export default function AdminSettings() {
    const [form, setForm] = useState({
        company_name: '',
        primary_color: '#3b82f6',
        report_footer: '',
        dataforseo_api_url: '',
        dataforseo_login: '',
        dataforseo_password: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await adminApi.settings();
                setForm({
                    company_name: data.settings.company_name || '',
                    primary_color: data.settings.primary_color || '#3b82f6',
                    report_footer: data.settings.report_footer || '',
                    dataforseo_api_url: data.settings.dataforseo_api_url || '',
                    dataforseo_login: data.settings.dataforseo_login || '',
                    dataforseo_password: data.settings.dataforseo_password === '********' ? '' : data.settings.dataforseo_password || '',
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load settings.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            const { data } = await adminApi.updateSettings(form);
            setMessage(data.message || 'Settings saved.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setMessage('');
        setError('');
        try {
            const { data } = await adminApi.testDataForSEO();
            setMessage(data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Test failed.');
        }
    };

    if (loading) return <div className="text-gray-500">Loading...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

            {message && <div className="text-green-600 mb-4">{message}</div>}
            {error && <div className="text-red-600 mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                        type="text"
                        value={form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        className="input"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                    <input
                        type="color"
                        value={form.primary_color}
                        onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                        className="h-10 w-20"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Footer</label>
                    <input
                        type="text"
                        value={form.report_footer}
                        onChange={(e) => setForm({ ...form, report_footer: e.target.value })}
                        className="input"
                    />
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">DataForSEO API</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                            <input
                                type="text"
                                value={form.dataforseo_api_url}
                                onChange={(e) => setForm({ ...form, dataforseo_api_url: e.target.value })}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                            <input
                                type="text"
                                value={form.dataforseo_login}
                                onChange={(e) => setForm({ ...form, dataforseo_login: e.target.value })}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={form.dataforseo_password}
                                onChange={(e) => setForm({ ...form, dataforseo_password: e.target.value })}
                                placeholder="Leave blank to keep unchanged"
                                className="input"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleTest}
                            className="btn-secondary"
                        >
                            Test Credentials
                        </button>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
