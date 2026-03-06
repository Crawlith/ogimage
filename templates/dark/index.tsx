import type { OGTemplate } from '@og-engine/types';

const template: OGTemplate = {
  id: 'dark',
  name: 'Dark',
  description: 'Dark neon template',
  author: 'og-engine',
  version: '1.0.0',
  tags: ['dark', 'neon', 'saas'],
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
    title: { type: 'string', required: true, maxLength: 120 },
    subtitle: { type: 'text' },
    accent: { type: 'color', default: '#00D2FF' },
    author: { type: 'string' }
  },
  render: (params) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        color: 'white',
        padding: '80px',
        fontFamily: 'Noto Sans',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Ambient Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '40%',
          height: '40%',
          backgroundColor: params.accent,
          filter: 'blur(150px)',
          opacity: 0.15,
          borderRadius: '100%'
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          zIndex: 10
        }}
      >
        <h1
          style={{
            fontSize: '96px',
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 1,
            margin: 0,
            background: `linear-gradient(to right, #ffffff, ${params.accent})`,
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}
        >
          {params.title}
        </h1>
        {params.subtitle && (
          <p
            style={{
              fontSize: '32px',
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              maxWidth: '800px',
              margin: '20px 0 0 0'
            }}
          >
            {params.subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '60px',
          left: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '100%',
            backgroundColor: params.accent,
            boxShadow: `0 0 12px ${params.accent}`
          }}
        />
        {params.author && (
          <span style={{ fontSize: '24px', fontWeight: 600, opacity: 0.9 }}>
            {params.author}
          </span>
        )}
      </div>
    </div>
  ),
  preview: './preview.svg'
};

export default template;
