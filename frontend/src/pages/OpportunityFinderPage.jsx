import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Sparkles, TrendingUp, Info, Target, ArrowLeft, Clipboard, Check, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OpportunityFinderPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [step, setStep] = useState(0); // 0: Idle, 1: Mining, 2: Analyzing, 3: Done
    const [copied, setCopied] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        setStep(1);
        setResult(null);

        // Simulate "Mining" effect
        setTimeout(() => setStep(2), 1500);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/api/opportunities/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    keyword: data.keyword
                })
            });

            const dataRes = await res.json();
            if (dataRes.success) {
                setStep(3);
                setResult(dataRes.data);
                toast.success('Opportunity Analysis Complete!');
            } else {
                setStep(0);
                toast.error(dataRes.message || 'Analysis failed');
            }
        } catch (error) {
            console.error(error);
            setStep(0);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const copyPrompt = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.brief.prompt);
        setCopied(true);
        toast.success('Prompt copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    // Helper to determine color based on score (High score = Good opportunity)
    const getScoreColor = (score) => {
        if (score > 70) return '#10b981'; // Green (Easy)
        if (score > 40) return '#f59e0b'; // Yellow (Medium)
        return '#ef4444'; // Red (Hard)
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
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
                    <Sparkles size={28} color="#8b5cf6" /> Opportunity Finder
                </h1>
                <p style={{ color: '#64748b', margin: 0 }}>
                    Find "Blue Ocean" keywords and generate AI content strategies instantly.
                </p>
            </div>

            {/* Input Section */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <input
                            {...register('keyword', { required: true })}
                            placeholder="Enter a keyword (e.g., 'best running shoes for flat feet')"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '2px solid #e2e8f0',
                                fontSize: '18px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0 40px',
                            background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Search />}
                        Analyze Opportunity
                    </button>
                </form>

                {/* Loading Steps */}
                {loading && (
                    <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: step >= 1 ? '8px' : '0' }}>
                            {step >= 1 ? <Check size={16} color="#10b981" /> : <Loader2 size={16} className="animate-spin" />}
                            <span style={{ color: step >= 1 ? '#0f172a' : '#64748b' }}>Mining Google SERP Data...</span>
                        </div>
                        {step >= 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: step >= 2 ? '8px' : '0' }}>
                                {step >= 2 ? <Check size={16} color="#10b981" /> : <Loader2 size={16} className="animate-spin" />}
                                <span style={{ color: step >= 2 ? '#0f172a' : '#64748b' }}>Calculating Difficulty & Forum Weakness...</span>
                            </div>
                        )}
                        {step >= 2 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span style={{ color: '#64748b' }}>Generating Content Strategy...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Results Section */}
            {result && !loading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>

                    {/* Left: Metrics & Analysis */}
                    <div>
                        {/* Score Card */}
                        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>WIN PROBABILITY</h3>
                                <div style={{ fontSize: '48px', fontWeight: '800', color: getScoreColor(result.analysis.opportunity_score) }}>
                                    {result.analysis.opportunity_score}%
                                </div>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    background: getScoreColor(result.analysis.opportunity_score) + '20',
                                    color: getScoreColor(result.analysis.opportunity_score),
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: '700'
                                }}>
                                    {result.analysis.opportunity_score > 70 ? '💎 HIDDEN GEM' : (result.analysis.opportunity_score > 40 ? '⚖️ DOABLE' : '⛔ HARD')}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>Difficulty Score</div>
                                    <div style={{ fontSize: '20px', fontWeight: '600' }}>{result.analysis.difficulty_score}/100</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>Intent</div>
                                    <div style={{ fontSize: '20px', fontWeight: '600', textTransform: 'capitalize' }}>{result.analysis.intent}</div>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <Target size={20} color="#3b82f6" />
                                    <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Title Match</h4>
                                </div>
                                <p style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 4px 0', color: '#0f172a' }}>
                                    {result.analysis.title_matches}<span style={{ fontSize: '16px', color: '#94a3b8' }}>/10</span>
                                </p>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                                    Competitors optimized exactly for this keyword.
                                </p>
                            </div>

                            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <Users size={20} color="#ec4899" />
                                    <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Forum Weakness</h4>
                                </div>
                                <p style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 4px 0', color: '#0f172a' }}>
                                    {result.analysis.forum_count}<span style={{ fontSize: '16px', color: '#94a3b8' }}>/10</span>
                                </p>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                                    Forums (Quora/Reddit) in Top 10. Easy to beat!
                                </p>
                            </div>
                        </div>

                        {/* PAA & Related */}
                        {result.analysis.paa && result.analysis.paa.length > 0 && (
                            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#0f172a' }}>People Also Ask (Gold Mine)</h4>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', fontSize: '14px' }}>
                                    {result.analysis.paa.slice(0, 5).map((q, i) => (
                                        <li key={i} style={{ marginBottom: '8px' }}>{q.question}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.analysis.related && result.analysis.related.length > 0 && (
                            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#0f172a' }}>Related Searches</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {result.analysis.related.slice(0, 8).map((r, i) => (
                                        <span key={i} style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', color: '#475569' }}>
                                            {r.keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Content Strategy */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Strategy Card */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                <Sparkles size={24} fill="#facc15" color="#ca8a04" />
                                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Top-Tier SEO Strategy</h3>
                            </div>

                            {/* Angle */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Content Angle</div>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    background: '#7c3aed',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    fontSize: '14px'
                                }}>
                                    {result.strategy.angle}
                                </div>
                            </div>

                            {/* Title */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Golden Title</div>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                                        {result.strategy.title}
                                    </div>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(result.strategy.title); toast.success('Title copied!') }}
                                        style={{ position: 'absolute', right: '8px', top: '8px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                    >
                                        <Clipboard size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Meta */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Killer Meta Description</div>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', lineHeight: '1.5', color: '#334155' }}>
                                        {result.strategy.meta_description}
                                    </div>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(result.strategy.meta_description); toast.success('Meta copied!') }}
                                        style={{ position: 'absolute', right: '8px', top: '8px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                    >
                                        <Clipboard size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Outline */}
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Content Outline (H2)</div>
                                <div style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '16px' }}>
                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                                        {result.strategy.outline.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                        </div>

                        {/* Master Prompt Button */}
                        <div style={{ background: '#0f172a', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ color: 'white', fontWeight: '700', marginBottom: '4px' }}>Want AI to write this?</div>
                                <div style={{ color: '#94a3b8', fontSize: '13px' }}>Includes PAA + Strategy Data</div>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(result.prompt);
                                    setCopied(true);
                                    toast.success('Strategy Prompt Copied!');
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: copied ? '#10b981' : 'white',
                                    color: copied ? 'white' : '#0f172a',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {copied ? <Check size={16} /> : <Sparkles size={16} />}
                                {copied ? 'Copied' : 'Copy Master Prompt'}
                            </button>
                        </div>

                    </div>

                </div>
            )}
        </div>
    );
}

// Missing imports? Need Users icon.
// Let me update imports in the file creation call.
