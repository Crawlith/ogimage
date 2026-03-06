# og-engine — Claude Code Agent Task Document

> Full build spec for an open-source, platform-agnostic OG image generation engine.
> Every decision from the architecture session is captured here.
> Work through tasks in order. Each task has acceptance criteria — do not move on until they pass.

---

## Project Overview

**What:** An open-source social image generation API. Users point a URL at it, get back a PNG/JPEG. Social crawlers (Twitter, LinkedIn, Slack, iMessage, Facebook) fetch it and render rich preview cards.

**Primary deploy target:** Cloudflare Workers (Hono + KV + R2 + D1)
**Also must work on:** Vercel (Edge + Node), Railway/VPS (Node/Express), Docker

**Core design rules:**
- Zero platform lock-in — adapter pattern separates core from infrastructure
- Template system is extensible — OSS contributors add templates via Git PR
- Every template is sandboxed — no eval, no network, no filesystem access
- Cache is immutable — URL = cache key, pre-generation on metadata fetch
- Form-based editor UI with live debounced preview

---

## Monorepo Structure (create this exactly)

```
og-engine/
├── package.json                  ← pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── .github/
│   └── workflows/
│       ├── ci.yml                ← lint, typecheck, test
│       └── template-scan.yml     ← security scan for template PRs
├── packages/
│   ├── types/                    ← shared TypeScript interfaces (no deps)
│   ├── core/                     ← render pipeline (no platform code)
│   ├── sandbox/                  ← template execution sandbox
│   ├── adapter-cloudflare/       ← CF KV + R2 + D1 adapter
│   ├── adapter-vercel/           ← Vercel/S3/Redis adapter
│   └── adapter-node/             ← Node/Express/memory adapter
├── apps/
│   ├── worker-cf/                ← Cloudflare Workers entry point
│   ├── server-node/              ← Express entry point (Railway/Docker)
│   └── web/                      ← Next.js editor UI + docs
└── templates/
    ├── _base/                    ← base template type + helpers
    ├── sunset/                   ← built-in template #1
    ├── minimal/                  ← built-in template #2
    └── dark/                     ← built-in template #3
```

---

## TASK 1 — Monorepo Bootstrap

**Goal:** Working monorepo with TypeScript, linting, and build pipeline.

### Subtask 1.1 — Init workspace
- Init with `pnpm` workspaces
- Add `turbo.json` with pipelines: `build`, `dev`, `lint`, `typecheck`, `test`
- Root `package.json` with scripts: `dev`, `build`, `lint`, `format`
- `.gitignore` covering node_modules, dist, .wrangler, .next, .env*
- `.nvmrc` pinned to Node 20

### Subtask 1.2 — TypeScript base config
- Root `tsconfig.base.json`:
  - `strict: true`
  - `moduleResolution: bundler`
  - `target: ES2022`
  - `jsx: react-jsx`
- Each package extends base config

### Subtask 1.3 — Linting & formatting
- ESLint flat config (eslint.config.mjs) at root
- Prettier config
- Add eslint rules: `no-eval`, `no-new-func`, `no-implied-eval`
- Husky + lint-staged for pre-commit

### Subtask 1.4 — CI workflow
- `.github/workflows/ci.yml`: on push + PR, run typecheck → lint → test → build
- Node 20, pnpm cache

**Acceptance:** `pnpm build` runs without errors across all packages.

---

## TASK 2 — packages/types

**Goal:** All shared TypeScript interfaces. No runtime code. No dependencies.

### Subtask 2.1 — Platform size definitions

```typescript
// Every supported social platform size
export const PLATFORM_SIZES = {
  'twitter-og':   { width: 1200, height: 628,  label: 'Twitter / X' },
  'facebook-og':  { width: 1200, height: 630,  label: 'Facebook OG' },
  'linkedin-og':  { width: 1200, height: 627,  label: 'LinkedIn' },
  'ig-post':      { width: 1080, height: 1080, label: 'Instagram Post' },
  'ig-story':     { width: 1080, height: 1920, label: 'Instagram Story' },
  'discord':      { width: 1280, height: 640,  label: 'Discord' },
  'whatsapp':     { width: 400,  height: 209,  label: 'WhatsApp' },
  'github':       { width: 1280, height: 640,  label: 'GitHub Social' },
  'og':           { width: 1200, height: 630,  label: 'Generic OG (default)' },
} as const;

export type PlatformSize = keyof typeof PLATFORM_SIZES;
```

### Subtask 2.2 — Template schema types

