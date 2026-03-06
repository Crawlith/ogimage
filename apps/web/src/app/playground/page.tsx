'use client';

import { useState } from 'react';
import { Share2, ExternalLink, Table } from 'lucide-react';

export default function PlaygroundPage() {
    const [url, setUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const handleInspect = () => {
        setPreviewUrl(url);
    };

    const parsedParams = () => {
        try {
            const urlObj = new URL(url, 'http://localhost');
            return Array.from(urlObj.searchParams.entries());
        } catch {
            return [];
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>URL Playground</h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.2rem' }}>
                    Paste an og-engine API URL to inspect its parameters and preview the result.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://og-engine.com/api/og?template=sunset&title=Hello..."
                            style={{
                                flexGrow: 1,
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius)',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            onClick={handleInspect}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius)',
                                background: '#3b82f6',
                                color: 'white',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Inspect
                        </button>
                    </div>
                </div>

                {previewUrl && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                        <div className="glass" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Share2 size={20} /> Preview
                            </h3>
                            <div style={{ aspectRatio: '1.91/1', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img
                                    src={previewUrl}
                                    alt="OG Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/1200x630/ef4444/FFFFFF?text=Preview+Failed';
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <a href={previewUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontSize: '0.9rem' }}>
                                    Open in new tab <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Table size={20} /> Parameters
                            </h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.5rem', opacity: 0.6 }}>Key</th>
                                        <th style={{ textAlign: 'left', padding: '0.5rem', opacity: 0.6 }}>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedParams().map(([key, value]) => (
                                        <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{key}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--muted-foreground)', wordBreak: 'break-all' }}>{value}</td>
                                        </tr>
                                    ))}
                                    {parsedParams().length === 0 && (
                                        <tr>
                                            <td colSpan={2} style={{ padding: '1rem', textAlign: 'center', opacity: 0.4 }}>No parameters found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
