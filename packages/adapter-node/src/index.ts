import { promises as fs } from 'node:fs';
import path from 'node:path';
import dark from '../../../templates/free/dark.js';
import minimal from '../../../templates/free/minimal.js';
import sunset from '../../../templates/free/sunset.js';
import glass from '../../../templates/pro/glass.js';
import editorial from '../../../templates/pro/editorial.js';
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
 * Creates a template registry that serves built-in templates from memory.
 *
 * @returns An adapter that lists and retrieves statically bundled templates.
 */
export const staticRegistry = (): TemplateRegistryAdapter => ({
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
 * Creates a storage adapter that persists files to the local filesystem.
 *
 * @param dir - Root directory for storage.
 * @param baseUrl - Base URL for generating public file links.
 * @returns A Node.js filesystem storage adapter.
 */
export const fileSystemStorage = (dir: string, baseUrl: string): StorageAdapter => ({
  async get(key) {
    try {
      return await fs.readFile(path.join(dir, key));
    } catch {
      return null;
    }
  },
  async put(key, value) {
    const filepath = path.join(dir, key);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, value);
  },
  async delete(key) {
    await fs.unlink(path.join(dir, key)).catch(() => undefined);
  },
  url(key) {
    return `${baseUrl}/${key}`;
  }
});

/**
 * Creates a lightweight in-memory cache adapter.
 *
 * @returns A cache adapter backed by a local Map.
 */
export const memoryCache = (): CacheAdapter => {
  const store = new Map<string, { value: string; expiresAt?: number }>();
  return {
    async get(key) {
      const entry = store.get(key);
      if (!entry) {
        return null;
      }
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, ttl) {
      store.set(key, { value, expiresAt: ttl ? Date.now() + ttl * 1000 : undefined });
    },
    async delete(key) {
      store.delete(key);
    }
  };
};

/**
 * Configuration options for the Node.js platform adapter.
 */
export interface NodeAdapterOptions {
  /** Root directory for cached images. Defaults to './.og-cache'. */
  storageDir?: string;
  /** Base URL used to build absolute image links. */
  baseUrl?: string;
  /** Optional Redis connection string (not implemented in v1). */
  redisUrl?: string;
}

/**
 * Factory for creating a Node.js-compatible platform adapter.
 *
 * @param options - Configuration overrides.
 * @returns A platform adapter using filesystem storage and memory cache.
 */
export function nodeAdapter(options: NodeAdapterOptions = {}): PlatformAdapter {
  void options.redisUrl;
  return {
    storage: fileSystemStorage(options.storageDir ?? './.og-cache', options.baseUrl ?? ''),
    cache: memoryCache(),
    registry: staticRegistry()
  };
}
