/**
 * @file index.ts
 * @description Public type contracts shared across og-engine packages.
 *
 * This module defines template schemas, rendering interfaces, platform adapter
 * contracts, and request/response payload types used throughout the monorepo.
 *
 * @module @og-engine/types
 */

/**
 * Canonical output size presets for supported social platforms.
 */
export const PLATFORM_SIZES = {
  'twitter-og': { width: 1200, height: 628, label: 'Twitter / X' },
  'facebook-og': { width: 1200, height: 630, label: 'Facebook OG' },
  'linkedin-og': { width: 1200, height: 627, label: 'LinkedIn' },
  'ig-post': { width: 1080, height: 1080, label: 'Instagram Post' },
  'ig-story': { width: 1080, height: 1920, label: 'Instagram Story' },
  discord: { width: 1280, height: 640, label: 'Discord' },
  whatsapp: { width: 400, height: 209, label: 'WhatsApp' },
  github: { width: 1280, height: 640, label: 'GitHub Social' },
  og: { width: 1200, height: 630, label: 'Generic OG (default)' }
} as const;

/**
 * Supported social output size identifier.
 */
export type PlatformSize = keyof typeof PLATFORM_SIZES;

/**
 * Allowed schema field definitions for template parameters.
 */
export type SchemaFieldType =
  | { type: 'string'; required?: boolean; default?: string; maxLength?: number }
  | { type: 'text'; required?: boolean; default?: string }
  | { type: 'image'; required?: boolean }
  | { type: 'color'; required?: boolean; default?: string }
  | { type: 'boolean'; required?: boolean; default?: boolean }
  | { type: 'enum'; required?: boolean; values: string[]; default?: string };

/**
 * Template parameter schema keyed by parameter name.
 */
export type TemplateSchema = Record<string, SchemaFieldType>;

/**
 * Derives strongly-typed render params from a template schema.
 */
export type InferParams<S extends TemplateSchema> = {
  [K in keyof S]: S[K] extends { type: 'string' }
    ? string
    : S[K] extends { type: 'text' }
      ? string
      : S[K] extends { type: 'color' }
        ? string
        : S[K] extends { type: 'boolean' }
          ? boolean
          : S[K] extends { type: 'image' }
            ? string | undefined
            : S[K] extends { type: 'enum'; values: infer V extends string[] }
              ? V[number]
              : never;
};

/**
 * JSX element type used by template render functions.
 */
export type JSXElement = JSX.Element;

/**
 * Size and platform context passed into template render functions.
 */
export interface RenderContext {
  /** Output image width in pixels. */
  width: number;

  /** Output image height in pixels. */
  height: number;

  /** Selected platform size key. */
  size: PlatformSize;
}

/**
 * Fully-typed OG template definition.
 */
export interface OGTemplate<S extends TemplateSchema = TemplateSchema> {
  /** Stable template identifier used in requests. */
  id: string;

  /** Human-readable template name. */
  name: string;

  /** Short description shown in template listings. */
  description: string;

  /** Template author or maintainer name. */
  author: string;

  /** Template version string (semver recommended). */
  version: string;

  /** Optional tag list used for filtering and discovery. */
  tags?: string[];

  /** Platforms/sizes this template supports. */
  supportedSizes: PlatformSize[];

  /** Parameter schema used for coercion and validation. */
  schema: S;

  /** Render function that returns a JSX tree for Satori. */
  render: (params: InferParams<S> & RenderContext) => JSXElement;

  /** Optional preview image URL/path. */
  preview?: string;
}

/**
 * Metadata shape used for listing templates without full render functions.
 */
export interface TemplateMetadata {
  /** Stable template identifier used in requests. */
  id: string;

  /** Human-readable template name. */
  name: string;

  /** Short description shown in template listings. */
  description: string;

  /** Template author or maintainer name. */
  author: string;

  /** Template version string (semver recommended). */
  version: string;

  /** Optional tags used for filtering and discovery. */
  tags: string[];

  /** Platforms/sizes this template supports. */
  supportedSizes: PlatformSize[];
}

/**
 * Binary storage adapter contract for rendered image assets.
 */
export interface StorageAdapter {
  /** Reads a binary object by storage key. */
  get(key: string): Promise<Buffer | null>;

  /** Writes a binary object by storage key. */
  put(key: string, value: Buffer, options?: { contentType?: string }): Promise<void>;

  /** Removes a binary object by storage key. */
  delete(key: string): Promise<void>;

  /** Builds a public URL for a storage key. */
  url(key: string): string;
}

/**
 * Cache adapter contract for key-value cache backends.
 */
export interface CacheAdapter {
  /** Returns a cached value for a key or null when absent. */
  get(key: string): Promise<string | null>;

  /** Stores a cache value with optional TTL in seconds. */
  set(key: string, value: string, ttl?: number): Promise<void>;

  /** Invalidates a cache value by key. */
  delete(key: string): Promise<void>;
}

/**
 * Registry adapter contract used to discover and load templates.
 */
export interface TemplateRegistryAdapter {
  /** Lists all available template metadata entries. */
  list(): Promise<TemplateMetadata[]>;

  /** Loads a concrete template by identifier. */
  get(id: string): Promise<OGTemplate>;

  /** Checks whether a template exists by identifier. */
  exists(id: string): Promise<boolean>;
}

/**
 * Platform-specific adapter grouping required dependencies.
 */
export interface PlatformAdapter {
  /** Binary storage backend implementation. */
  storage: StorageAdapter;

  /** Cache backend implementation. */
  cache: CacheAdapter;

  /** Template registry implementation. */
  registry: TemplateRegistryAdapter;
}

/**
 * Request payload for generating an OG image.
 */
export interface OGRequest {
  /** Template identifier to render. */
  template: string;

  /** Output size preset key. */
  size: PlatformSize;

  /** Raw string parameters from a request boundary. */
  params: Record<string, string>;

  /** Optional output format (defaults to PNG in core). */
  format?: 'png' | 'jpeg';

  /** Optional quality hint for lossy output formats. */
  quality?: number;

  /** Optional cache TTL in seconds. */
  ttl?: number;
}

/**
 * Request payload for generating metadata output instead of binary images.
 */
export type MetaRequest = Omit<OGRequest, 'format'> & {
  /** Metadata response format. */
  format?: 'json' | 'html';

  /** Absolute base URL used to build OG image links. */
  baseUrl: string;
};

/**
 * Open Graph and Twitter card metadata response fields.
 */
export interface MetaResponse {
  /** Absolute URL for the OG image. */
  'og:image': string;

  /** Image width in pixels as a string. */
  'og:image:width': string;

  /** Image height in pixels as a string. */
  'og:image:height': string;

  /** MIME type for the OG image. */
  'og:image:type': string;

  /** Twitter card style selector. */
  'twitter:card': 'summary_large_image' | 'summary';

  /** Absolute URL for Twitter image fallback. */
  'twitter:image': string;

  /** Additional metadata fields. */
  [key: string]: string;
}

declare global {
  namespace JSX {
    interface Element {
      readonly type?: unknown;
      readonly props?: unknown;
    }
  }
}
