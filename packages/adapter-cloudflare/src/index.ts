import dark from '@og-engine/template-dark';
import minimal from '@og-engine/template-minimal';
import sunset from '@og-engine/template-sunset';
import type {
  CacheAdapter,
  OGTemplate,
  PlatformAdapter,
  StorageAdapter,
  TemplateRegistryAdapter
} from '@og-engine/types';

const registryData = new Map<string, OGTemplate>([
  [sunset.id, sunset],
  [minimal.id, minimal],
  [dark.id, dark]
]);

export const cloudflareStorage = (bucket: R2Bucket, publicBaseUrl: string): StorageAdapter => ({
  async get(key) {
    const object = await bucket.get(key);
    if (!object) {
      return null;
    }
    return Buffer.from(await object.arrayBuffer());
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
      throw new Error(`Template not found: ${id}`);
    }
    return template;
  },
  async exists(id) {
    return registryData.has(id);
  }
});

export interface CloudflareBindings {
  KV: KVNamespace;
  BUCKET: R2Bucket;
  PUBLIC_BASE_URL: string;
}

export function cloudflareAdapter(bindings: CloudflareBindings): PlatformAdapter {
  return {
    storage: cloudflareStorage(bindings.BUCKET, bindings.PUBLIC_BASE_URL),
    cache: cloudflareCache(bindings.KV),
    registry: cloudflareRegistry()
  };
}
