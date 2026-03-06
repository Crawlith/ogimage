import type { OGTemplate } from '@og-engine/types';

const template: OGTemplate = {
  id: 'dark',
  name: 'Dark Terminal',
  description: 'Terminal-inspired black canvas with mono typography and sharp accents',
  author: 'og-engine',
  version: '2.0.0',
  tags: ['terminal', 'hacker', 'mono', 'dark'],
  supportedSizes: [
    'twitter-og',
    'facebook-og',
    'linkedin-og',
    'og',
    'discord',
    'github',
    'whatsapp',
    'ig-post',
    'ig-story'
  ],
  schema: {
    title: { type: 'string', required: true, maxLength: 100 },
    subtitle: { type: 'string', required: false, maxLength: 200 },
    author: { type: 'string', required: false },
    context: { type: 'string', required: false },
    tag: { type: 'string', required: false },
    accent: { type: 'color', required: false, default: '#00ff88' }
  },
  render: (params) => {
    const accent = params.accent || '#00ff88';
    const isCompact = params.size === 'whatsapp';

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#000000',
          color: '#f0f0f0',
          padding: isCompact ? '20px' : '52px',
          fontFamily: 'JetBrains Mono',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.15,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: isCompact ? '12px 12px' : '18px 18px'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '8px' : '16px' }}>
          <div style={{ color: accent, fontSize: isCompact ? 12 : 18 }}>{`$/${params.context || 'workspace'}`}</div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: isCompact ? '8px' : '12px' }}>
            <div style={{ color: accent, fontSize: isCompact ? 28 : 64, lineHeight: 1 }}>{'>'}</div>
            <div
              style={{
                fontSize: isCompact ? 28 : params.size === 'ig-story' ? 86 : 64,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                fontWeight: 700,
                maxWidth: '90%'
              }}
            >
              {params.title}
            </div>
          </div>

          {params.subtitle ? (
            <div
              style={{
                marginLeft: isCompact ? '36px' : '76px',
                color: 'rgba(240,240,240,0.72)',
                fontSize: isCompact ? 12 : 22,
                lineHeight: 1.35,
                maxWidth: '84%'
              }}
            >
              {params.subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.22)',
            paddingTop: isCompact ? '8px' : '12px',
            fontSize: isCompact ? 11 : 16,
            zIndex: 2
          }}
        >
          <div style={{ color: 'rgba(240,240,240,0.85)' }}>{params.author || 'operator'}</div>
          <div style={{ display: 'flex', gap: isCompact ? '8px' : '14px', color: accent }}>
            <span>{params.tag || 'stable'}</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    );
  },
  preview: './preview.svg'
};

export default template;
