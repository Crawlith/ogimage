import type { OGTemplate } from '@og-engine/types';

const template: OGTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Simple and clean template',
  author: 'og-engine',
  version: '1.0.0',
  tags: ['minimal', 'docs'],
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
    description: { type: 'text' },
    logo: { type: 'image' },
    tag: { type: 'string' },
    theme: { type: 'enum', values: ['light', 'dark'], default: 'light' }
  },
  render: (params) => {
    const isDark = params.theme === 'dark';
    const bg = isDark ? '#000000' : '#ffffff';
    const fg = isDark ? '#ffffff' : '#000000';
    const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: bg,
          color: fg,
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          fontFamily: 'Noto Sans',
          justifyContent: 'space-between'
        }}
      >
        <div>
          {params.tag && (
            <div
              style={{
                display: 'inline-flex',
                padding: '8px 16px',
                borderRadius: '100px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: fg,
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '40px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {params.tag}
            </div>
          )}
          <h1
            style={{
              fontSize: '84px',
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
              maxWidth: '90%'
            }}
          >
            {params.title}
          </h1>
          {params.description && (
            <p
              style={{
                fontSize: '32px',
                color: muted,
                marginTop: '24px',
                lineHeight: 1.4,
                maxWidth: '80%'
              }}
            >
              {params.description}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
          {params.logo && (
            <img
              src={params.logo}
              alt="Logo"
              style={{
                height: '48px',
                width: 'auto'
              }}
            />
          )}
        </div>
      </div>
    );
  },
  preview: './preview.svg'
};

export default template;
