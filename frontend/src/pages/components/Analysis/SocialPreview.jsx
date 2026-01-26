import { useState } from 'react';
import { Facebook, Twitter, Linkedin, Search, Globe, Image as ImageIcon } from 'lucide-react';

export default function SocialPreview({ meta, url }) {
    const [activeTab, setActiveTab] = useState('facebook');

    // Extract Data
    const title = meta?.social_media_tags?.['og:title'] || meta?.title || 'No Title';
    const description = meta?.social_media_tags?.['og:description'] || meta?.description || 'No Description';
    const image = meta?.social_media_tags?.['og:image'];
    const domain = url ? new URL(url).hostname.replace('www.', '') : 'example.com';

    // Tabs
    const tabs = [
        { id: 'facebook', label: 'Facebook', icon: <Facebook size={16} /> },
        { id: 'twitter', label: 'Twitter', icon: <Twitter size={16} /> },
        { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={16} /> },
        { id: 'google', label: 'Google', icon: <Search size={16} /> },
    ];

    return (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} /> Social Previews
            </h3>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '8px 16px',
                            background: activeTab === tab.id ? '#3b82f6' : '#f1f5f9',
                            color: activeTab === tab.id ? 'white' : '#64748b',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Preview Container */}
            <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '12px', display: 'flex', justifyContent: 'center', border: '1px solid #e2e8f0' }}>

                {/* Facebook Preview */}
                {activeTab === 'facebook' && (
                    <div style={{ width: '100%', maxWidth: '500px', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #ddd' }}>
                        <PreviewImage src={image} height="260px" />
                        <div style={{ padding: '12px 16px', background: '#f0f2f5', borderTop: '1px solid #eee' }}>
                            <div style={{ fontSize: '12px', color: '#65676b', textTransform: 'uppercase', marginBottom: '4px' }}>{domain}</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#050505', marginBottom: '4px', lineHeight: '1.2' }}>{title}</div>
                            <div style={{ fontSize: '14px', color: '#65676b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</div>
                        </div>
                    </div>
                )}

                {/* Twitter Preview */}
                {activeTab === 'twitter' && (
                    <div style={{ width: '100%', maxWidth: '440px', background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #cfd9de' }}>
                        <PreviewImage src={image} height="220px" />
                        <div style={{ padding: '12px' }}>
                            <div style={{ fontSize: '15px', color: '#0f1419', fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
                            <div style={{ fontSize: '14px', color: '#536471', marginBottom: '4px' }}>{description}</div>
                            <div style={{ fontSize: '14px', color: '#536471' }}>{domain}</div>
                        </div>
                    </div>
                )}

                {/* LinkedIn Preview */}
                {activeTab === 'linkedin' && (
                    <div style={{ width: '100%', maxWidth: '500px', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' }}>
                        <PreviewImage src={image} height="260px" />
                        <div style={{ padding: '12px 16px', background: 'white' }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#000000e6', marginBottom: '4px', lineHeight: '1.4' }}>{title}</div>
                            <div style={{ fontSize: '12px', color: '#00000099' }}>{domain}</div>
                        </div>
                    </div>
                )}

                {/* Google Preview */}
                {activeTab === 'google' && (
                    <div style={{ width: '100%', maxWidth: '600px', background: 'white', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ width: '28px', height: '28px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={`https://www.google.com/s2/favicons?domain=${domain}`} alt="" style={{ width: '16px', height: '16px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '14px', color: '#202124' }}>{domain}</span>
                                <span style={{ fontSize: '12px', color: '#5f6368' }}>{url}</span>
                            </div>
                        </div>
                        <div style={{ fontSize: '20px', color: '#1a0dab', marginBottom: '4px', cursor: 'pointer', textDecoration: 'hover:underline' }}>{title}</div>
                        <div style={{ fontSize: '14px', color: '#4d5156', lineHeight: '1.58' }}>{description}</div>
                    </div>
                )}
            </div>

            {/* Warning if Image Missing */}
            {!image && activeTab !== 'google' && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#991b1b', display: 'flex', gap: '8px' }}>
                    <ImageIcon size={16} />
                    <span>Missing <b>og:image</b>! Your link will look broken when shared. Add an image meta tag to fix this.</span>
                </div>
            )}
        </div>
    );
}

const PreviewImage = ({ src, height }) => (
    <div style={{
        width: '100%',
        height: height,
        background: '#e2e8f0',
        backgroundImage: src ? `url(${src})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#94a3b8'
    }}>
        {!src && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={48} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>No Image</span>
            </div>
        )}
    </div>
);
