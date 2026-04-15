import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Database, TrendingUp, DollarSign, BarChart2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KeywordResearchPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [cached, setCached] = useState(false);
    const [locationQuery, setLocationQuery] = useState('');
    const [locations, setLocations] = useState([
        { code: 2840, name: 'United States (US)' },
        { code: 2826, name: 'United Kingdom (GB)' },
        { code: 2124, name: 'Canada (CA)' },
        { code: 2036, name: 'Australia (AU)' },
        { code: 2356, name: 'India (IN)' },
    ]);
    const [locationsLoading, setLocationsLoading] = useState(false);

    useEffect(() => {
        const loadLocations = async () => {
            setLocationsLoading(true);
            try {
                const res = await fetch('https://seostory.de/api/keywords/locations', {
                    headers: { Accept: 'application/json' },
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setLocations(data.data);
                }
            } catch (error) {
                console.error('Failed to load locations', error);
            } finally {
                setLocationsLoading(false);
            }
        };

        loadLocations();
    }, []);

    const filteredLocations = locations.filter((loc) =>
        loc.name.toLowerCase().includes(locationQuery.toLowerCase())
    );

    const onSubmit = async (data) => {
        setLoading(true);
        setResults(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('https://seostory.de/api/keywords/research', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    keyword: data.keyword,
                    location_code: Number.parseInt(data.location, 10) || 2840,
                    language_code: data.language
                })
            });

            const result = await res.json();
            if (result.success) {
                setResults(result.data);
                setCached(result.cached);
                if (result.cached) {
                    toast.success('Loaded from cache!');
                } else {
                    toast.success('Keywords fetched successfully!');
                }
            } else {
                toast.error(result.message || 'Failed to fetch keywords');
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const formatVolume = (vol) => {
        if (!vol) return '0';
        return vol.toLocaleString();
    };

    const getDifficultyColor = (kd) => {
        if (!kd) return '#94a3b8';
        if (kd < 30) return '#10b981'; // Easy
        if (kd < 50) return '#f59e0b'; // Medium
        if (kd < 70) return '#f97316'; // Hard
        return '#ef4444'; // Very Hard
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '16px'
                    }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={28} /> Keyword Research
                </h1>
                <p style={{ color: '#64748b', margin: 0 }}>
                    Discover high-potential keywords, analyze search volume, and check competition.
                </p>
            </div>

            {/* Search Box */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>
                            Seed Keyword
                        </label>
                        <input
                            {...register('keyword', { required: true })}
                            placeholder="e.g. digital marketing"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    <div style={{ width: '280px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>
                            Location {locationsLoading ? '(loading...)' : ''}
                        </label>
                        <input
                            type="text"
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                            placeholder="Search location..."
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                                marginBottom: '8px'
                            }}
                        />
                        <select
                            {...register('location')}
                            defaultValue="2840"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '16px'
                            }}
                        >
                            {filteredLocations.map((loc) => (
                                <option key={loc.code} value={loc.code}>
                                    {loc.name}
                                </option>
                            ))}
                        </select>
                        {filteredLocations.length === 0 && (
                            <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                                No locations found for "{locationQuery}"
                            </div>
                        )}
                    </div>

                    <div style={{ width: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>
                            Language
                        </label>
                        <select
                            {...register('language')}
                            defaultValue="en"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '16px'
                            }}
                        >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '12px 32px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            height: '48px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        Find Keywords
                    </button>
                </form>
            </div>

            {/* Results */}
            {results && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                            Results ({results.length})
                        </h2>
                        {cached && (
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#f0fdf4',
                                color: '#16a34a',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '500'
                            }}>
                                <Database size={14} /> Retrieved from cache
                            </span>
                        )}
                    </div>

                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#64748b' }}>Keyword</th>
                                        <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Volume</th>
                                        <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>CPC (USD)</th>
                                        <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>Competition</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '15px' }}>
                                            <td style={{ padding: '16px', fontWeight: '500', color: '#0f172a' }}>
                                                {item.keyword}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <TrendingUp size={16} color="#94a3b8" />
                                                    {formatVolume(item.keyword_info?.search_volume)}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>
                                                {item.keyword_info?.cpc ? `$${item.keyword_info.cpc}` : '-'}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '16px',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    background: getDifficultyColor(item.keyword_info?.competition_level === 'HIGH' ? 80 : item.keyword_info?.competition_level === 'MEDIUM' ? 50 : 20) + '20',
                                                    color: getDifficultyColor(item.keyword_info?.competition_level === 'HIGH' ? 80 : item.keyword_info?.competition_level === 'MEDIUM' ? 50 : 20)
                                                }}>
                                                    {item.keyword_info?.competition_level || 'UNKNOWN'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
