import type { OGTemplate } from '@og-engine/types';

const schema = {
  title: { type: 'string', required: true, maxLength: 60, default: 'The Future of Edge Rendering' },
  subtitle: { type: 'string', required: false, maxLength: 120, default: 'Build social images 10x faster with og-engine.' },
  accent: { type: 'color', required: false, default: '#e8a020' },
  logo: { type: 'image', required: false }
} as const;

const glass: OGTemplate<typeof schema> = {
  id: 'glass',
  name: 'Glass SaaS',
  description: 'Premium layered depth with a clean SaaS aesthetic.',
  author: 'og-engine',
  version: '1.0.0',
  tags: ['premium', 'saas', 'modern'],
  supportedSizes: ['twitter-og', 'facebook-og', 'linkedin-og', 'og'],
  schema,
  render: (params) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#f9fafb',
          padding: '60px',
          position: 'relative',
          fontFamily: 'DM Sans'
        }}
      >
        {/* Accent Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${params.accent}, #000000)`
          }}
        />

        {/* Decorative Circles */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '200px',
            background: `${params.accent}15`,
            filter: 'blur(60px)'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 10 }}>
          {params.logo && (
            <img 
              src={params.logo} 
              style={{ width: '48px', height: '48px', borderRadius: '8px' }} 
            />
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              gap: '16px'
            }}
          >
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 700,
                color: '#111827',
                margin: 0,
                fontFamily: 'Bricolage Grotesque',
                lineHeight: 1.1
              }}
            >
              {params.title}
            </h1>
            <p
              style={{
                fontSize: '24px',
                color: '#4b5563',
                margin: 0,
                lineHeight: 1.5
              }}
            >
              {params.subtitle}
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#9ca3af',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}
        >
          <span>Powered by</span>
          <span style={{ color: '#111827', fontWeight: 700 }}>og-engine</span>
        </div>
      </div>
    );
  }
};

export default glass;
