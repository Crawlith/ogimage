import { describe, expect, it } from 'vitest';
import { buildMetaUrl, buildOgUrl } from './index.js';

describe('sdk url builders', () => {
  it('builds an OG URL with defaults and param coercion', () => {
    const url = buildOgUrl({
      baseUrl: 'https://example.com',
      template: 'sunset',
      params: { title: 'Hello World', featured: true, views: 42 }
    });

    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/api/og');
    expect(parsed.searchParams.get('template')).toBe('sunset');
    expect(parsed.searchParams.get('size')).toBe('og');
    expect(parsed.searchParams.get('format')).toBe('png');
    expect(parsed.searchParams.get('title')).toBe('Hello World');
    expect(parsed.searchParams.get('featured')).toBe('true');
    expect(parsed.searchParams.get('views')).toBe('42');
  });

  it('builds an OG URL with explicit size and format', () => {
    const url = buildOgUrl({
      baseUrl: 'https://example.com',
      template: 'minimal',
      size: 'twitter-og',
      format: 'jpeg'
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get('size')).toBe('twitter-og');
    expect(parsed.searchParams.get('format')).toBe('jpeg');
  });

  it('builds a metadata URL with defaults', () => {
    const url = buildMetaUrl({
      baseUrl: 'https://example.com',
      template: 'sunset'
    });

    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/api/meta');
    expect(parsed.searchParams.get('template')).toBe('sunset');
    expect(parsed.searchParams.get('size')).toBe('og');
    expect(parsed.searchParams.get('format')).toBe('json');
  });

  it('builds a metadata URL with explicit html format and params', () => {
    const url = buildMetaUrl({
      baseUrl: 'https://example.com',
      template: 'editorial',
      size: 'linkedin-og',
      format: 'html',
      params: { title: 'A', score: 7 }
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get('size')).toBe('linkedin-og');
    expect(parsed.searchParams.get('format')).toBe('html');
    expect(parsed.searchParams.get('title')).toBe('A');
    expect(parsed.searchParams.get('score')).toBe('7');
  });
});
