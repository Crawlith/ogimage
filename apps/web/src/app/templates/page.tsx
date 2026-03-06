import Link from 'next/link';
import { API_BASE_URL } from '../../index';

interface Template {
    id: string;
    name: string;
    description: string;
    author: string;
    tags: string[];
    supportedSizes: string[];
}

async function getTemplates(): Promise<Template[]> {
    const res = await fetch(`${API_BASE_URL}/api/templates`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
}

export default async function TemplatesPage() {
    const templates = await getTemplates();

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Template Gallery</h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.2rem' }}>
                    Choose a professionally designed template to get started.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {templates.map((template) => (
                    <Link key={template.id} href={`/preview?template=${template.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="glass" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}>
                            <div style={{ aspectRatio: '1.91/1', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <img
                                    src={`/api/templates/${template.id}/preview`}
                                    alt={template.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/1200x630/000000/FFFFFF?text=' + template.name;
                                    }}
                                />
                            </div>
                            <div style={{ padding: '1.5rem', flexGrow: 1 }}>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {template.tags.map(tag => (
                                        <span key={tag} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{template.name}</h3>
                                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', marginBottom: '1rem' }}>{template.description}</p>
                                <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--muted)' }}>
                                    By {template.author}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
