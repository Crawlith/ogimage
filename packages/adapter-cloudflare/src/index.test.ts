import { describe, expect, it, vi } from 'vitest';
import { OGEngineError, type OGTemplate } from '@og-engine/types';
import {
  cloudflareAdapter,
  cloudflareCache,
  cloudflareRegistry,
  cloudflareStorage
} from './index.js';

function makeTemplate(id: string): OGTemplate {
  return {
    id,
    name: id,
    description: `${id} description`,
    author: 'test',
    version: '1.0.0',
    supportedSizes: ['og'],
    schema: {},
    render: () => ({ type: 'div' }) as never
  };
}

describe('adapter-cloudflare', () => {
  it('cloudflareStorage supports get/put/delete/url', async () => {
    const bucket = {
      get: vi.fn(),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {})
    } as unknown as R2Bucket;

    vi.mocked(bucket.get).mockResolvedValueOnce(null);
    vi.mocked(bucket.get).mockResolvedValueOnce({
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer
    } as R2ObjectBody);

    const storage = cloudflareStorage(bucket, 'https://cdn.example.com');

    await expect(storage.get('a')).resolves.toBeNull();
    await expect(storage.get('a')).resolves.toEqual(new Uint8Array([1, 2, 3]));

    await storage.put('a', new Uint8Array([9]));
    expect(bucket.put).toHaveBeenCalledWith('a', new Uint8Array([9]), {
      httpMetadata: { contentType: 'image/png' }
    });

    await storage.put('b', new Uint8Array([8]), { contentType: 'image/jpeg' });
    expect(bucket.put).toHaveBeenCalledWith('b', new Uint8Array([8]), {
      httpMetadata: { contentType: 'image/jpeg' }
    });

    await storage.delete('a');
    expect(bucket.delete).toHaveBeenCalledWith('a');

    expect(storage.url('k')).toBe('https://cdn.example.com/k');
  });

  it('cloudflareCache forwards get/set/delete to KV with optional ttl', async () => {
    const kv = {
      get: vi.fn(async () => 'v1'),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {})
    } as unknown as KVNamespace;

    const cache = cloudflareCache(kv);

    await expect(cache.get('k')).resolves.toBe('v1');
    await cache.set('k', 'v2');
    expect(kv.put).toHaveBeenCalledWith('k', 'v2', undefined);

    await cache.set('k', 'v3', 120);
    expect(kv.put).toHaveBeenCalledWith('k', 'v3', { expirationTtl: 120 });

    await cache.delete('k');
    expect(kv.delete).toHaveBeenCalledWith('k');
  });

  it('cloudflareRegistry lists and resolves templates', async () => {
    const registry = cloudflareRegistry([makeTemplate('one'), makeTemplate('two')]);
    const list = await registry.list();

    expect(list.length).toBe(2);
    expect(list.every((item) => Array.isArray(item.tags))).toBe(true);

    const first = list[0];
    await expect(registry.exists(first.id)).resolves.toBe(true);
    await expect(registry.get(first.id)).resolves.toMatchObject({ id: first.id });
    await expect(registry.exists('missing')).resolves.toBe(false);
    await expect(registry.get('missing')).rejects.toBeInstanceOf(OGEngineError);
  });

  it('cloudflareAdapter wires storage/cache/registry', async () => {
    const bucket = {
      get: vi.fn(async () => null),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {})
    } as unknown as R2Bucket;

    const kv = {
      get: vi.fn(async () => null),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {})
    } as unknown as KVNamespace;

    const adapter = cloudflareAdapter({
      BUCKET: bucket,
      KV: kv,
      PUBLIC_BASE_URL: 'https://img.example.com',
      registry: cloudflareRegistry([makeTemplate('demo')])
    });

    await adapter.cache.set('a', 'b', 10);
    expect(kv.put).toHaveBeenCalledWith('a', 'b', { expirationTtl: 10 });

    await adapter.storage.put('x', new Uint8Array([1]), { contentType: 'image/png' });
    expect(bucket.put).toHaveBeenCalled();

    const list = await adapter.registry.list();
    expect(list.length).toBe(1);
  });

  it('cloudflareAdapter defaults to empty registry when none supplied', async () => {
    const bucket = {
      get: vi.fn(async () => null),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {})
    } as unknown as R2Bucket;

    const kv = {
      get: vi.fn(async () => null),
      put: vi.fn(async () => {}),
      delete: vi.fn(async () => {})
    } as unknown as KVNamespace;

    const adapter = cloudflareAdapter({
      BUCKET: bucket,
      KV: kv,
      PUBLIC_BASE_URL: 'https://img.example.com'
    });

    await expect(adapter.registry.list()).resolves.toEqual([]);
  });
});
