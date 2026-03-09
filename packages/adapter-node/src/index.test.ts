import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { OGEngineError, type OGTemplate } from '@og-engine/types';
import {
  fileSystemStorage,
  memoryCache,
  nodeAdapter,
  staticRegistry
} from './index.js';

function makeTemplate(id: string): OGTemplate {
  return {
    id,
    name: id,
    description: `${id} description`,
    author: 'test',
    version: '1.0.0',
    tier: 'free',
    supportedSizes: ['og'],
    schema: {},
    render: () => ({ type: 'div' }) as never
  };
}

describe('adapter-node', () => {
  it('staticRegistry lists and resolves templates', async () => {
    const registry = staticRegistry([makeTemplate('one'), makeTemplate('two')]);
    const list = await registry.list();

    expect(list.length).toBe(2);
    expect(list.every((item) => Array.isArray(item.tags))).toBe(true);

    const first = list[0];
    const template = await registry.get(first.id);
    expect(template.id).toBe(first.id);
    await expect(registry.exists(first.id)).resolves.toBe(true);
    await expect(registry.exists('__missing__')).resolves.toBe(false);
    await expect(registry.get('__missing__')).rejects.toBeInstanceOf(OGEngineError);
  });

  it('fileSystemStorage supports put/get/delete/url', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'og-node-storage-'));

    try {
      const storage = fileSystemStorage(dir, 'https://cdn.example.com');
      const key = 'nested/a.bin';
      const bytes = new Uint8Array([1, 2, 3]);

      await expect(storage.get('missing.bin')).resolves.toBeNull();

      await storage.put(key, bytes, { contentType: 'image/png' });
      await expect(storage.get(key)).resolves.toEqual(Buffer.from([1, 2, 3]));
      expect(storage.url(key)).toBe('https://cdn.example.com/nested/a.bin');

      await storage.delete(key);
      await expect(storage.get(key)).resolves.toBeNull();

      await expect(storage.delete('missing.bin')).resolves.toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('memoryCache supports set/get/delete and ttl expiry', async () => {
    const cache = memoryCache();

    await cache.set('a', '1');
    await expect(cache.get('a')).resolves.toBe('1');

    await cache.delete('a');
    await expect(cache.get('a')).resolves.toBeNull();

    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000);
    await cache.set('b', '2', 1);
    nowSpy.mockReturnValue(1_500);
    await expect(cache.get('b')).resolves.toBe('2');
    nowSpy.mockReturnValue(2_001);
    await expect(cache.get('b')).resolves.toBeNull();
    nowSpy.mockRestore();
  });

  it('nodeAdapter wires filesystem, memory cache, and provided registry', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'og-node-adapter-'));

    try {
      const registry = staticRegistry([makeTemplate('demo')]);
      const adapter = nodeAdapter({
        storageDir: dir,
        baseUrl: 'https://img.example.com',
        redisUrl: 'redis://unused',
        registry
      });

      await adapter.storage.put('k', new Uint8Array([9]), { contentType: 'image/png' });
      await expect(adapter.storage.get('k')).resolves.toEqual(Buffer.from([9]));
      expect(adapter.storage.url('k')).toBe('https://img.example.com/k');

      await adapter.cache.set('k', 'v');
      await expect(adapter.cache.get('k')).resolves.toBe('v');

      const list = await adapter.registry.list();
      expect(list.length).toBe(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('nodeAdapter defaults to empty registry when none supplied', async () => {
    const adapter = nodeAdapter();
    await expect(adapter.registry.list()).resolves.toEqual([]);
    await expect(adapter.registry.exists('anything')).resolves.toBe(false);
  });
});
