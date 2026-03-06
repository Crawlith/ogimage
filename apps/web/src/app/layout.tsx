import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'og-engine | Social Image Generation API',
    description: 'Open-source, platform-agnostic social image generation engine.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
