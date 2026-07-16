import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../services/api';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await adminApi.users({ search });
            setUsers(data.users?.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const toggleAdmin = async (user) => {
        try {
            await adminApi.updateUser(user.id, { is_admin: !user.is_admin });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this user?')) return;
        try {
            await adminApi.deleteUser(id);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed.');
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Users</h2>

            <input
                type="text"
                placeholder="Search users..."
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
                                <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Admin</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleAdmin(user)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                user.is_admin
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {user.is_admin ? 'Yes' : 'No'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No users found.
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
