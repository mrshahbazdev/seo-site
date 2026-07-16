import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';

const statCards = [
    { key: 'users', label: 'Users', color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'sites', label: 'Sites', color: 'text-green-600', bg: 'bg-green-50' },
    { key: 'audits', label: 'Audits', color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'issues', label: 'Issues', color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'pending_issues', label: 'Pending Issues', color: 'text-red-600', bg: 'bg-red-50' },
    { key: 'api_costs', label: 'API Costs', color: 'text-teal-600', bg: 'bg-teal-50' },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await adminApi.dashboard();
                setStats(data.stats);
            } catch (err) {
                console.error('Admin dashboard error:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="text-gray-500">Loading...</div>;
    if (error) return <div className="text-red-600">{error}</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map(({ key, label, color, bg }) => (
                    <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.[key] ?? 0}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${bg}`}>
                                <span className={`block w-6 h-6 rounded-full ${color.replace('text-', 'bg-')}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
