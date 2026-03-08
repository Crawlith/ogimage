import dark from '../../../templates/free/dark';
import minimal from '../../../templates/free/minimal';
import sunset from '../../../templates/free/sunset';
import glass from '../../../templates/pro/glass';
import editorial from '../../../templates/pro/editorial';
import type {
  CacheAdapter,
  OGTemplate,
  PlatformAdapter,
  StorageAdapter,
  TemplateRegistryAdapter
} from '@og-engine/types';

import { OGEngineError } from '@og-engine/types';

const registryData = new Map<string, OGTemplate>([
  [sunset.id, sunset as unknown as OGTemplate],
  [minimal.id, minimal as unknown as OGTemplate],
  [dark.id, dark as unknown as OGTemplate],
  [glass.id, glass as unknown as OGTemplate],
  [editorial.id, editorial as unknown as OGTemplate]
]);

/**
 * Creates a storage adapter backed by Cloudflare R2.
 *
 * @param bucket - The R2 bucket instance from the worker environment.
 * @param publicBaseUrl - Public base URL for served assets.
 * @returns A Cloudflare R2 storage adapter.
 */
export const cloudflareStorage = (bucket: R2Bucket, publicBaseUrl: string): StorageAdapter => ({
  async get(key) {
    const object = await bucket.get(key);
    if (!object) {
      return null;
    }
    return new Uint8Array(await object.arrayBuffer());
  },
  async put(key, value, options) {
    await bucket.put(key, value, {
      httpMetadata: { contentType: options?.contentType ?? 'image/png' }
    });
  },
  async delete(key) {
    await bucket.delete(key);
  },
  url(key) {
    return `${publicBaseUrl}/${key}`;
  }
});

/**
 * Creates a cache adapter backed by Cloudflare KV.
 *
 * @param kv - The KV namespace instance from the worker environment.
 * @returns A Cloudflare KV cache adapter.
 */
export const cloudflareCache = (kv: KVNamespace): CacheAdapter => ({
  async get(key) {
    return kv.get(key);
  },
  async set(key, value, ttl) {
    await kv.put(key, value, ttl ? { expirationTtl: ttl } : undefined);
  },
  async delete(key) {
    await kv.delete(key);
  }
});

/**
 * Creates a template registry for Cloudflare Workers serving bundled templates.
 *
 * @returns An adapter that lists and retrieves statically bundled templates.
 */
export const cloudflareRegistry = (): TemplateRegistryAdapter => ({
  async list() {
    return [...registryData.values()].map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      author: template.author,
      version: template.version,
      tags: template.tags ?? [],
      supportedSizes: template.supportedSizes
    }));
  },
  async get(id) {
    const template = registryData.get(id);
    if (!template) {
      throw new OGEngineError(`Template not found: ${id}`, 'TEMPLATE_NOT_FOUND', 404);
    }
    return template;
  },
  async exists(id) {
    return registryData.has(id);
  }
});

/**
 * Environment bindings required for the Cloudflare platform adapter.
 */
export interface CloudflareBindings {
  /** KV namespace used for fast cache lookups. */
  KV: KVNamespace;
  /** R2 bucket used for binary image storage. */
  BUCKET: R2Bucket;
  /** Public base URL used to build absolute image links. */
  PUBLIC_BASE_URL: string;
}

/**
 * Factory for creating a Cloudflare-compatible platform adapter.
 *
 * @param bindings - Worker environment bindings.
 * @returns A platform adapter using R2 and KV.
 */
export function cloudflareAdapter(bindings: CloudflareBindings): PlatformAdapter {
  return {
    storage: cloudflareStorage(bindings.BUCKET, bindings.PUBLIC_BASE_URL),
    cache: cloudflareCache(bindings.KV),
    registry: cloudflareRegistry()
  };
}
