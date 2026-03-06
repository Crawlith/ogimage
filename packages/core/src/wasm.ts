/**
 * @file wasm.ts
 * @description Runtime-aware WASM bootstrap helpers for render dependencies.
 * @module @og-engine/core
 */

const isNodeRuntime =
  typeof process !== 'undefined' &&
  typeof process.versions !== 'undefined' &&
  typeof process.versions.node === 'string';

/**
 * Initializes runtime-specific WASM dependencies.
 */
export async function initWasm(): Promise<void> {
  if (isNodeRuntime) {
    const mod = await import('./wasm-node.js');
    await mod.initWasm();
    return;
  }

  const mod = await import('./wasm-edge.js');
  await mod.initWasm();
}

interface ResvgLike {
  render(): { asPng(): Uint8Array };
}

/**
 * Runtime-agnostic Resvg constructor type used by the render pipeline.
 */
type ResvgConstructor = new (
  svg: string | Uint8Array,
  options?: { fitTo?: { mode: 'width'; value: number } }
) => ResvgLike;

/**
 * Resolves runtime-appropriate Resvg constructor.
 *
 * @returns Resvg class implementation for current runtime.
 */
export async function getResvg(): Promise<ResvgConstructor> {
  if (isNodeRuntime) {
    const { Resvg } = await import('@resvg/resvg-js');
    return Resvg as unknown as ResvgConstructor;
  }

  const { Resvg } = await import('@resvg/resvg-wasm');
  return Resvg as unknown as ResvgConstructor;
}