```typescript
// Field types a template can declare
export type SchemaFieldType =
  | { type: 'string';  required?: boolean; default?: string; maxLength?: number }
  | { type: 'text';    required?: boolean; default?: string }       // multiline
  | { type: 'image';   required?: boolean }                         // URL → base64
  | { type: 'color';   required?: boolean; default?: string }       // hex color
  | { type: 'boolean'; required?: boolean; default?: boolean }
  | { type: 'enum';    required?: boolean; values: string[]; default?: string };

export type TemplateSchema = Record<string, SchemaFieldType>;

export type InferParams<S extends TemplateSchema> = {
  [K in keyof S]: S[K] extends { type: 'string' } ? string
    : S[K] extends { type: 'text' } ? string
    : S[K] extends { type: 'color' } ? string
    : S[K] extends { type: 'boolean' } ? boolean
    : S[K] extends { type: 'image' } ? string | undefined
    : S[K] extends { type: 'enum'; values: infer V extends string[] } ? V[number]
    : never;
};
```

### Subtask 2.3 — OGTemplate interface

```typescript
export interface OGTemplate<S extends TemplateSchema = TemplateSchema> {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;                         // semver
  tags?: string[];                         // e.g. ['minimal', 'dark', 'tech']
  supportedSizes: PlatformSize[];          // which sizes this template supports
  schema: S;
  render: (params: InferParams<S> & RenderContext) => JSX.Element;
  preview?: string;                        // relative path to preview.png
}

export interface RenderContext {
  width: number;
  height: number;
  size: PlatformSize;
}
```

### Subtask 2.4 — Adapter interfaces

```typescript
// Storage — for generated PNG files
export interface StorageAdapter {
  get(key: string): Promise<Buffer | null>;
  put(key: string, value: Buffer, options?: { contentType?: string }): Promise<void>;
  delete(key: string): Promise<void>;
  url(key: string): string;               // public URL for the stored file
}

// Cache — for key→value fast lookup (KV, Redis, memory)
export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

// Template registry — where templates come from
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
```

### Subtask 2.5 — Request/Response types

```typescript
export interface OGRequest {
  template: string;
  size: PlatformSize;
  params: Record<string, string>;          // raw query string params
  format?: 'png' | 'jpeg';
  quality?: number;                        // jpeg quality 1–100
  ttl?: number;                            // cache TTL override in seconds
}

export interface MetaRequest extends OGRequest {
  format?: 'json' | 'html';
  baseUrl: string;                         // for building absolute og:image URL
}

export interface MetaResponse {
  'og:image': string;
  'og:image:width': string;
  'og:image:height': string;
  'og:image:type': string;
  'twitter:card': 'summary_large_image' | 'summary';
  'twitter:image': string;
  [key: string]: string;
}
```

**Acceptance:** `pnpm typecheck` passes with zero errors. No runtime code in this package.

---

## TASK 3 — packages/core

**Goal:** The render pipeline. Platform-agnostic. Depends only on `@og-engine/types`, `satori`, and `@resvg/resvg-wasm`.

### Subtask 3.1 — Dependencies

Install in packages/core:
```
satori
@resvg/resvg-wasm
yoga-wasm-web
@og-engine/types (workspace)
```

### Subtask 3.2 — WASM initializer

```typescript
// src/wasm.ts
// WASM loads once per isolate/process lifetime — lazy singleton

let initialized = false;

export async function initWasm() {
  if (initialized) return;

  // yoga (flexbox engine used by satori)
  const { default: initYoga } = await import('yoga-wasm-web/auto');
  await initYoga();

  // resvg
  const { initWasm: initResvg } = await import('@resvg/resvg-wasm');
  // fetch from CDN or R2 — pass the wasm binary
  await initResvg(fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'));

  initialized = true;
}
```

**Important notes for agent:**
- On CF Workers: use WASM imports via the wrangler config (`[[wasm_modules]]`)
- On Node: use the native binary (`@resvg/resvg-js`) — detect via `typeof process !== 'undefined' && process.versions?.node`
- Create `src/wasm-node.ts` and `src/wasm-edge.ts` and export the right one based on runtime detection

### Subtask 3.3 — Font manager

```typescript
// src/fonts.ts
// Fonts must be ArrayBuffer for satori. Never load per-request.

export interface FontConfig {
  name: string;
  data: ArrayBuffer;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style?: 'normal' | 'italic';
}

// Built-in fonts to bundle (load from CDN on first use, cache in memory):
// - Inter (400, 700)
// - JetBrains Mono (400, 700)
// - Geist (400, 700)
// - Noto Emoji (for emoji support — critical, without this emojis = blank boxes)

const fontCache = new Map<string, ArrayBuffer>();

export async function loadFont(name: string, url: string): Promise<FontConfig> {
  if (!fontCache.has(url)) {
    const res = await fetch(url);
    fontCache.set(url, await res.arrayBuffer());
  }
  return { name, data: fontCache.get(url)!, weight: 400 };
}

export async function getDefaultFonts(): Promise<FontConfig[]> {
  // Load Inter + Noto Emoji as minimum viable set
  // ...
}
```

### Subtask 3.4 — Cache key builder

