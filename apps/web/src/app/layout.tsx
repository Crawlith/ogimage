import type { Metadata } from 'next';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800']
});

const fontBody = Geist({
  subsets: ['latin'],
  variable: '--font-body'
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'og-engine | Social Image Generation API',
  description: 'Open-source, platform-agnostic social image generation engine.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
        <header className="top-nav">
          <div className="nav-left">
            <div className="logo-mark">OG</div>
            <span className="wordmark">og-engine</span>
          </div>
          <nav className="nav-center">
            <Link href="/templates">Templates</Link>
            <Link href="/preview">Editor</Link>
            <Link href="/docs/getting-started">Docs</Link>
            <Link href="/playground">Playground</Link>
          </nav>
          <div className="nav-right">
            <a href="https://github.com/og-engine/og-engine" target="_blank" rel="noreferrer" className="ghost-btn">
              ★ GitHub
            </a>
            <a href="https://github.com/og-engine/og-engine" target="_blank" rel="noreferrer" className="cta-btn">
              Self-host ↗
            </a>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <span>© og-engine · MIT License</span>
          <div>
            <a href="https://github.com/og-engine/og-engine" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://www.npmjs.com/" target="_blank" rel="noreferrer">
              npm
            </a>
            <Link href="/docs/getting-started">Docs</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
