import {
  PLATFORM_SIZES,
  type MetaRequest,
  type MetaResponse,
  type OGRequest,
  type PlatformAdapter
} from '@og-engine/types';
import { getDefaultFonts, type FontConfig } from './fonts.js';
import { buildCacheKey } from './cache-key.js';
import { render } from './render.js';

export interface HandlerDeps {
  platform: PlatformAdapter;
  fonts?: FontConfig[];
}

function buildOGImageUrl(req: MetaRequest): string {
  const params = new URLSearchParams({
    template: req.template,
    size: req.size,
    format: req.format === 'html' || req.format === 'json' ? 'png' : (req.format ?? 'png'),
    ...req.params
  });
  return `${req.baseUrl}/api/og?${params.toString()}`;
}

function getCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'max-age=31536000'
  };
}

export function createHandler(deps: HandlerDeps) {
  return {
    async handleImageRequest(req: OGRequest) {
      const template = await deps.platform.registry.get(req.template);
      const cacheKey = await buildCacheKey(req, template.version);
      const cachedUrl = await deps.platform.cache.get(cacheKey);

      if (cachedUrl) {
        const buffer = await deps.platform.storage.get(cacheKey);
        if (buffer) {
          return { buffer, contentType: 'image/png', headers: getCacheHeaders(), fromCache: true };
        }
      }

      const fonts = deps.fonts ?? (await getDefaultFonts());
      const result = await render(req, template, fonts);
      await deps.platform.storage.put(cacheKey, result.buffer, { contentType: result.contentType });
      await deps.platform.cache.set(cacheKey, deps.platform.storage.url(cacheKey));

      return {
        buffer: result.buffer,
        contentType: result.contentType,
        headers: getCacheHeaders(),
        fromCache: false
      };
    },

    async handleMetaRequest(req: MetaRequest): Promise<MetaResponse> {
      const { width, height } = PLATFORM_SIZES[req.size];
      const imageUrl = buildOGImageUrl(req);

      const meta: MetaResponse = {
        'og:image': imageUrl,
        'og:image:width': String(width),
        'og:image:height': String(height),
        'og:image:type': 'image/png',
        'twitter:card': 'summary_large_image',
        'twitter:image': imageUrl
      };

      void this.preGenerate({ ...req, format: 'png' });

      return meta;
    },

    async preGenerate(req: OGRequest): Promise<void> {
      try {
        await this.handleImageRequest(req);
      } catch {
        // no-op
      }
    }
  };
}
