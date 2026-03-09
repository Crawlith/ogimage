import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('wasm runtime dispatch', () => {
  const originalProcess = globalThis.process;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'process', {
      value: originalProcess,
      configurable: true,
      writable: true
    });
  });

  it('uses node module in node runtime', async () => {
    const initNode = vi.fn(async () => {});
    const getNode = vi.fn(async () => class NodeResvg {});
    const initEdge = vi.fn(async () => {});
    const getEdge = vi.fn(async () => class EdgeResvg {});

    vi.doMock('./wasm-node.js', () => ({ initWasm: initNode, getResvg: getNode }));
    vi.doMock('./wasm-edge.js', () => ({ initWasm: initEdge, getResvg: getEdge }));

    const mod = await import('./wasm.js');
    await mod.initWasm();
    await mod.getResvg();

    expect(initNode).toHaveBeenCalledTimes(1);
    expect(getNode).toHaveBeenCalledTimes(1);
    expect(initEdge).not.toHaveBeenCalled();
    expect(getEdge).not.toHaveBeenCalled();
  });

  it('uses edge module when process is unavailable', async () => {
    Object.defineProperty(globalThis, 'process', {
      value: undefined,
      configurable: true,
      writable: true
    });

    const initNode = vi.fn(async () => {});
    const getNode = vi.fn(async () => class NodeResvg {});
    const initEdge = vi.fn(async () => {});
    const EdgeResvg = class {};
    const getEdge = vi.fn(async () => EdgeResvg);

    vi.doMock('./wasm-node.js', () => ({ initWasm: initNode, getResvg: getNode }));
    vi.doMock('./wasm-edge.js', () => ({ initWasm: initEdge, getResvg: getEdge }));

    const mod = await import('./wasm.js');
    await mod.initWasm();
    const Resvg = await mod.getResvg();

    expect(initEdge).toHaveBeenCalledTimes(1);
    expect(getEdge).toHaveBeenCalledTimes(1);
    expect(Resvg).toBe(EdgeResvg);
    expect(initNode).not.toHaveBeenCalled();
    expect(getNode).not.toHaveBeenCalled();
  });
});
