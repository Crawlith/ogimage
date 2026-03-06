/**
 * @file index.ts
 * @description Public API surface for @og-engine/core.
 * @module @og-engine/core
 */

export { buildCacheKey } from './cache-key.js';
export { getDefaultFonts, loadFont } from './fonts.js';
export type { FontConfig } from './fonts.js';
export { createHandler } from './handler.js';
export type { HandlerDeps } from './handler.js';
export { coerceParams } from './params.js';
export { render } from './render.js';
export type { RenderResult } from './render.js';
export { getResvg, initWasm } from './wasm.js';
