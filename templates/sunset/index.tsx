import type { OGTemplate } from '@og-engine/types';

const template: OGTemplate = {
  id: 'sunset',
  name: 'Sunset',
  description: 'Warm gradient template for articles and blog posts',
  author: 'og-engine',
  version: '1.0.0',
  tags: ['gradient', 'warm', 'blog', 'article'],
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
    title: { type: 'string', required: true, maxLength: 120 },
    subtitle: { type: 'text' },
    author: { type: 'string' },
    date: { type: 'string' }
  },
  render: (params) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        background: 'linear-gradient(to bottom right, #ff7e5f, #feb47b)',
        padding: '60px',
        color: 'white',
        fontFamily: 'Noto Sans'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
        <h1
          style={{
            fontSize: params.size === 'ig-story' ? '80px' : '96px',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '20px',
            textShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {params.title}
        </h1>
        {params.subtitle && (
          <p
            style={{
              fontSize: '32px',
              opacity: 0.9,
              maxWidth: '80%',
              lineHeight: 1.4
            }}
          >
            {params.subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          paddingTop: '30px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {params.author && (
            <span style={{ fontSize: '24px', fontWeight: 600 }}>{params.author}</span>
          )}
        </div>
        {params.date && <span style={{ fontSize: '24px', opacity: 0.8 }}>{params.date}</span>}
      </div>
    </div>
  ),
  preview: './preview.svg'
};

export default template;
