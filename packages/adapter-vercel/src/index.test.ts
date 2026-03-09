import { describe, expect, it, vi } from 'vitest';
import type { PlatformAdapter } from '@og-engine/types';

const nodeAdapterSpy = vi.fn();

vi.mock('@og-engine/adapter-node', () => ({
  nodeAdapter: nodeAdapterSpy
}));

describe('adapter-vercel', () => {
  it('delegates to nodeAdapter with provided options', async () => {
    const platform = {
      storage: {} as PlatformAdapter['storage'],
      cache: {} as PlatformAdapter['cache'],
      registry: {} as PlatformAdapter['registry']
    } as PlatformAdapter;

    nodeAdapterSpy.mockReturnValue(platform);

    const { vercelAdapter } = await import('./index.js');
    const result = vercelAdapter({ storageDir: '/tmp/og', baseUrl: 'https://x.example' });

    expect(nodeAdapterSpy).toHaveBeenCalledWith({ storageDir: '/tmp/og', baseUrl: 'https://x.example' });
    expect(result).toBe(platform);
  });

  it('delegates with default empty options', async () => {
    const platform = {
      storage: {} as PlatformAdapter['storage'],
      cache: {} as PlatformAdapter['cache'],
      registry: {} as PlatformAdapter['registry']
    } as PlatformAdapter;

    nodeAdapterSpy.mockReturnValue(platform);

    const { vercelAdapter } = await import('./index.js');
    const result = vercelAdapter();

    expect(nodeAdapterSpy).toHaveBeenCalledWith({});
    expect(result).toBe(platform);
  });
});
