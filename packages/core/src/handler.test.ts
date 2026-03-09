import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OGRequest, OGTemplate, PlatformAdapter } from '@og-engine/types';

const buildCacheKey = vi.fn(async () => 'cache-key');
const getDefaultFonts = vi.fn(async () => [{ name: 'Default', data: new ArrayBuffer(4) }]);
const render = vi.fn(async () => ({
  buffer: Buffer.from([9, 9]),
  contentType: 'image/png' as const,
  width: 1200,
  height: 630,
  cacheKey: 'cache-key'
}));

vi.mock('./cache-key.js', () => ({ buildCacheKey }));
vi.mock('./fonts.js', () => ({ getDefaultFonts }));
vi.mock('./render.js', () => ({ render }));

function makePlatform(template: OGTemplate): PlatformAdapter {
  const storageMap = new Map<string, Uint8Array>();
  const cacheMap = new Map<string, string>();

  return {
    registry: {
      list: vi.fn(async () => []),
      exists: vi.fn(async () => true),
      get: vi.fn(async () => template)
    },
    storage: {
      get: vi.fn(async (key: string) => storageMap.get(key) ?? null),
      put: vi.fn(async (key: string, value: Uint8Array) => {
        storageMap.set(key, value);
      }),
      delete: vi.fn(async (key: string) => {
        storageMap.delete(key);
      }),
      url: vi.fn((key: string) => `https://cdn.example.com/${key}`)
    },
    cache: {
      get: vi.fn(async (key: string) => cacheMap.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        cacheMap.set(key, value);
      }),
      delete: vi.fn(async (key: string) => {
        cacheMap.delete(key);
      })
    }
  };
}

describe('createHandler', () => {
  const template: OGTemplate = {
    id: 't1',
    name: 'T1',
    description: 'd',
    author: 'a',
    version: '1.0.0',
    supportedSizes: ['og'],
    schema: {},
    render: () => ({ type: 'div' }) as never
  };

  const req: OGRequest = {
    template: 't1',
    size: 'og',
    params: { title: 'x' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached buffer when cache and storage both hit', async () => {
    const platform = makePlatform(template);
    await platform.cache.set('cache-key', 'https://cdn.example.com/cache-key');
    await platform.storage.put('cache-key', new Uint8Array([1, 2]), { contentType: 'image/png' });

    const { createHandler } = await import('./handler.js');
    const handler = createHandler({ platform });
    const result = await handler.handleImageRequest(req);

    expect(result.fromCache).toBe(true);
    expect(result.contentType).toBe('image/png');
    expect(result.buffer).toEqual(new Uint8Array([1, 2]));
    expect(render).not.toHaveBeenCalled();
  });

  it('renders and stores when cache misses or storage missing', async () => {
    const platform = makePlatform(template);
    await platform.cache.set('cache-key', 'https://cdn.example.com/cache-key');
    vi.mocked(platform.cache.set).mockClear();
    const { createHandler } = await import('./handler.js');

    const handler = createHandler({
      platform,
      fonts: [{ name: 'Provided', data: new ArrayBuffer(8) }]
    });

    const result = await handler.handleImageRequest(req);

    expect(result.fromCache).toBe(false);
    expect(render).toHaveBeenCalledTimes(1);
    expect(getDefaultFonts).not.toHaveBeenCalled();
    expect(platform.storage.put).toHaveBeenCalledTimes(1);
    expect(platform.cache.set).toHaveBeenCalledTimes(1);
  });

  it('loads default fonts when none are provided', async () => {
    const platform = makePlatform(template);
    const { createHandler } = await import('./handler.js');
    const handler = createHandler({ platform });

    await handler.handleImageRequest(req);

    expect(getDefaultFonts).toHaveBeenCalledTimes(1);
  });

  it('builds metadata and triggers pre-generation in background', async () => {
    const platform = makePlatform(template);
    const { createHandler } = await import('./handler.js');
    const handler = createHandler({ platform });

    const meta = await handler.handleMetaRequest({
      ...req,
      baseUrl: 'https://app.example.com',
      format: 'html'
    });

    expect(meta['og:image']).toContain('/api/og?');
    expect(meta['og:image']).toContain('format=png');
    expect(meta['og:image:width']).toBe('1200');
    expect(meta['og:image:height']).toBe('630');

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(render).toHaveBeenCalled();
  });

  it('builds metadata with default format path when format is omitted', async () => {
    const platform = makePlatform(template);
    const { createHandler } = await import('./handler.js');
    const handler = createHandler({ platform });

    const meta = await handler.handleMetaRequest({
      template: req.template,
      size: req.size,
      params: req.params,
      baseUrl: 'https://app.example.com'
    });

    expect(meta['og:image']).toContain('format=png');
  });

  it('swallows pre-generate errors', async () => {
    const brokenPlatform = makePlatform(template);
    brokenPlatform.registry.get = vi.fn(async () => {
      throw new Error('boom');
    });

    const { createHandler } = await import('./handler.js');
    const handler = createHandler({ platform: brokenPlatform });

    await expect(handler.preGenerate(req)).resolves.toBeUndefined();
  });
});
