import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../services/api';

export default function AdminSites() {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const fetchSites = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await adminApi.sites({ search });
            setSites(data.sites?.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load sites.');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchSites();
    }, [fetchSites]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this site and all related data?')) return;
        try {
            await adminApi.deleteSite(id);
            fetchSites();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed.');
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sites</h2>

            <input
                type="text"
                placeholder="Search sites..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input mb-4"
            />

            {error && <div className="text-red-600 mb-4">{error}</div>}

            {loading ? (
                <div className="text-gray-500">Loading...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Domain</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Owner</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sites.map((site) => (
                                <tr key={site.id}>
                                    <td className="px-6 py-4 text-gray-900">{site.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{site.domain}</td>
                                    <td className="px-6 py-4 text-gray-600">{site.user?.email}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDelete(site.id)}
                                            className="text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sites.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No sites found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
