'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Copy,
  ExternalLink,
  RefreshCw,
  Layout,
  Check,
  Github,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { templates } from '../templates';
import { PLATFORM_SIZES, type PlatformSize } from '@og-engine/types';

export default function EditorPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0].id);
  const [size, setSize] = useState<PlatformSize>('og');
  const [params, setParams] = useState<Record<string, string>>({});
  const [isCopying, setIsCopying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());

  const currentTemplate = useMemo(() =>
    templates.find(t => t.id === selectedTemplateId) || templates[0],
    [selectedTemplateId]);

  // Sync default params when template changes
  useEffect(() => {
    const defaults: Record<string, string> = {};
    Object.entries(currentTemplate.schema).forEach(([key, field]: [string, any]) => {
      if (field && typeof field === 'object' && 'default' in field && field.default !== undefined) {
        defaults[key] = String(field.default);
      } else {
        defaults[key] = '';
      }
    });
    setParams(defaults);
    setTimestamp(Date.now());
  }, [currentTemplate]);

  const previewUrl = useMemo(() => {
    const searchParams = new URLSearchParams({
      template: selectedTemplateId,
      size,
      ...params,
      _t: timestamp.toString()
    });
    return `/api/og?${searchParams.toString()}`;
  }, [selectedTemplateId, size, params, timestamp]);

  const handleParamChange = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleCopy = async () => {
    const fullUrl = window.location.origin + previewUrl;
    await navigator.clipboard.writeText(fullUrl);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);

    // Pre-warm cache
    fetch(previewUrl, { priority: 'low' }).catch(() => { });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflow: 'hidden' }}>
      {/* Left Panel - Control Center */}
      <aside style={{
        width: '380px',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <header style={{
          height: '48px',
          padding: '0 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'var(--accent)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'black', fontWeight: 'bold', fontSize: '10px' }}>OG</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold', letterSpacing: '-0.02em' }}>Engine</span>
          </div>
          <a href="https://github.com/og-engine/og-engine" target="_blank" rel="noreferrer" style={{ color: 'var(--text-tertiary)' }}>
            <Github size={18} />
          </a>
        </header>

        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Template Selection */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '10px', fontWeight: 'bold' }}>
              <Layout size={12} />
              <span>Template</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: selectedTemplateId === t.id ? 'var(--accent)' : 'var(--border-subtle)',
                    background: selectedTemplateId === t.id ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    boxShadow: selectedTemplateId === t.id ? '0 0 15px var(--accent-dim)' : 'none'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    background: 'var(--bg-overlay)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img src={`/api/templates/${t.id}/preview`} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
                  </div>
                  {selectedTemplateId === t.id && (
                    <div style={{ color: 'var(--accent)' }}>
                      <Check size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Dynamic Form */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '10px', fontWeight: 'bold' }}>
              <Settings size={12} />
              <span>Configuration</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(currentTemplate.schema).map(([key, field]: [string, any]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>

                  {field.type === 'enum' ? (
                    <div style={{ display: 'flex', background: 'var(--bg-base)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      {field.values.map((val: any) => (
                        <button
                          key={val}
                          onClick={() => handleParamChange(key, val)}
                          style={{
                            flex: 1,
                            padding: '6px 0',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: params[key] === val ? 'var(--accent)' : 'transparent',
                            color: params[key] === val ? 'black' : 'var(--text-tertiary)',
                            fontWeight: params[key] === val ? '700' : '400'
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  ) : field.type === 'color' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="color"
                        value={params[key] || '#ffffff'}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', padding: 0 }}
                      />
                      <input
                        type="text"
                        value={params[key] || ''}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        style={{
                          flex: 1,
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0 12px',
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      />
                    </div>
                  ) : field.type === 'text' ? (
                    <textarea
                      value={params[key] || ''}
                      onChange={(e) => handleParamChange(key, e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        resize: 'none',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={params[key] || ''}
                        onChange={(e) => (field.type === 'string' && field.maxLength && e.target.value.length > field.maxLength) ? null : handleParamChange(key, e.target.value)}
                        style={{
                          width: '100%',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                      {field.type === 'string' && field.maxLength && (
                        <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                          {(params[key]?.length || 0)}/{field.maxLength}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Size Selector */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: '10px', fontWeight: 'bold' }}>
              <Monitor size={12} />
              <span>Output Size</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(PLATFORM_SIZES).map(([id, meta]) => (
                <button
                  key={id}
                  onClick={() => setSize(id as PlatformSize)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: size === id ? 'var(--accent)' : 'var(--border-subtle)',
                    background: size === id ? 'var(--bg-elevated)' : 'transparent',
                    color: size === id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.label}</div>
                  <div style={{ fontSize: '9px', opacity: 0.6 }}>{meta.width} × {meta.height}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>

      {/* Main Content - Preview Area */}
      <main style={{ flex: 1, background: 'var(--bg-base)', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(var(--bg-elevated) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.4
        }} />

        {/* Navigation Bar */}
        <nav style={{
          height: '48px',
          padding: '0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(12, 12, 14, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
              Live Preview
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setTimestamp(Date.now())}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: '6px' }}
              title="Refresh Preview"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: isCopying ? 'var(--success)' : 'var(--accent)',
                color: 'black'
              }}
            >
              {isCopying ? <Check size={16} /> : <Copy size={16} />}
              {isCopying ? 'Copied' : 'Copy URL'}
            </button>
          </div>
        </nav>

        {/* Workspace */}
        <div style={{ flex: 1, overflow: 'auto', padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 }}>
          <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Preview Image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: `${(PLATFORM_SIZES[size].height / PLATFORM_SIZES[size].width) * 100}%`,
                filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.8))'
              }}
            >
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--bg-surface)',
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uInnzJkZGRoYGBgmDRp0n9S3YhujB5BQCwY8UMJAlS9QE9PAX69P326vWAVAAAAAElFTkSuQmCC")' }} />

                <AnimatePresence mode="wait">
                  <motion.img
                    key={previewUrl}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={previewUrl}
                    alt="OG Image Preview"
                    onLoad={() => setIsLoading(false)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </AnimatePresence>

                {isLoading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyItems: 'center', background: 'rgba(20,20,22,0.5)', backdropFilter: 'blur(4px)' }}>
                    <RefreshCw className="animate-spin" style={{ color: 'var(--accent)', margin: 'auto' }} size={32} />
                  </div>
                )}
              </div>
            </div>

            {/* URL Display */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)' }}>GENERATED ENDPOINT</span>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--text-tertiary)', display: 'flex' }}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              <div style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                overflowX: 'auto'
              }}>
                <code style={{ fontSize: '13px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}${previewUrl}` : previewUrl}
                </code>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--border-default);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
