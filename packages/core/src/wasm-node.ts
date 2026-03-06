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
  const initMaybe: unknown = yoga.default ?? yoga;
  if (isInitFunction(initMaybe)) {
    await initMaybe();
  }

  initialized = true;
}
