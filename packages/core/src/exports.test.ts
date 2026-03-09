import { describe, expect, it } from 'vitest';

describe('core entry exports', () => {
  it('exports public APIs from index and edge entrypoints', async () => {
    const index = await import('./index.js');
    const edge = await import('./edge.js');

    expect(typeof index.buildCacheKey).toBe('function');
    expect(typeof index.coerceParams).toBe('function');
    expect(typeof index.fetchImageAsDataUri).toBe('function');
    expect(typeof index.createHandler).toBe('function');
    expect(typeof index.render).toBe('function');
    expect(typeof index.getResvg).toBe('function');
    expect(typeof index.initWasm).toBe('function');

    expect(typeof edge.getResvg).toBe('function');
    expect(typeof edge.initWasm).toBe('function');
  });
});
