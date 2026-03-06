import { sandboxedRender } from '@og-engine/sandbox';
import { PLATFORM_SIZES, type OGRequest, type OGTemplate } from '@og-engine/types';
import satori from 'satori';
import { buildCacheKey } from './cache-key.js';
import type { FontConfig } from './fonts.js';
import { coerceParams } from './params.js';
import { getResvg, initWasm } from './wasm.js';

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

  // 1. Coerce raw string params into typed params
  const typedParams = coerceParams(req.params, template.schema);

  // 2. Render JSX via template.render() inside sandbox
  const element = await sandboxedRender(template, {
    ...typedParams,
    width,
    height,
    size: req.size
  });

  // 3. Satori: JSX -> SVG
  const svg = await satori(element as any, {
    width,
    height,
    fonts
  });

  // 4. resvg: SVG -> PNG
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
