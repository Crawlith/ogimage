/**
 * @file render.ts
 * @description Core OG image render pipeline (template -> SVG -> PNG).
 * @module @og-engine/core
 */

import { PLATFORM_SIZES, type OGRequest, type OGTemplate } from '@og-engine/types';
import satori from 'satori';
import { buildCacheKey } from './cache-key.js';
import type { FontConfig } from './fonts.js';
import { processImageParams } from './images.js';
import { coerceParams } from './params.js';
import { getResvg, initWasm } from './wasm.js';


/**
 * Successful render output payload.
 */
export interface RenderResult {
  /** Encoded image buffer. */
  buffer: Buffer;

  /** Output MIME type. */
  contentType: 'image/png' | 'image/jpeg';

  /** Output width in pixels. */
  width: number;

  /** Output height in pixels. */
  height: number;

  /** Deterministic request cache key. */
  cacheKey: string;
}

/**
 * Renders an OG image from request data and a template.
 *
 * @param req - Request payload.
 * @param template - Template definition.
 * @param fonts - Satori font definitions.
 * @returns Rendered image data and metadata.
 */
export async function render(
  req: OGRequest,
  template: OGTemplate,
  fonts: FontConfig[]
): Promise<RenderResult> {
  await initWasm();

  const { width, height } = PLATFORM_SIZES[req.size];
  const typedParams = coerceParams(req.params, template.schema);
  const processedParams = await processImageParams(typedParams, template.schema);

  /**
   * Template rendering with a 50ms timeout.
   * This is inlined instead of a separate sandbox package for performance and simplicity.
   * Template renders are expected to be pure and fast.
   */
  const timeoutMs = 50;
  const element = await Promise.race([
    Promise.resolve().then(() => template.render({
      ...processedParams,
      width,
      height,
      size: req.size
    } as never)),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Template render timeout: ${template.id}`)), timeoutMs);
    })
  ]) as JSX.Element;

  if (!element || typeof element !== 'object') {
    throw new Error(`Template ${template.id} returned invalid JSX`);
  }

  const satoriInput = element as unknown as Parameters<typeof satori>[0];
  const svg = await satori(satoriInput, {
    width,
    height,
    fonts
  });

  const ResvgClass = await getResvg();
  const resvg = new ResvgClass(svg, {
    fitTo: { mode: 'width', value: width }
  });
  const png = resvg.render().asPng();

  return {
    buffer: Buffer.from(png),
    contentType: 'image/png',
    width,
    height,
    cacheKey: await buildCacheKey(req, template.version)
  };
}
