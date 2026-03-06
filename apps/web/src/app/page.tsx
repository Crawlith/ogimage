import { Zap, Shield, Share2, Github } from 'lucide-react';

export default function Home() {
    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Hero Section */}
            <section style={{
                padding: '8rem 2rem',
                textAlign: 'center',
                background: 'radial-gradient(circle at center, #1e1b4b 0%, #000000 70%)'
            }}>
                <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1.5rem' }} className="gradient-text">
                    og-engine
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', maxWidth: '600px', margin: '0 auto 3rem' }}>
                    Open-source, platform-agnostic social image generation engine.
                    Zero lock-in, fully extensible, and secure by default.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius)',
                        background: 'white',
                        color: 'black',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                    }}>
                        Get Started
                    </button>
                    <a href="https://github.com/og-engine/og-engine" style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600
                    }}>
                        <Github size={20} /> GitHub
                    </a>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <FeatureCard
                        icon={<Zap className="accent" />}
                        title="Fast"
                        description="Ultra-fast rendering using Satori and Resvg WASM. Perfect for Edge Runtimes."
                    />
                    <FeatureCard
                        icon={<Shield className="accent" />}
                        title="Secure"
                        description="Sandboxed template execution ensures no malicious code can access your infrastructure."
                    />
                    <FeatureCard
                        icon={<Share2 className="accent" />}
                        title="Agnostic"
                        description="Deploy anywhere: Cloudflare Workers, Vercel, Node.js, or Docker."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                <p>&copy; 2024 og-engine. Built with Satori & Resvg.</p>
            </footer>
        </main>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="glass" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ marginBottom: '1.5rem', color: '#3b82f6' }}>{icon}</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h3>
            <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{description}</p>
        </div>
    );
}
