const isNodeRuntime =
  typeof process !== 'undefined' &&
  typeof process.versions !== 'undefined' &&
  typeof process.versions.node === 'string';

export async function initWasm(): Promise<void> {
  if (isNodeRuntime) {
    const mod = await import('./wasm-node.js');
    await mod.initWasm();
    return;
  }

  const mod = await import('./wasm-edge.js');
  await mod.initWasm();
}

export async function getResvg() {
  if (isNodeRuntime) {
    const { Resvg } = await import('@resvg/resvg-js');
    return Resvg;
  }
  const { Resvg } = await import('@resvg/resvg-wasm');
  return Resvg;
}
