import { sandboxedRender } from '@og-engine/sandbox';
import { PLATFORM_SIZES, type OGRequest, type OGTemplate } from '@og-engine/types';
import { buildCacheKey } from './cache-key.js';
import type { FontConfig } from './fonts.js';
import { coerceParams } from './params.js';
import { initWasm } from './wasm.js';

export interface RenderResult {
  buffer: Buffer;
  contentType: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
  cacheKey: string;
}

export async function render(
  req: OGRequest,
  template: OGTemplate,
  fonts: FontConfig[]
): Promise<RenderResult> {
  await initWasm();

  const { width, height } = PLATFORM_SIZES[req.size];
  const typedParams = coerceParams(req.params, template.schema);

  void fonts.length;

  await sandboxedRender(template, {
    ...typedParams,
    width,
    height,
    size: req.size
  });

  const placeholder = `Rendered template ${template.id} at ${width}x${height}`;

  return {
    buffer: Buffer.from(placeholder),
    contentType: 'image/png',
    width,
    height,
    cacheKey: await buildCacheKey(req, template.version)
  };
}