```typescript
// src/cache-key.ts
// Deterministic cache key from request params
// IMPORTANT: template version is included so cache auto-invalidates on template update

export function buildCacheKey(req: OGRequest, templateVersion: string): string {
  const sorted = Object.entries({
    ...req.params,
    template: req.template,
    size: req.size,
    format: req.format ?? 'png',
    _tv: templateVersion,             // template version — auto-busts cache on update
  })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  // Use Web Crypto API (works on CF Workers + Node 18+)
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sorted));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Subtask 3.5 — Render pipeline

```typescript
// src/render.ts

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
  
  // 1. Coerce raw string params into typed params using template.schema
  const typedParams = coerceParams(req.params, template.schema);

  // 2. Process image params — fetch external URLs and convert to base64 data URIs
  //    SSRF protection: block private IP ranges (10.x, 172.16.x, 192.168.x, 127.x, ::1)
  const processedParams = await processImageParams(typedParams, template.schema);

  // 3. Render JSX via template.render() inside sandbox
  const element = await sandboxedRender(template, {
    ...processedParams,
    width,
    height,
    size: req.size,
  });

  // 4. Satori: JSX → SVG
  const svg = await satori(element, {
    width,
    height,
    fonts,
    // Note: satori only supports a subset of CSS
    // Grid, position:fixed/sticky, calc(), overflow:hidden (some cases) are NOT supported
    // Document this clearly for template contributors
  });

  // 5. resvg: SVG → PNG/JPEG
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  const png = resvg.render().asPng();

  return {
    buffer: Buffer.from(png),
    contentType: 'image/png',
    width,
    height,
    cacheKey: await buildCacheKey(req, template.version),
  };
}
```

### Subtask 3.6 — Core handler (platform-agnostic request handler)

```typescript
// src/handler.ts
// This is what every platform adapter wraps

export interface HandlerDeps {
  platform: PlatformAdapter;
  fonts?: FontConfig[];
}

export function createHandler(deps: HandlerDeps) {
  return {
    // GET /api/og
    async handleImageRequest(req: OGRequest): Promise<{
      buffer: Buffer;
      contentType: string;
      headers: Record<string, string>;
      fromCache: boolean;
    }> {
      // 1. Resolve template
      const template = await deps.platform.registry.get(req.template);
      
      // 2. Build cache key
      const cacheKey = await buildCacheKey(req, template.version);
      
      // 3. Check KV cache first (fastest)
      const cachedUrl = await deps.platform.cache.get(cacheKey);
      if (cachedUrl) {
        const buffer = await deps.platform.storage.get(cacheKey);
        if (buffer) {
          return { buffer, contentType: 'image/png', headers: getCacheHeaders(), fromCache: true };
        }
      }
      
      // 4. Render
      const fonts = deps.fonts ?? await getDefaultFonts();
      const result = await render(req, template, fonts);
      
      // 5. Store in R2/storage
      await deps.platform.storage.put(cacheKey, result.buffer, { contentType: result.contentType });
      
      // 6. Write to KV cache
      await deps.platform.cache.set(cacheKey, deps.platform.storage.url(cacheKey));
      
      return { buffer: result.buffer, contentType: result.contentType, headers: getCacheHeaders(), fromCache: false };
    },

    // GET /api/meta
    async handleMetaRequest(req: MetaRequest): Promise<MetaResponse> {
      const { width, height } = PLATFORM_SIZES[req.size];
      const imageUrl = buildOGImageUrl(req);

      const meta: MetaResponse = {
        'og:image': imageUrl,
        'og:image:width': String(width),
        'og:image:height': String(height),
        'og:image:type': 'image/png',
        'twitter:card': 'summary_large_image',
        'twitter:image': imageUrl,
      };

      // Pre-generate image in background (non-blocking)
      // Platform must call this — CF uses ctx.waitUntil(), Node uses setImmediate()
      this.preGenerate(req);

      return meta;
    },

    // Background pre-generation — called by metadata endpoint
    async preGenerate(req: OGRequest): Promise<void> {
      try {
        await this.handleImageRequest(req);
      } catch {
        // Silent fail — pre-generation is best-effort
      }
    },
  };
}

function getCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'max-age=31536000',
  };
}
```

### Subtask 3.7 — Param coercion + validation

```typescript
// src/params.ts
// Converts raw string query params into typed values based on template schema

export function coerceParams(
  raw: Record<string, string>,
  schema: TemplateSchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(schema)) {
    const value = raw[key];

    if (!value) {
      if (field.required) throw new Error(`Missing required param: ${key}`);
      if ('default' in field) result[key] = field.default;
      continue;
    }

    switch (field.type) {
      case 'string':
      case 'text':
        if ('maxLength' in field && value.length > (field.maxLength ?? 500)) {
          throw new Error(`Param ${key} exceeds maxLength`);
        }
        result[key] = value;
        break;
      case 'boolean':
        result[key] = value === 'true' || value === '1';
        break;
      case 'color':
        if (!/^#[0-9a-fA-F]{3,8}$/.test(value)) throw new Error(`Invalid color: ${key}`);
        result[key] = value;
        break;
      case 'enum':
        if (!field.values.includes(value)) throw new Error(`Invalid enum value for ${key}`);
        result[key] = value;
        break;
      case 'image':
        // Value is a URL — will be processed separately by processImageParams
        result[key] = value;
        break;
    }
  }

  return result;
}
```

**Acceptance:** `packages/core` builds. `render()` function takes a mock JSX element and returns a Buffer.

---

## TASK 4 — packages/sandbox

**Goal:** Secure template execution. Templates run their `render()` fn here.

### Subtask 4.1 — Why a sandbox

Template `render` functions are JSX → JSX Element. They're already in a CF Worker (no fs, no global network). But we still want to:
- Catch and isolate render errors (one bad template shouldn't crash the worker)
- Enforce CPU time limit (50ms max per render)
- Eventually: block unexpected globals

### Subtask 4.2 — Sandbox implementation

```typescript
// src/index.ts

