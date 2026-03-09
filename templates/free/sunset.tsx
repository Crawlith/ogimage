import type { OGTemplate } from '@og-engine/types';

const template = {
  id: 'sunset',
  name: 'Sunset Editorial',
  description: 'Editorial newspaper-inspired composition with serif hierarchy',
  author: 'og-engine',
  version: '2.0.0',
  tags: ['editorial', 'serif', 'magazine', 'newsroom'],
  supportedSizes: [
    'twitter-og',
    'facebook-og',
    'linkedin-og',
    'og',
    'discord',
    'github',
    'whatsapp',
    'ig-post'
  ],
  schema: {
    title: { type: 'string', required: true, maxLength: 120, default: 'Editorial Title' },
    subtitle: { type: 'string', required: false, maxLength: 200, default: 'The editorial newspaper-inspired composition' },
    author: { type: 'string', required: false, default: '@og-engine' },
    tag: { type: 'string', required: false, default: 'TRENDING' },
    date: { type: 'string', required: false, default: 'OCTOBER 2024' }
  } as const,
  render: (params) => {
    const isStory = params.size === 'ig-story';
    const isCompact = params.size === 'whatsapp';

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0a0a0a',
          color: '#f5f0e8',
          padding: isCompact ? '20px' : isStory ? '64px' : '54px',
          fontFamily: 'DM Sans',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 80%, #ffffff 1px, transparent 1px)',
            backgroundSize: '6px 6px, 8px 8px'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              border: '1px solid #c0392b',
              color: '#c0392b',
              padding: isCompact ? '3px 8px' : '6px 12px',
              borderRadius: '999px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: isCompact ? 10 : 12,
              fontWeight: 500
            }}
          >
            {params.tag || 'Feature'}
          </div>
          <div style={{ fontSize: isCompact ? 10 : 12, opacity: 0.82 }}>{params.date || 'Today'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '10px' : '20px' }}>
          <div style={{ height: '2px', width: '100%', backgroundColor: '#c0392b' }} />

          <div
            style={{
              fontFamily: 'Playfair Display',
              fontWeight: 900,
              fontSize: isCompact ? 34 : isStory ? 96 : 72,
              lineHeight: 1.05,
              letterSpacing: '-0.02em'
            }}
          >
            {params.title}
          </div>

          <div style={{ height: '1px', width: '100%', backgroundColor: 'rgba(245,240,232,0.5)' }} />

          {params.subtitle ? (
            <div
              style={{
                fontFamily: 'DM Sans',
                fontSize: isCompact ? 14 : isStory ? 28 : 24,
                lineHeight: 1.35,
                maxWidth: '92%',
                opacity: 0.88
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
            borderTop: '1px solid rgba(245,240,232,0.3)',
            paddingTop: isCompact ? '8px' : '14px',
            zIndex: 2
          }}
        >
          <div
            style={{
              fontSize: isCompact ? 12 : 16,
              letterSpacing: '0.14em',
              textTransform: 'uppercase'
            }}
          >
            {params.author || 'Staff Writer'}
          </div>
          <div style={{ fontSize: isCompact ? 11 : 14, opacity: 0.75 }}>og-engine</div>
        </div>
      </div>
    );
  }
} satisfies OGTemplate;

export default template;
