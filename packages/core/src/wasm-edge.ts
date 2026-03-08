/**
 * @file wasm-edge.ts
 * @description Edge-runtime WASM initialization for Yoga and Resvg.
 * @module @og-engine/core
 */

let initialized = false;

function isInitFunction(value: unknown): value is () => Promise<void> {
  return typeof value === 'function';
}

/**
 * Initializes WASM dependencies required for edge runtimes.
 */
export async function initWasm(): Promise<void> {
  if (initialized) {
    return;
  }

  const { default: initYogaMaybe } = await import('yoga-wasm-web/auto');
  if (isInitFunction(initYogaMaybe)) {
    await initYogaMaybe();
  }

  const { initWasm: initResvg } = await import('@resvg/resvg-wasm');
  await initResvg(fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'));

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
 * Resolves Wasm/Edge Resvg constructor.
 */
export async function getResvg(): Promise<ResvgConstructor> {
  const { Resvg } = await import('@resvg/resvg-wasm');
  return Resvg as unknown as ResvgConstructor;
}