export async function sandboxedRender(
  template: OGTemplate,
  params: Record<string, unknown>
): Promise<JSX.Element> {
  const TIMEOUT_MS = 50;

  const result = await Promise.race([
    Promise.resolve().then(() => template.render(params as any)),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Template render timeout: ${template.id}`)), TIMEOUT_MS)
    ),
  ]);

  if (!result || typeof result !== 'object') {
    throw new Error(`Template ${template.id} returned invalid JSX`);
  }

  return result;
}
```

### Subtask 4.3 — CI AST scan (for template PRs)

Create `scripts/scan-template.mjs` — run in CI on any new/changed file under `templates/`:
- Parse template file with `@babel/parser` + `@babel/traverse`
- Block: `eval`, `Function(`, `new Function`, `setTimeout`, `setInterval`, dynamic `import()`
- Block globals: `fetch`, `XMLHttpRequest`, `process`, `require`, `__dirname`, `fs`
- Block: `dangerouslySetInnerHTML`
- Check bundle size: `esbuild` bundle must be < 50kb gzipped
- Fail with clear error message showing the line number

**Acceptance:** Scan script rejects a template containing `eval('x')`. Passes clean templates.

---

## TASK 5 — packages/adapter-cloudflare

**Goal:** CF Workers implementation of all adapter interfaces.

### Subtask 5.1 — Dependencies
```
hono
@cloudflare/workers-types
@og-engine/types (workspace)
```

### Subtask 5.2 — Storage adapter (R2)

```typescript
export const cloudflareStorage = (
  bucket: R2Bucket,
  publicBaseUrl: string
): StorageAdapter => ({
  async get(key) {
    const obj = await bucket.get(key);
    if (!obj) return null;
    return Buffer.from(await obj.arrayBuffer());
  },
  async put(key, value, options) {
    await bucket.put(key, value, {
      httpMetadata: { contentType: options?.contentType ?? 'image/png' },
    });
  },
  async delete(key) {
    await bucket.delete(key);
  },
  url(key) {
    return `${publicBaseUrl}/${key}`;
  },
});
```

### Subtask 5.3 — Cache adapter (KV)

```typescript
export const cloudflareCache = (kv: KVNamespace): CacheAdapter => ({
  async get(key) {
    return kv.get(key);
  },
  async set(key, value, ttl) {
    await kv.put(key, value, ttl ? { expirationTtl: ttl } : undefined);
  },
  async delete(key) {
    await kv.delete(key);
  },
});
```

### Subtask 5.4 — Template registry adapter

Templates are loaded from a static import map at build time (Git-based registry).
Dynamic registry (D1) is v2. For v1: bundle all templates into the worker.

```typescript
// Templates are statically imported — no dynamic loading in v1
import * as sunsetTemplate from '@og-engine/template-sunset';
import * as minimalTemplate from '@og-engine/template-minimal';
import * as darkTemplate from '@og-engine/template-dark';

const REGISTRY = new Map([
  [sunsetTemplate.default.id, sunsetTemplate.default],
  [minimalTemplate.default.id, minimalTemplate.default],
  [darkTemplate.default.id, darkTemplate.default],
]);

export const cloudflareRegistry = (): TemplateRegistryAdapter => ({
  async list() {
    return [...REGISTRY.values()].map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      author: t.author,
      version: t.version,
      tags: t.tags ?? [],
      supportedSizes: t.supportedSizes,
    }));
  },
  async get(id) {
    const t = REGISTRY.get(id);
    if (!t) throw new Error(`Template not found: ${id}`);
    return t;
  },
  async exists(id) {
    return REGISTRY.has(id);
  },
});
```

### Subtask 5.5 — Cloudflare adapter factory

```typescript
export interface CloudflareBindings {
  KV: KVNamespace;
  BUCKET: R2Bucket;
  PUBLIC_BASE_URL: string;
}

export function cloudflareAdapter(bindings: CloudflareBindings): PlatformAdapter {
  return {
    storage: cloudflareStorage(bindings.BUCKET, bindings.PUBLIC_BASE_URL),
    cache: cloudflareCache(bindings.KV),
    registry: cloudflareRegistry(),
  };
}
```

**Acceptance:** All adapter methods type-check against `PlatformAdapter` interface.

---

## TASK 6 — packages/adapter-node

**Goal:** Node.js implementation. Works on Railway, Docker, any VPS.

### Subtask 6.1 — Storage adapter (filesystem or S3)

```typescript
// Default: local filesystem (good for Railway, Docker with volume)
export const fileSystemStorage = (dir: string, baseUrl: string): StorageAdapter => ({
  async get(key) {
    try {
      return await fs.readFile(path.join(dir, key));
    } catch { return null; }
  },
  async put(key, value) {
    await fs.mkdir(path.dirname(path.join(dir, key)), { recursive: true });
    await fs.writeFile(path.join(dir, key), value);
  },
  async delete(key) {
    await fs.unlink(path.join(dir, key)).catch(() => {});
  },
  url(key) { return `${baseUrl}/${key}`; },
});
```

### Subtask 6.2 — Cache adapter (in-memory + optional Redis)

```typescript
// Memory cache — works zero-config, resets on restart
export const memoryCache = (): CacheAdapter => {
  const store = new Map<string, { value: string; expiresAt?: number }>();
  return {
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, ttl) {
      store.set(key, { value, expiresAt: ttl ? Date.now() + ttl * 1000 : undefined });
    },
    async delete(key) { store.delete(key); },
  };
};

// Redis cache — export separately, user opts in
export const redisCache = (redisUrl: string): CacheAdapter => { /* ioredis impl */ };
```

### Subtask 6.3 — Node adapter factory

```typescript
export interface NodeAdapterOptions {
  storageDir?: string;            // default: ./.og-cache
  baseUrl?: string;               // default: http://localhost:3000
  redisUrl?: string;              // optional, falls back to memory
}

export function nodeAdapter(options: NodeAdapterOptions = {}): PlatformAdapter {
  return {
    storage: fileSystemStorage(options.storageDir ?? './.og-cache', options.baseUrl ?? ''),
    cache: options.redisUrl ? redisCache(options.redisUrl) : memoryCache(),
    registry: staticRegistry(),   // same as CF — static imports
  };
}
```

**Acceptance:** Node adapter runs in a plain `ts-node` script and stores/retrieves a dummy buffer.

---

## TASK 7 — packages/adapter-vercel

**Goal:** Vercel adapter. Thin wrapper — mostly uses node adapter with S3/Redis options since Vercel has Node functions.

### Subtask 7.1 — Implementation

Same as node adapter but with:
- S3 storage adapter using `@aws-sdk/client-s3` (for Vercel Blob or any S3)
- Upstash Redis cache adapter as default recommendation

Document in README: "Use `@og-engine/adapter-node` on Vercel Node functions. For Edge Runtime use the CF adapter pattern."

---

## TASK 8 — templates/ (built-in templates)

**Goal:** Three production-quality built-in templates. These serve as the reference implementation for contributors.

### Subtask 8.1 — templates/_base

Create `templates/_base/helpers.tsx`:
- `truncate(str, maxLength)` — safe text truncation
- `formatDate(date)` — consistent date formatting
- `hexToRgb(hex)` — color utilities

### Subtask 8.2 — templates/sunset

A warm gradient template. Good for blog posts, articles.

Schema: `title` (required), `subtitle` (optional), `author` (optional), `date` (optional)

Supported sizes: all except ig-story (too portrait for this layout)

Design: Deep orange/pink gradient background, large white title, smaller subtitle, author bottom-left. Must look good from 400px wide (WhatsApp) to 1280px (GitHub).

### Subtask 8.3 — templates/minimal

Clean white background. Good for developer tools, docs.

Schema: `title` (required), `description` (optional), `logo` (image, optional), `tag` (string, optional), `theme` (enum: light|dark, default: light)

### Subtask 8.4 — templates/dark

Dark background, neon accent. Good for SaaS products, tech.

Schema: `title` (required), `subtitle` (optional), `accent` (color, default: #00D2FF), `author` (optional)

### Subtask 8.5 — Each template must include

- `index.tsx` — the template implementation
- `preview.png` — 1200×630 static screenshot (used in gallery, avoids rendering on gallery load)
- `metadata.json`:

```json
{
  "id": "sunset",
  "name": "Sunset",
  "description": "Warm gradient template for articles and blog posts",
  "author": "og-engine",
  "version": "1.0.0",
  "tags": ["gradient", "warm", "blog", "article"],
  "supportedSizes": ["twitter-og", "facebook-og", "linkedin-og", "og", "discord", "github", "whatsapp", "ig-post"],
  "schema": { }
}
```

**Critical CSS limitations to handle in templates (Satori subset):**
- Use `display: flex` everywhere — NO CSS Grid
- No `position: sticky` or `position: fixed`
- No `overflow: hidden` on flex containers (use clip via parent sizing instead)
- No `calc()`
- No `::before` / `::after` pseudo-elements
- No `background-clip: text` (gradient text effect) — workaround: nested divs
- All dimensions must be explicit (no `auto` heights on flex children)
- RTL languages (Arabic, Hebrew) have limited support — document as known limitation

**Acceptance:** All three templates render to valid PNG at `twitter-og` and `ig-post` sizes.

---

## TASK 9 — apps/worker-cf

**Goal:** Cloudflare Worker entry point. Hono router. Wraps core handler.

### Subtask 9.1 — Dependencies
```
hono
@og-engine/core (workspace)
@og-engine/adapter-cloudflare (workspace)
@og-engine/types (workspace)
```

### Subtask 9.2 — wrangler.toml

```toml
name = "og-engine"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_ID"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "og-engine-images"

[vars]
PUBLIC_BASE_URL = "https://your-r2-public-url.com"

# WASM modules — resvg
[[wasm_modules]]
# Add resvg wasm binding here
```

### Subtask 9.3 — Hono router

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createHandler } from '@og-engine/core';
import { cloudflareAdapter } from '@og-engine/adapter-cloudflare';

type Bindings = { KV: KVNamespace; BUCKET: R2Bucket; PUBLIC_BASE_URL: string; };

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// GET /api/og — generate and return image
app.get('/api/og', async (c) => {
  const handler = createHandler({
    platform: cloudflareAdapter({
      KV: c.env.KV,
      BUCKET: c.env.BUCKET,
      PUBLIC_BASE_URL: c.env.PUBLIC_BASE_URL,
    }),
  });

  const req = parseOGRequest(c.req.query());
  const result = await handler.handleImageRequest(req);

  // Pre-generation runs in background via waitUntil (non-blocking)
  c.executionCtx.waitUntil(Promise.resolve());

  return new Response(result.buffer, {
    headers: {
      'Content-Type': result.contentType,
      ...result.headers,
      'X-Cache': result.fromCache ? 'HIT' : 'MISS',
    },
  });
});

// GET /api/meta — return OG meta tags + trigger background pre-generation
app.get('/api/meta', async (c) => {
  const handler = createHandler({
    platform: cloudflareAdapter({ KV: c.env.KV, BUCKET: c.env.BUCKET, PUBLIC_BASE_URL: c.env.PUBLIC_BASE_URL }),
  });

  const req = parseMetaRequest(c.req.query(), c.req.url);
  const meta = await handler.handleMetaRequest(req);

  // Fire pre-generation in background — image ready before any crawler arrives
  c.executionCtx.waitUntil(handler.preGenerate(req));

  const format = c.req.query('format') ?? 'json';

  if (format === 'html') {
    const html = Object.entries(meta)
      .map(([k, v]) => `<meta property="${k}" content="${v}" />`)
      .join('\n');
    return c.text(html, 200, { 'Content-Type': 'text/html' });
  }

  return c.json(meta);
});

// GET /api/templates — list available templates
app.get('/api/templates', async (c) => {
  const adapter = cloudflareAdapter({ KV: c.env.KV, BUCKET: c.env.BUCKET, PUBLIC_BASE_URL: c.env.PUBLIC_BASE_URL });
  const templates = await adapter.registry.list();
  return c.json(templates);
});

// GET /api/templates/:id — single template schema (for editor form generation)
app.get('/api/templates/:id', async (c) => {
  const adapter = cloudflareAdapter({ KV: c.env.KV, BUCKET: c.env.BUCKET, PUBLIC_BASE_URL: c.env.PUBLIC_BASE_URL });
  const template = await adapter.registry.get(c.req.param('id'));
  return c.json({ id: template.id, name: template.name, schema: template.schema, supportedSizes: template.supportedSizes });
});

// Health check
app.get('/health', (c) => c.json({ ok: true }));

export default app;
```

### Subtask 9.4 — Query param parser

```typescript
// src/parse.ts
function parseOGRequest(query: Record<string, string>): OGRequest {
  const { template = 'sunset', size = 'og', format = 'png', quality, ttl, ...params } = query;

  if (!(size in PLATFORM_SIZES)) throw new Error(`Unknown size: ${size}`);

  return {
    template,
    size: size as PlatformSize,
    params,
    format: format as 'png' | 'jpeg',
    quality: quality ? Number(quality) : undefined,
    ttl: ttl ? Number(ttl) : undefined,
  };
}
```

### Subtask 9.5 — Error handling

All errors return JSON with status code, never crash the worker:
```json
{ "error": "Template not found: nonexistent", "status": 404 }
```

**Acceptance:** `wrangler dev` starts. `GET /api/og?template=sunset&title=Hello` returns a PNG.

---

## TASK 10 — apps/server-node

**Goal:** Express server entry point for Railway, Docker, VPS.

### Subtask 10.1 — Express router

Mirrors the Hono router exactly — same routes, same response shapes.

```typescript
// src/index.ts
import express from 'express';
import { createHandler } from '@og-engine/core';
import { nodeAdapter } from '@og-engine/adapter-node';

const app = express();
const handler = createHandler({ platform: nodeAdapter({ baseUrl: process.env.BASE_URL }) });

app.get('/api/og', async (req, res) => {
  const result = await handler.handleImageRequest(parseOGRequest(req.query));
  // Fire pre-generation is handled synchronously in node (setImmediate)
  res.set({ 'Content-Type': result.contentType, ...result.headers });
  res.send(result.buffer);
});

app.get('/api/meta', async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const meta = await handler.handleMetaRequest(parseMetaRequest(req.query, baseUrl));
  // Background pre-generation
  setImmediate(() => handler.preGenerate(parseOGRequest(req.query)));
  
  if (req.query.format === 'html') {
    const html = Object.entries(meta).map(([k, v]) => `<meta property="${k}" content="${v}" />`).join('\n');
    return res.type('html').send(html);
  }
  res.json(meta);
});

app.listen(process.env.PORT ?? 3000);
```

### Subtask 10.2 — Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm build
CMD ["node", "apps/server-node/dist/index.js"]
EXPOSE 3000
```

---

## TASK 11 — apps/web (Editor UI)

**Goal:** Next.js app. Template gallery + form-based editor with live preview + URL builder + docs.

### Subtask 11.1 — Setup

```
next@15 (app router)
tailwindcss
@og-engine/types (workspace)
```

### Subtask 11.2 — Pages & routes

```
app/
├── page.tsx                    ← landing page
├── templates/
│   ├── page.tsx                ← template gallery
│   └── [id]/
│       └── page.tsx            ← template detail
├── editor/
│   └── page.tsx                ← form editor
├── playground/
│   └── page.tsx                ← live URL tester
└── docs/
    └── [...slug]/
        └── page.tsx            ← MDX docs
```

### Subtask 11.3 — Template gallery (app/templates/page.tsx)

- Fetches template list from `GET /api/templates`
- Displays `TemplateCard` for each
- `TemplateCard` shows `preview.png` (static — NOT a live render), name, author, tags, supported sizes
- Filter by tag, search by name

**Critical:** Use `preview.png` static image in gallery — never hit `/api/og` on gallery load. Rendering all templates would be slow and expensive.

### Subtask 11.4 — Form-based editor (app/editor/page.tsx)

This is the core UI. Build it carefully.

**Layout:** Two-column — form left, preview right.

**EditorForm component** — dynamically generates form fields from template schema:
```typescript
// Reads template.schema and renders the right input per field type:
// type: 'string'  → <input type="text" />
// type: 'text'    → <textarea />
// type: 'color'   → <input type="color" /> + hex input
// type: 'boolean' → <Toggle />
// type: 'enum'    → <Select> with values
// type: 'image'   → <input type="url" /> (URL input, not file upload for v1)
//
// When a new template is contributed with new param types,
// the form automatically gains new fields — zero UI changes needed
```

**PreviewPane component:**
- Shows `<img src={generatedUrl} />` where generatedUrl is built from form state
- **Debounce all form changes by 500ms** before updating the image src
  - Without debounce: every keystroke fires a new API call
- Show loading skeleton while image loads
- Show error state if API returns error
- Has a SizeSelector — changing size updates preview dimensions and regenerates

**SizeSelector component:**
- Renders a pill/tab for each platform size
- Visually shows the aspect ratio as a small rectangle
- Selecting a size updates the `size=` param in the URL

**UrlBuilder component (below the preview):**
- Shows the generated API URL in a code block
- "Copy URL" button — on click, copies URL AND silently fires `fetch(url)` to pre-warm the cache
- "Copy Meta Tags" button — fetches `/api/meta?format=html&...` and copies the HTML snippet
- "Open in new tab" link

**FontPicker component:**
- Dropdown of available fonts (Inter, JetBrains Mono, Geist)
- Adds `font=` param to URL

### Subtask 11.5 — Playground (app/playground/page.tsx)

- Raw URL input field
- Paste any `/api/og?...` URL and see the preview
- Shows all parsed params as a table
- Good for debugging and sharing

### Subtask 11.6 — Docs (app/docs/)

Use MDX. Create these doc pages:

1. `getting-started.mdx` — Quick start, point at the hosted API
2. `api-reference.mdx` — All query params, all endpoints
3. `platforms.mdx` — Platform sizes table with visual aspect ratio guide
4. `contributing-templates.mdx` — Full guide: fork → create → schema → render → PR
5. `self-hosting.mdx` — CF Workers deploy, Docker deploy, Railway deploy
6. `limitations.mdx` — **Critical page.** Document all known limitations clearly:
   - Satori CSS subset (no Grid, no calc, no overflow:hidden on flex)
   - No RTL language support (Arabic, Hebrew limited)
   - Emoji requires Noto Emoji font — built in but adds 2MB to bundle
   - WASM first-request overhead (~200ms on cold isolate)
   - Template bundle max 50kb gzipped
   - No dynamic/real-time content in cached images (use `ttl` param for expiring cache)
   - External image URLs must be public (SSRF protection blocks private IPs)

### Subtask 11.7 — Environment config

```typescript
// lib/config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
```

All API calls go through this — makes it easy to point the UI at any deployment.

---

## TASK 12 — .github/workflows/template-scan.yml

**Goal:** Automated security scan on every PR that touches `templates/`.

```yaml
name: Template Security Scan
on:
  pull_request:
    paths: ['templates/**']

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - name: AST Security Scan
        run: node scripts/scan-template.mjs ${{ github.event.pull_request.changed_files }}
      - name: Bundle Size Check
        run: node scripts/check-bundle-size.mjs
      - name: Render Test
        run: node scripts/render-test.mjs  # renders template at all declared sizes, times it
      - name: Upload preview artifacts
        uses: actions/upload-artifact@v4
        with:
          name: template-previews
          path: .temp/previews/*.png
```

The uploaded preview PNGs appear on the PR for human review.

---

## TASK 13 — Template Contribution Guide + PR Template

### Subtask 13.1 — CONTRIBUTING.md

Cover:
1. How to fork and set up locally
2. Template file structure (index.tsx, preview.png, metadata.json)
3. The OGTemplate interface contract (copy from types)
4. Satori CSS limitations (important section)
5. How to generate preview.png (`pnpm template:preview --id your-template`)
6. PR checklist
7. Security requirements (what the CI scan checks)

### Subtask 13.2 — .github/PULL_REQUEST_TEMPLATE/template_contribution.md

```markdown
## New Template: [template-name]

**Template ID:** 
**Author:** 
**Tags:** 

### Checklist
- [ ] index.tsx exports default OGTemplate
- [ ] metadata.json is complete and valid
- [ ] preview.png is included (1200×630)
- [ ] Renders in < 50ms (CI will verify)
- [ ] Bundle < 50kb gzipped (CI will verify)
- [ ] No eval, fetch, process, fs usage (CI will verify)
- [ ] Tested at minimum: twitter-og and og sizes
- [ ] Added to supportedSizes only sizes that look correct

### Preview
<!-- CI will upload preview images as artifacts -->
```

---

## TASK 14 — scripts/

Helper scripts for development and CI.

### Subtask 14.1 — scripts/scan-template.mjs
AST scanner using `@babel/parser` + `@babel/traverse`. Details in Task 4.3.

### Subtask 14.2 — scripts/check-bundle-size.mjs
ESBuild bundle check. Target: < 50kb gzipped per template.

### Subtask 14.3 — scripts/render-test.mjs
Takes a template ID, renders at all declared sizes, outputs PNGs to `.temp/previews/`, measures time.

### Subtask 14.4 — scripts/generate-preview.mjs
Convenience script: `pnpm template:preview --id sunset`
Renders template at `og` size with dummy params from schema defaults → saves as `templates/sunset/preview.png`.

---

## TASK 15 — README.md

The root README must cover:

1. **What it is** — one paragraph
2. **Quick start** — curl example showing the URL API
3. **Supported platforms table** — all 8 sizes with dimensions
4. **API reference** — all query params in a table
5. **Deploy in 5 minutes** — CF Workers, Docker, Railway, Vercel (each as a tab/section)
6. **Contributing templates** — link to CONTRIBUTING.md
7. **Known limitations** — link to docs/limitations.mdx
8. **License** — MIT

---

## Global Rules for Agent

- **Never use `any`** in TypeScript except where explicitly noted and commented
- **Never use `eval`, `Function()`, dynamic import** in core, adapters, or worker code
- **SSRF protection is non-negotiable** — any code path that fetches a user-provided URL must validate against private IP ranges before fetching
- **Cache headers are immutable** — every image response gets `Cache-Control: public, max-age=31536000, immutable`
- **All errors return JSON** `{ error: string, status: number }` — never let exceptions propagate to raw 500s
- **Platform code never leaks into core** — `packages/core` has zero imports from any adapter package
- **Debounce editor preview at 500ms** — this is UX critical
- **Use `crypto.subtle` for hashing** — works on both CF Workers and Node 18+, no dependencies needed
- **Document Satori limitations prominently** — template contributors will hit these and be confused without docs
- **`preview.png` in gallery, never live render** — gallery page must not hit `/api/og` for each card

---

## Build Order

```
1. packages/types          ← no deps, start here
2. packages/sandbox        ← depends on types
3. packages/core           ← depends on types + sandbox
4. packages/adapter-node   ← depends on types + core
5. packages/adapter-cf     ← depends on types + core
6. packages/adapter-vercel ← depends on types + core
7. templates/*             ← depends on types
8. apps/worker-cf          ← depends on core + adapter-cf + templates
9. apps/server-node        ← depends on core + adapter-node + templates
10. apps/web               ← depends on types (API calls only)
```

---

*End of task document. Every architectural decision from the design session is captured above.*
*Total scope: ~15 packages/apps, 3 built-in templates, full CI pipeline, editor UI.*