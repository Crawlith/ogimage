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

export type PlatformSize = keyof typeof PLATFORM_SIZES;

export type SchemaFieldType =
  | { type: 'string'; required?: boolean; default?: string; maxLength?: number }
  | { type: 'text'; required?: boolean; default?: string }
  | { type: 'image'; required?: boolean }
  | { type: 'color'; required?: boolean; default?: string }
  | { type: 'boolean'; required?: boolean; default?: boolean }
  | { type: 'enum'; required?: boolean; values: string[]; default?: string };

export type TemplateSchema = Record<string, SchemaFieldType>;

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

export type JSXElement = JSX.Element;

export interface RenderContext {
  width: number;
  height: number;
  size: PlatformSize;
}

export interface OGTemplate<S extends TemplateSchema = TemplateSchema> {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  tags?: string[];
  supportedSizes: PlatformSize[];
  schema: S;
  render: (params: InferParams<S> & RenderContext) => JSXElement;
  preview?: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  supportedSizes: PlatformSize[];
}

export interface StorageAdapter {
  get(key: string): Promise<Buffer | null>;
  put(key: string, value: Buffer, options?: { contentType?: string }): Promise<void>;
  delete(key: string): Promise<void>;
  url(key: string): string;
}

export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface TemplateRegistryAdapter {
  list(): Promise<TemplateMetadata[]>;
  get(id: string): Promise<OGTemplate>;
  exists(id: string): Promise<boolean>;
}

export interface PlatformAdapter {
  storage: StorageAdapter;
  cache: CacheAdapter;
  registry: TemplateRegistryAdapter;
}

export interface OGRequest {
  template: string;
  size: PlatformSize;
  params: Record<string, string>;
  format?: 'png' | 'jpeg';
  quality?: number;
  ttl?: number;
}

export type MetaRequest = Omit<OGRequest, 'format'> & {
  format?: 'json' | 'html';
  baseUrl: string;
};

export interface MetaResponse {
  'og:image': string;
  'og:image:width': string;
  'og:image:height': string;
  'og:image:type': string;
  'twitter:card': 'summary_large_image' | 'summary';
  'twitter:image': string;
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
