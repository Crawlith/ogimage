import { describe, expect, it } from 'vitest';
import { OGEngineError, PLATFORM_SIZES } from '@og-engine/types';

describe('@og-engine/types runtime exports', () => {
  it('exposes canonical platform sizes', () => {
    expect(PLATFORM_SIZES.og.width).toBe(1200);
    expect(PLATFORM_SIZES.og.height).toBe(630);
    expect(PLATFORM_SIZES['twitter-og'].label).toContain('Twitter');
  });

  it('creates OGEngineError with code and status', () => {
    const error = new OGEngineError('boom', 'RENDER_FAILED', 424);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('OGEngineError');
    expect(error.message).toBe('boom');
    expect(error.code).toBe('RENDER_FAILED');
    expect(error.status).toBe(424);
  });

  it('uses default status 500 when omitted', () => {
    const error = new OGEngineError('oops', 'INTERNAL_ERROR');
    expect(error.status).toBe(500);
  });
});
