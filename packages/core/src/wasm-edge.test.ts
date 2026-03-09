import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('wasm-edge', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('initializes yoga/resvg once and fetches wasm binary URL', async () => {
    const initYoga = vi.fn(async () => {});
    const initResvg = vi.fn(async () => {});
    class FakeResvg {
      render() {
        return { asPng: () => new Uint8Array([2]) };
      }
    }

    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1]))));
    vi.doMock('yoga-wasm-web/auto', () => ({ default: initYoga }));
    vi.doMock('@resvg/resvg-wasm', () => ({ initWasm: initResvg, Resvg: FakeResvg }));

    const mod = await import('./wasm-edge.js');
    await mod.initWasm();
    await mod.initWasm();

    expect(initYoga).toHaveBeenCalledTimes(1);
    expect(initResvg).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm');

    const Resvg = await mod.getResvg();
    expect(Resvg).toBe(FakeResvg);
  });

  it('supports non-callable yoga initializer', async () => {
    const initResvg = vi.fn(async () => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1]))));
    vi.doMock('yoga-wasm-web/auto', () => ({ default: { noop: true } }));
    vi.doMock('@resvg/resvg-wasm', () => ({ initWasm: initResvg, Resvg: class {} }));

    const mod = await import('./wasm-edge.js');
    await expect(mod.initWasm()).resolves.toBeUndefined();
    expect(initResvg).toHaveBeenCalledTimes(1);
  });
});
