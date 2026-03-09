/**
 * @file wasm-node.ts
 * @description Node.js-specific WASM initialization for Yoga.
 * @module @og-engine/core
 */

let initialized = false;

function isInitFunction(value: unknown): value is () => Promise<void> {
  return typeof value === 'function';
}

/**
 * Initializes WASM dependencies required for Node.js rendering.
 */
export async function initWasm(): Promise<void> {
  if (initialized) {
    return;
  }

  const yoga = await import('yoga-wasm-web/auto');
  const initMaybe: unknown = yoga.default ?? (yoga as { init?: unknown }).init;
  if (isInitFunction(initMaybe)) {
    await initMaybe();
  }

  initialized = true;
}

interface ResvgLike {
  render(): { asPng(): Uint8Array };
}

type ResvgConstructor = new (
  svg: string | Uint8Array,
  options?: { fitTo?: { mode: 'width'; value: number } }
) => ResvgLike;

/**
 * Resolves Node.js Resvg constructor.
 */
export async function getResvg(): Promise<ResvgConstructor> {
  const { Resvg } = await import('@resvg/resvg-js');
  return Resvg as unknown as ResvgConstructor;
}
