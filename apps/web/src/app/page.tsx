import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: 'calc(100vh - 48px)' }}>
      <section
        style={{
          minHeight: 'calc(100vh - 110px)',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '24px',
          padding: '40px 28px'
        }}
      >
        <div
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            padding: '40px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '20px'
          }}
        >
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.14em'
            }}
          >
            Open source · MIT · Self-hostable
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '64px',
              lineHeight: 1,
              maxWidth: '740px'
            }}
          >
            Social images that look handcrafted.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '680px', lineHeight: 1.45 }}>
            Build, preview, and deploy OG image templates with a fast typed engine and adapters for Node, Cloudflare,
            and Vercel.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <Link href="/preview" className="cta-btn" style={{ padding: '10px 14px', fontSize: '14px' }}>
              Open Editor
            </Link>
            <Link href="/templates" className="ghost-btn" style={{ padding: '10px 14px', fontSize: '14px' }}>
              Browse Templates
            </Link>
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              padding: '12px 14px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}
          >
            Live OG preview
          </div>
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <img src="/api/templates/sunset/preview" alt="Sunset template preview" style={{ width: '100%', borderRadius: 10 }} />
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                background: 'var(--bg-elevated)',
                padding: '12px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              GET /api/og?template=sunset&title=Launch%20Post
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
