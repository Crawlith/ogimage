'use client';

import { useState, useEffect, useMemo } from 'react';
import { Settings, Image as ImageIcon, Copy, ExternalLink, RefreshCw } from 'lucide-react';

const TEMPLATES = [
    { id: 'sunset', name: 'Sunset', params: ['title', 'subtitle', 'author', 'date'] },
    { id: 'dark', name: 'Dark', params: ['title', 'subtitle', 'accent', 'author'] },
    { id: 'minimal', name: 'Minimal', params: ['title', 'description', 'tag', 'theme'] }
];

const SIZES = [
    { id: 'og', name: 'Generic OG (1200x630)' },
    { id: 'twitter-og', name: 'Twitter (1200x628)' },
    { id: 'ig-post', name: 'Instagram Post (1080x1080)' },
    { id: 'ig-story', name: 'Instagram Story (1080x1920)' }
];

export default function PreviewPage() {
    const [templateId, setTemplateId] = useState('sunset');
    const [size, setSize] = useState('og');
    const [params, setParams] = useState<Record<string, string>>({
        title: 'Hello World',
        subtitle: 'This is a live preview of og-engine',
        author: 'Antigravity AI',
        date: '',
        accent: '#00D2FF',
        theme: 'dark'
    });
    const [timestamp, setTimestamp] = useState(0);

    useEffect(() => {
        setParams(prev => ({
            ...prev,
            date: new Date().toLocaleDateString()
        }));
        setTimestamp(Date.now());
    }, []);

    const currentTemplate = useMemo(() =>
        TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0],
        [templateId]);

    const previewUrl = useMemo(() => {
        const urlParams = new URLSearchParams({
            template: templateId,
            size,
            ...params,
            _t: timestamp.toString()
        });
        return `/api/og?${urlParams.toString()}`;
    }, [templateId, size, params, timestamp]);

    const handleParamChange = (key: string, value: string) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }} className="gradient-text">Preview Sandbox</h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>Real-time template testing and refinement</p>
                </div>
                <button
                    onClick={() => setTimestamp(Date.now())}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius)', background: 'var(--accent)', border: 'none', color: 'white',
                        cursor: 'pointer', fontWeight: 600
                    }}
                >
                    <RefreshCw size={18} /> Refresh
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', flexGrow: 1 }}>
                {/* Controls */}
                <aside className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Template</label>
                        <select
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--input)', color: 'white', border: '1px solid var(--border)' }}
                        >
                            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Size</label>
                        <select
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--input)', color: 'white', border: '1px solid var(--border)' }}
                        >
                            {SIZES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={16} /> Parameters
                        </h3>
                        {currentTemplate.params.map(key => (
                            <div key={key}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{key}</label>
                                {key === 'theme' ? (
                                    <select
                                        value={params[key] || ''}
                                        onChange={(e) => handleParamChange(key, e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--input)', color: 'white', border: '1px solid var(--border)' }}
                                    >
                                        <option value="light">light</option>
                                        <option value="dark">dark</option>
                                    </select>
                                ) : key === 'accent' ? (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="color"
                                            value={params[key] || '#00D2FF'}
                                            onChange={(e) => handleParamChange(key, e.target.value)}
                                            style={{ height: '40px', width: '40px', padding: 0, border: 'none', background: 'none' }}
                                        />
                                        <input
                                            type="text"
                                            value={params[key] || ''}
                                            onChange={(e) => handleParamChange(key, e.target.value)}
                                            style={{ flexGrow: 1, padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--input)', color: 'white', border: '1px solid var(--border)' }}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={params[key] || ''}
                                        onChange={(e) => handleParamChange(key, e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--input)', color: 'white', border: '1px solid var(--border)' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Preview Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass" style={{
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'auto',
                        padding: '2rem',
                        background: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uInnzJkZGRoYGBgmDRp0n9S3YhujB5BQCwY8UMJAlS9QE9PAX69P326vWAVAAAAAElFTkSuQmCC")'
                    }}>
                        <img
                            src={previewUrl}
                            alt="OG Preview"
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    <div className="glass" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ flexGrow: 1, background: 'var(--input)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {previewUrl}
                        </div>
                        <button
                            onClick={() => navigator.clipboard.writeText(window.location.origin + previewUrl)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <Copy size={20} />
                        </button>
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'white' }}
                        >
                            <ExternalLink size={20} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
