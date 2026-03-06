import { notFound } from 'next/navigation';
import { BookOpen, ChevronRight } from 'lucide-react';

const DOCS = {
    'getting-started': {
        title: 'Getting Started',
        content: `
# Getting Started

og-engine is a platform-agnostic social image generation motor. It allows you to create beautiful, dynamic Open Graph images using React/JSX.

## How it works

1.  **Templates**: You define templates using standard React components.
2.  **Schema**: Each template declares its input parameters (titles, images, colors).
3.  **API**: You request images by pointing to the template and passing parameters via query strings.
4.  **Rendering**: The engine renders your JSX to SVG using Satori, then to PNG using Resvg.

## Quick Installation

\`\`\`bash
git clone https://github.com/og-engine/og-engine.git
cd og-engine
pnpm install
pnpm dev
\`\`\`
`
    },
    'api-reference': {
        title: 'API Reference',
        content: `
# API Reference

The primary endpoint for generating images is \`/api/og\`.

## Query Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| \`template\` | string | The ID of the template to use (e.g., \`sunset\`). |
| \`size\` | string | The platform size (e.g., \`twitter-og\`). Default is \`og\`. |
| \`format\` | string | \`png\` or \`jpeg\`. Default is \`png\`. |
| \`quality\` | number | Output quality for JPEGs (1-100). |

## Custom Parameters

Any additional query parameters are passed directly to the template's render function based on its schema.
`
    },
    'limitations': {
        title: 'Limitations',
        content: `
# Known Limitations

Building templates for og-engine is slightly different from building for the web due to Satori's CSS engine.

### CSS Limitations
- **Flexbox only**: Use \`display: flex\` for layouts. CSS Grid is not supported.
- **No Absolute Positioning relative to body**: Use flex for centering.
- **No Filters**: \`blur\`, \`drop-shadow\`, etc., are not supported.
- **No Background Clip**: \`background-clip: text\` for gradient text effects is not supported.
- **Dimensions**: All elements must have explicit dimensions if not relying on flex growth.

### Technical Limitations
- **Bundle Size**: Templates must be kept under 50kb gzipped to ensure fast cold starts on Edge runtimes.
- **Execution Time**: The rendering process should complete within 50ms.
`
    }
};

export default function DocsPage({ params }: { params: { slug: string[] } }) {
    const slug = params.slug.join('/');
    const doc = DOCS[slug as keyof typeof DOCS];

    if (!doc) {
        notFound();
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '4rem' }}>
            <aside>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', opacity: 0.8 }}>
                    <BookOpen size={20} /> <span style={{ fontWeight: 600 }}>Documentation</span>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Object.entries(DOCS).map(([key, d]) => (
                        <a
                            key={key}
                            href={`/docs/${key}`}
                            style={{
                                textDecoration: 'none',
                                color: slug === key ? '#60a5fa' : 'inherit',
                                fontSize: '0.95rem',
                                fontWeight: slug === key ? 600 : 400,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            {d.title} {slug === key && <ChevronRight size={16} />}
                        </a>
                    ))}
                </nav>
            </aside>

            <article className="prose docs-content" style={{ color: '#e2e8f0', lineHeight: 1.7 }}>
                {/* 
                    In a real app, we'd use an MDX renderer. 
                    For now, we'll just render it as raw text with some basic styling 
                    to simulate the look.
                */}
                <pre style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0
                }}>
                    {doc.content}
                </pre>
            </article>
        </div>
    );
}
