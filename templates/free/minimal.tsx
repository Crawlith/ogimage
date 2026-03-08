import type { OGTemplate } from '@og-engine/types';

const schema = {
  title: { type: 'string', required: true, maxLength: 80, default: 'Minimalism in Design' },
  category: { type: 'string', required: false, default: 'DESIGN PHILOSOPHY' },
  author: { type: 'string', required: false, default: 'A. Hoffman' },
  site: { type: 'string', required: false, default: 'og-engine.org' },
  logo: { type: 'image', required: false },
  accent: { type: 'color', required: false, default: '#2563eb' },
  theme: { type: 'enum', values: ['light', 'dark'], default: 'light' }
} as const;

const template: OGTemplate<typeof schema> = {
  id: 'minimal',
  name: 'Minimal Swiss',
  description: 'Refined typographic composition with generous whitespace',
  author: 'og-engine',
  version: '2.0.0',
  tier: 'free',
  tags: ['minimal', 'swiss', 'typography'],
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
  schema,
  render: (params) => {
    const isDark = params.theme === 'dark';
    const bg = isDark ? '#111111' : '#ffffff';
    const text = isDark ? '#f4f4f4' : '#111111';
    const secondary = isDark ? '#999999' : '#666666';
    const isCompact = params.size === 'whatsapp';

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: bg,
          color: text,
          padding: isCompact ? '24px' : '64px',
          fontFamily: 'DM Sans'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: isCompact ? '34px' : '64px' }}>
          {params.logo ? (
            <img
              src={params.logo}
              style={{
                width: 'auto',
                height: isCompact ? '28px' : '54px',
                objectFit: 'contain'
              }}
            />
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '8px' : '16px' }}>
          <div
            style={{
              color: params.accent || '#2563eb',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              fontSize: isCompact ? 10 : 14,
              fontWeight: 500
            }}
          >
            {params.category || 'Category'}
          </div>

          <div
            style={{
              fontFamily: 'Instrument Serif',
              fontStyle: 'italic',
              fontSize: isCompact ? 38 : params.size === 'ig-story' ? 110 : 88,
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              maxWidth: '94%'
            }}
          >
            {params.title}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: isCompact ? 12 : 18, color: secondary }}>{params.author || 'Unknown author'}</div>
          <div style={{ fontSize: isCompact ? 12 : 18, color: secondary }}>{params.site || 'og-engine'}</div>
        </div>
      </div>
    );
  }
};

export default template;
