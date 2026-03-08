/**
 * @file handler.ts
 * @description Request handlers for OG image rendering and metadata generation.
 * @module @og-engine/core
 */

import {
  PLATFORM_SIZES,
  type MetaRequest,
  type MetaResponse,
  type OGRequest,
  type PlatformAdapter
} from '@og-engine/types';
import { buildCacheKey } from './cache-key.js';
import { getDefaultFonts, type FontConfig } from './fonts.js';
import { render } from './render.js';

/**
 * Dependency bundle for handler creation.
 */
export interface HandlerDeps {
  /** Platform adapter that provides registry, storage, and cache backends. */
  platform: PlatformAdapter;

  /** Optional preloaded fonts. Defaults are loaded when omitted. */
  fonts?: FontConfig[];
}

interface ImageHandlerResponse {
  buffer: Uint8Array;
  contentType: 'image/png' | 'image/jpeg';
  headers: Record<string, string>;
  fromCache: boolean;
}

interface OGHandler {
  handleImageRequest(req: OGRequest): Promise<ImageHandlerResponse>;
  handleMetaRequest(req: MetaRequest): Promise<MetaResponse>;
  preGenerate(req: OGRequest): Promise<void>;
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

/**
 * Creates image and metadata handlers for a given platform adapter.
 *
 * @param deps - Platform dependencies.
 * @returns Handler object with image, metadata, and pre-generation methods.
 */
export function createHandler(deps: HandlerDeps): OGHandler {
  const handler: OGHandler = {
    async handleImageRequest(req: OGRequest): Promise<ImageHandlerResponse> {
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

      void handler.preGenerate({ ...req, format: 'png' });
      return meta;
    },

    async preGenerate(req: OGRequest): Promise<void> {
      try {
        await handler.handleImageRequest(req);
      } catch {
        // best-effort background pre-generation
      }
    }
  };

  return handler;
}
