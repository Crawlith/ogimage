import type { OGTemplate } from '@og-engine/types';

const schema = {
  title: { type: 'string', required: true, maxLength: 80, default: 'Building the New Internet' },
  category: { type: 'string', required: false, default: 'Feature' },
  author: { type: 'string', required: false, default: 'John Doe' },
  issue: { type: 'string', required: false, default: 'VOL 04' }
} as const;

const editorial: OGTemplate<typeof schema> = {
  id: 'editorial',
  name: 'Magazine Spread',
  description: 'High-end print magazine style with bold, asymmetric typography.',
  author: 'og-engine',
  version: '1.0.0',
  tags: ['premium', 'editorial', 'typography'],
  supportedSizes: ['twitter-og', 'facebook-og', 'linkedin-og', 'og'],
  schema,
  render: (params) => {
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#fdfcf0', // Creamy paper texture color
          padding: '60px',
          fontFamily: 'DM Serif Display',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Large Decorative Category */}
        <div
          style={{
            position: 'absolute',
            left: '-40px',
            bottom: '-20px',
            fontSize: '320px',
            fontWeight: 400,
            color: '#000000',
            opacity: 0.03,
            whiteSpace: 'nowrap',
            lineHeight: 1
          }}
        >
          {params.category?.toUpperCase() || 'OG'}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            zIndex: 10
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '2px solid #000',
              paddingBottom: '20px'
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.2em' }}>
              {params.category?.toUpperCase() ?? 'OG'}
            </span>
            <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.2em' }}>
              {params.issue}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              marginTop: '40px'
            }}
          >
            <h1
              style={{
                fontSize: '100px',
                lineHeight: 0.9,
                margin: 0,
                color: '#000',
                maxWidth: '850px',
                transform: 'translateX(-20px)' // Intentionally breaking the grid
              }}
            >
              {params.title}
            </h1>
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '1px solid #000',
              paddingTop: '20px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '14px',
                  color: '#666',
                  fontFamily: 'DM Sans',
                  marginBottom: '4px'
                }}
              >
                WRITTEN BY
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.1em' }}>
                {params.author?.toUpperCase() ?? 'STAFF'}
              </span>
            </div>

            <div
              style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'flex-end'
                }}
              >
                <span style={{ color: 'white', fontSize: '24px' }}>OG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default editorial;
