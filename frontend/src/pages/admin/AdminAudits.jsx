import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../services/api';

export default function AdminAudits() {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const fetchAudits = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await adminApi.audits({ search });
            setAudits(data.audits?.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load audits.');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchAudits();
    }, [fetchAudits]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this audit?')) return;
        try {
            await adminApi.deleteAudit(id);
            fetchAudits();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed.');
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Audits</h2>

            <input
                type="text"
                placeholder="Search audits..."
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
                                <th className="px-6 py-3 font-medium text-gray-500">ID</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Site</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Owner</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {audits.map((audit) => (
                                <tr key={audit.id}>
                                    <td className="px-6 py-4 text-gray-900">#{audit.id}</td>
                                    <td className="px-6 py-4 text-gray-900">{audit.site?.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{audit.type || 'N/A'}</td>
                                    <td className="px-6 py-4 text-gray-600">{audit.site?.user?.email}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDelete(audit.id)}
                                            className="text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {audits.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No audits found.
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
