import { useState } from 'react';

export default function AddSite() {
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://seostory.de/api/sites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = '/dashboard';
            } else {
                setError(data.message || 'Failed to add site');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f7fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <header style={{
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px 0'
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '0 24px'
                }}>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1a202c',
                        margin: 0
                    }}>
                        Add New Site
                    </h1>
                </div>
            </header>

            <main style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '32px 24px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '32px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    {error && (
                        <div style={{
                            background: '#fed7d7',
                            border: '1px solid #fc8181',
                            color: '#c53030',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '24px',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#2d3748',
                                marginBottom: '8px'
                            }}>
                                Site Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="My Awesome Website"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <p style={{
                                fontSize: '13px',
                                color: '#718096',
                                margin: '6px 0 0 0'
                            }}>
                                A friendly name to identify your site
                            </p>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#2d3748',
                                marginBottom: '8px'
                            }}>
                                Domain
                            </label>
                            <input
                                type="text"
                                value={formData.domain}
                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                placeholder="example.com"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <p style={{
                                fontSize: '13px',
                                color: '#718096',
                                margin: '6px 0 0 0'
                            }}>
                                Enter your domain without http:// or https://
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => window.location.href = '/dashboard'}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#e2e8f0',
                                    color: '#2d3748',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#cbd5e0'}
                                onMouseLeave={(e) => e.target.style.background = '#e2e8f0'}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: loading ? '#a0aec0' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) e.target.style.background = '#2563eb';
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading) e.target.style.background = '#3b82f6';
                                }}
                            >
                                {loading ? 'Adding...' : 'Add Site'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
