import { useState } from 'react';
import { Sparkles, Wand2, X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AiFixButton({ type, originalContent, onFix }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        // Simulator for now
        setTimeout(() => {
            let mockFix = "";
            if (type === 'title') mockFix = "The Ultimate Guide to On-Page SEO: Best Practices for 2026 | SEO Story";
            if (type === 'description') mockFix = "Learn how to optimize your website with our comprehensive On-Page SEO guide. Boost rankings, improve CTR, and dominate search results in 2026.";
            if (type === 'h1') mockFix = "Mastering On-Page SEO: A Step-by-Step Guide";

            setGeneratedContent(mockFix);
            setLoading(false);
            toast.success("AI fix generated!");
        }, 1500);
    };

    const handleApply = () => {
        onFix(generatedContent);
        setIsOpen(false);
        setGeneratedContent(null);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="ai-fix-btn"
                style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 8px', borderRadius: '4px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: '600'
                }}
            >
                <Wand2 size={12} /> Fix with AI
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'white', padding: '24px', borderRadius: '12px',
                        width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ background: '#f3e8ff', padding: '8px', borderRadius: '50%' }}>
                                    <Sparkles size={20} color="#9333ea" />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>AI Magic Fixer</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>ORIGINAL {type.toUpperCase()}</label>
                            <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '14px', color: '#334155' }}>
                                {originalContent || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Empty)</span>}
                            </div>
                        </div>

                        {generatedContent && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                                    ✨ AI PROPOSAL
                                </label>
                                <div style={{ padding: '12px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '6px', fontSize: '14px', color: '#6b21a8' }}>
                                    {generatedContent}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            {!generatedContent ? (
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    style={{
                                        padding: '10px 20px', background: '#9333ea', color: 'white',
                                        border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                    {loading ? 'Generating...' : 'Generate Magic Fix'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleGenerate}
                                        style={{
                                            padding: '10px 16px', background: 'white', color: '#64748b',
                                            border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                                        }}
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={handleApply}
                                        style={{
                                            padding: '10px 20px', background: '#16a34a', color: 'white',
                                            border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        <Check size={16} /> Apply Fix
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}
