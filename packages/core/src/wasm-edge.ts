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
