/**
 * @file edge.ts
 * @description Edge-specific entry point for @og-engine/core.
 * @module @og-engine/core/edge
 */

export { buildCacheKey } from './cache-key.js';
export { getDefaultFonts, loadFont } from './fonts.js';
export type { FontConfig } from './fonts.js';
export { createHandler } from './handler.js';
export type { HandlerDeps } from './handler.js';
export { coerceParams } from './params.js';
export { fetchImageAsDataUri, processImageParams } from './images.js';
export { render } from './render.js';
export type { RenderResult } from './render.js';
export { getResvg, initWasm } from './wasm-edge.js';
