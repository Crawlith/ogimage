import { promises as fs } from 'node:fs';
import path from 'node:path';
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
      throw new Error(`Template not found: ${id}`);
    }
    return template;
  },
  async exists(id) {
    return registryData.has(id);
  }
});

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

export interface NodeAdapterOptions {
  storageDir?: string;
  baseUrl?: string;
  redisUrl?: string;
}

export function nodeAdapter(options: NodeAdapterOptions = {}): PlatformAdapter {
  void options.redisUrl;
  return {
    storage: fileSystemStorage(options.storageDir ?? './.og-cache', options.baseUrl ?? ''),
    cache: memoryCache(),
    registry: staticRegistry()
  };
}
