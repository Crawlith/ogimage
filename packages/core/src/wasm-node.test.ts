import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('wasm-node', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('initializes yoga once when default export is a function', async () => {
    const initYoga = vi.fn(async () => {});
    vi.doMock('yoga-wasm-web/auto', () => ({ default: initYoga }));

    const mod = await import('./wasm-node.js');
    await mod.initWasm();
    await mod.initWasm();

    expect(initYoga).toHaveBeenCalledTimes(1);
  });

  it('supports yoga module shape without callable init', async () => {
    vi.doMock('yoga-wasm-web/auto', () => ({ default: { noop: true } }));

    const mod = await import('./wasm-node.js');
    await expect(mod.initWasm()).resolves.toBeUndefined();
  });

  it('supports yoga module exposing named init fallback', async () => {
    const initYoga = vi.fn(async () => {});
    vi.doMock('yoga-wasm-web/auto', () => ({ default: undefined, init: initYoga }));

    const mod = await import('./wasm-node.js');
    await mod.initWasm();

    expect(initYoga).toHaveBeenCalledTimes(1);
  });

  it('returns Resvg constructor from @resvg/resvg-js', async () => {
    class FakeResvg {
      render() {
        return { asPng: () => new Uint8Array([1]) };
      }
    }

    vi.doMock('@resvg/resvg-js', () => ({ Resvg: FakeResvg }));

    const mod = await import('./wasm-node.js');
    const Resvg = await mod.getResvg();
    expect(Resvg).toBe(FakeResvg);
  });
});
