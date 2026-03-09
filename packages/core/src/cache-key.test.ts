import { describe, expect, it } from 'vitest';
import type { OGRequest } from '@og-engine/types';
import { buildCacheKey } from './cache-key.js';

describe('buildCacheKey', () => {
  it('builds deterministic key regardless of param order', async () => {
    const a: OGRequest = {
      template: 't1',
      size: 'og',
      params: { b: '2', a: '1' },
      format: 'png'
    };

    const b: OGRequest = {
      template: 't1',
      size: 'og',
      params: { a: '1', b: '2' },
      format: 'png'
    };

    const keyA = await buildCacheKey(a, '1.0.0');
    const keyB = await buildCacheKey(b, '1.0.0');

    expect(keyA).toMatch(/^[a-f0-9]{64}$/);
    expect(keyA).toBe(keyB);
  });

  it('uses default png format and template version in key material', async () => {
    const req: OGRequest = {
      template: 't1',
      size: 'og',
      params: { title: 'hello world' }
    };

    const keyV1 = await buildCacheKey(req, '1.0.0');
    const keyV2 = await buildCacheKey(req, '1.0.1');

    expect(keyV1).not.toBe(keyV2);
  });
});
