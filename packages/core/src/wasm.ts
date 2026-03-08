/**
 * @file wasm.ts
 * @description Runtime-aware WASM bootstrap helpers for render dependencies.
 * @module @og-engine/core
 */

const isNodeRuntime =
  typeof process !== 'undefined' &&
  typeof process.versions !== 'undefined' &&
  typeof process.versions.node === 'string';

interface ResvgLike {
  render(): { asPng(): Uint8Array };
}

type ResvgConstructor = new (
  svg: string | Uint8Array,
  options?: { fitTo?: { mode: 'width'; value: number } }
) => ResvgLike;

/**
 * Initializes runtime-specific WASM dependencies.
 */
export async function initWasm(): Promise<void> {
  if (isNodeRuntime) {
    const mod = await import('./wasm-node.js');
    return mod.initWasm();
  }

  const mod = await import('./wasm-edge.js');
  return mod.initWasm();
}

/**
 * Resolves the Resvg constructor based on the runtime.
 */
export async function getResvg(): Promise<ResvgConstructor> {
  if (isNodeRuntime) {
    const mod = await import('./wasm-node.js');
    return mod.getResvg();
  }

  const mod = await import('./wasm-edge.js');
  return mod.getResvg();
}
