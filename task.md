# og-engine — Public Repo Tasks (OSS)

> **Repository:** github.com/og-engine/og-engine (public, MIT)
> **Golden rule:** Tests must pass after every subtask. Commit after each subtask.
> Never delete before replacement is in place and tested.

---

## TASK 1 — Repo Restructure

### Target structure
```
og-engine/
├── packages/
│   ├── sdk/
│   ├── core/
│   ├── types/
│   ├── adapter-cloudflare/
│   ├── adapter-node/
│   └── adapter-vercel/
├── templates/
│   ├── free/
│   │   ├── sunset.tsx
│   │   ├── sunset.preview.png
│   │   ├── minimal.tsx
│   │   ├── minimal.preview.png
│   │   ├── dark.tsx
│   │   └── dark.preview.png
└── apps/
    └── web/
```

### Subtask 1.1 — Remove sandbox package
- Inline the 10-line timeout wrapper directly into `packages/core/src/render.ts`
- Document it with a JSDoc block explaining why it's not a separate package
- Delete `packages/sandbox/` after verifying tests pass
- Run `pnpm test && pnpm typecheck`

### Subtask 1.2 — Flatten templates to files
- Convert each template from a package to a single `.tsx` file
- Move to `templates/free/` or `templates/pro/`
- Remove all `package.json`, `tsconfig.json` from template directories
- Update `pnpm-workspace.yaml` — remove `templates/*` from workspaces
- Update `apps/web` and `apps/worker-cf` imports to point at files directly
- Run full test suite

### Subtask 1.3 — Remove apps/worker-cf from public repo
- This moves to the private repo
- Before deleting: verify `packages/core` and all adapters are fully self-contained
- Delete `apps/worker-cf/`
- Verify `pnpm build` still works for all remaining packages

### Subtask 1.4 — Update pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Subtask 1.5 — Fix turbo.json (Turbo 2.x syntax)
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### Subtask 1.6 — Update all package.json names
- `packages/sdk`               → `@og-engine/sdk`
- `packages/core`              → `@og-engine/core`
- `packages/types`             → `@og-engine/types`
- `packages/adapter-cloudflare`→ `@og-engine/adapter-cloudflare`
- `packages/adapter-node`      → `@og-engine/adapter-node`
- `packages/adapter-vercel`    → `@og-engine/adapter-vercel`
- `apps/web`                   → `@og-engine/web`, `"private": true`

### Subtask 1.7 — Verify
```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm --filter @og-engine/web dev  # must start clean
```

**Acceptance:** All commands pass. No `packages/sandbox`. No `apps/worker-cf`. Templates are `.tsx` files only.

---

## TASK 2 — packages/types

**All shared interfaces. Zero runtime code. Zero dependencies.**

### Subtask 2.1 — Platform sizes
```typescript
/**
 * @file platform-sizes.ts
 * @description Supported social platform image dimensions.
 */

export const PLATFORM_SIZES = {
  'twitter-og':  { width: 1200, height: 628,  label: 'Twitter / X' },
  'facebook-og': { width: 1200, height: 630,  label: 'Facebook OG' },
  'linkedin-og': { width: 1200, height: 627,  label: 'LinkedIn' },
  'ig-post':     { width: 1080, height: 1080, label: 'Instagram Post' },
  'ig-story':    { width: 1080, height: 1920, label: 'Instagram Story' },
  'discord':     { width: 1280, height: 640,  label: 'Discord' },
  'whatsapp':    { width: 400,  height: 209,  label: 'WhatsApp' },
  'github':      { width: 1280, height: 640,  label: 'GitHub Social' },
  'og':          { width: 1200, height: 630,  label: 'Generic OG (default)' },
} as const;

export type PlatformSize = keyof typeof PLATFORM_SIZES;
```

### Subtask 2.2 — Template schema types
```typescript
export type SchemaFieldType =
  | { type: 'string';  required?: boolean; default?: string; maxLength?: number }
  | { type: 'text';    required?: boolean; default?: string }
  | { type: 'image';   required?: boolean }
  | { type: 'color';   required?: boolean; default?: string }
  | { type: 'boolean'; required?: boolean; default?: boolean }
  | { type: 'enum';    required?: boolean; values: string[]; default?: string };

export type TemplateSchema = Record<string, SchemaFieldType>;
```

### Subtask 2.3 — OGTemplate interface
```typescript
/** Tier controls access on the hosted API. Self-hosters have no restrictions. */
export type TemplateTier = 'free' | 'pro';

export interface OGTemplate<S extends TemplateSchema = TemplateSchema> {
  /** Unique identifier used in URL: ?template=sunset */
  id: string;
  /** Human-readable display name */
  name: string;
  /** One sentence description shown in the gallery */
  description: string;
  /** GitHub username of the author */
  author: string;
  /** Semver. Bumping this invalidates all cached images for this template. */
  version: string;
  /** free = available to all, pro = requires paid key on hosted API */
  tier: TemplateTier;
  /** Searchable tags for the gallery */
  tags?: string[];
  /** Only declare sizes you have tested and verified */
  supportedSizes: PlatformSize[];
  /** Parameter schema — drives the editor form automatically */
  schema: S;
  /** Pure render function. Must be deterministic. No side effects. No async. */
  render: (params: InferParams<S> & RenderContext) => JSX.Element;
}

export interface RenderContext {
  /** Pixel width of the output image */
  width: number;
  /** Pixel height of the output image */
  height: number;
  /** The platform size key */
  size: PlatformSize;
}
```

### Subtask 2.4 — Adapter interfaces
```typescript
export interface StorageAdapter {
  get(key: string): Promise<Buffer | null>;
  put(key: string, value: Buffer, options?: { contentType?: string }): Promise<void>;
  delete(key: string): Promise<void>;
  /** Returns the public URL for a stored object */
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
```

### Subtask 2.5 — Request/response types
```typescript
export interface OGRequest {
  template: string;
  size: PlatformSize;
  params: Record<string, string>;
  format?: 'png' | 'jpeg';
  quality?: number;
  ttl?: number;
  /** Whether to skip watermark — set by private app after key validation */
  skipWatermark?: boolean;
}

export interface MetaRequest extends OGRequest {
  outputFormat?: 'json' | 'html';
  /** Absolute base URL for building og:image URL */
  baseUrl: string;
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

### Subtask 2.6 — Error types
```typescript
export type OGErrorCode =
  | 'TEMPLATE_NOT_FOUND'
  | 'INVALID_PARAM'
  | 'RENDER_TIMEOUT'
  | 'RENDER_FAILED'
  | 'STORAGE_ERROR'
  | 'INVALID_SIZE'
  | 'SSRF_BLOCKED'
  | 'RATE_LIMITED'
  | 'MISSING_KEY'
  | 'INVALID_KEY';

export class OGEngineError extends Error {
  constructor(
    message: string,
    public readonly code: OGErrorCode,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = 'OGEngineError';
  }
}
```

**Acceptance:** `pnpm typecheck` passes. Zero runtime code. Zero dependencies.

---

## TASK 3 — packages/core

**Render pipeline. No platform code. No adapter imports.**

### Subtask 3.1 — WASM initializer

```typescript
/**
 * @file wasm.ts
 * @description Lazy WASM initialization for Satori and resvg.
 *
 * WASM compiles once per isolate/process lifetime (~150-200ms overhead).
 * All subsequent renders on the same instance pay 0ms WASM cost.
 *
 * Runtime detection: CF Workers (Edge) vs Node.js use different binaries.
 */

let initialized = false;

export async function initWasm(): Promise<void> {
  if (initialized) return;
  // Edge runtime: use WASM binaries
  // Node runtime: use native binaries (faster, no WASM overhead)
  // Detect via typeof process
  initialized = true;
}
```

### Subtask 3.2 — Font manager

Built-in fonts (loaded from CDN on first use, cached in memory forever):
- `Playfair Display` 400, 700, 900
- `Instrument Serif` 400 italic
- `JetBrains Mono` 400, 700
- `DM Sans` 400, 500
- `Noto Emoji` 400 — **critical, emojis render as blank boxes without this**

```typescript
/**
 * @file fonts.ts
 * @description Font loading and caching for Satori.
 *
 * Satori requires fonts as ArrayBuffer — it cannot use CSS font-face URLs.
 * Fonts are fetched once per isolate and cached in memory.
 *
 * IMPORTANT: Each font adds to Worker memory. The full default set
 * is approximately 4MB. Noto Emoji alone is ~2MB but is required
 * for correct emoji rendering.
 */
```

### Subtask 3.3 — Cache key builder

```typescript
/**
 * Builds a deterministic SHA-256 cache key from request parameters.
 *
 * Key includes:
 * - All user params (sorted for determinism)
 * - Template version (invalidates cache on template update)
 * - Watermark state (watermarked and clean images are cached separately)
 *
 * Uses Web Crypto API (compatible with CF Workers and Node 18+).
 */
export async function buildCacheKey(
  req: OGRequest,
  templateVersion: string
): Promise<string>
```

### Subtask 3.4 — Param coercion + validation

```typescript
/**
 * Coerces raw string query params into typed values using the template schema.
 *
 * Validates:
 * - Required fields are present
 * - String lengths do not exceed maxLength
 * - Color values match #[0-9a-fA-F]{3,8}
 * - Enum values are in the declared set
 * - Boolean values are 'true'/'1' or 'false'/'0'
 *
 * @throws {OGEngineError} INVALID_PARAM if validation fails
 */
export function coerceParams(
  raw: Record<string, string>,
  schema: TemplateSchema
): Record<string, unknown>
```

### Subtask 3.5 — SSRF protection

```typescript
/**
 * Validates an external URL before fetching it.
 *
 * Blocks:
 * - Private IP ranges (10.x, 172.16.x, 192.168.x, 127.x, ::1, 0.0.0.0)
 * - Non-HTTP/HTTPS protocols
 * - Files exceeding 5MB (checked via HEAD request before download)
 *
 * @throws {OGEngineError} SSRF_BLOCKED if URL is unsafe
 * @throws {OGEngineError} INVALID_PARAM if file is too large
 */
export async function validateImageUrl(url: string): Promise<void>
```

### Subtask 3.6 — Render function

```typescript
/**
 * Core render function. Converts an OG request into a PNG/JPEG buffer.
 *
 * Pipeline:
 * 1. Init WASM (no-op if already initialized)
 * 2. Coerce and validate params
 * 3. Process image params (fetch → base64)
 * 4. Call template.render() with 50ms timeout
 * 5. Satori: JSX → SVG
 * 6. resvg: SVG → PNG
 *
 * Satori CSS limitations (document in comments near usage):
 * - No CSS Grid (use flexbox only)
 * - No position: sticky / fixed
 * - No overflow: hidden on flex containers
 * - No calc()
 * - No ::before / ::after
 * - All dimensions must be explicit
 */
export async function render(
  req: OGRequest,
  template: OGTemplate,
  fonts: FontConfig[]
): Promise<RenderResult>
```

### Subtask 3.7 — Platform-agnostic handler

```typescript
/**
 * Creates a platform-agnostic request handler.
 *
 * The handler orchestrates the full request lifecycle:
 * cache check → render → store → return.
 *
 * Platform-specific concerns (storage, cache, registry) are
 * injected via the PlatformAdapter interface.
 *
 * @example
 * ```ts
 * // Cloudflare Workers
 * const handler = createHandler({ platform: cloudflareAdapter(bindings) });
 *
 * // Node.js (Railway, Docker)
 * const handler = createHandler({ platform: nodeAdapter() });
 * ```
 */
export function createHandler(deps: HandlerDeps): OGHandler
```

Cache headers — always immutable:
```typescript
function getCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'max-age=31536000',
    'Vary': 'Accept',
  };
}
```

Background pre-generation called by meta endpoint:
```typescript
/**
 * Pre-generates and caches an image in the background.
 *
 * Called by the /api/meta endpoint so images exist before
 * any social crawler arrives. Failures are swallowed —
 * pre-generation is best-effort.
 *
 * On CF Workers: wrap in ctx.waitUntil()
 * On Node: wrap in setImmediate()
 */
async preGenerate(req: OGRequest): Promise<void>
```

**Acceptance:** `packages/core` builds. `render()` returns a valid Buffer given a mock template.

---

## TASK 4 — packages/adapter-cloudflare

### Subtask 4.1 — Storage (R2)
Full implementation of `StorageAdapter` using `R2Bucket`.

### Subtask 4.2 — Cache (KV)
Full implementation of `CacheAdapter` using `KVNamespace`.

### Subtask 4.3 — Template registry
Static import map at build time. Checks for duplicate IDs at startup and throws hard:
```typescript
// Duplicate ID check — catches contributor mistakes at startup, not silently at runtime
const ids = templates.map(t => t.id);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length > 0) {
  throw new Error(`Duplicate template IDs detected: ${duplicates.join(', ')}`);
}
```

### Subtask 4.4 — Adapter factory
```typescript
export function cloudflareAdapter(bindings: CloudflareBindings): PlatformAdapter
```

**Acceptance:** All methods typecheck against `PlatformAdapter`. No `any`.

---

## TASK 5 — packages/adapter-node

### Subtask 5.1 — Storage (filesystem)
Default: local filesystem. Directory created automatically if missing.

### Subtask 5.2 — Cache (memory + optional Redis)
Memory cache as default (zero config). Redis as opt-in via `redisUrl`.

### Subtask 5.3 — Adapter factory
```typescript
export function nodeAdapter(options?: NodeAdapterOptions): PlatformAdapter
```

**Acceptance:** Runs in plain Node 20. Stores and retrieves a buffer. Tests pass.

---

## TASK 6 — packages/adapter-vercel

Thin wrapper around node adapter. Documents Upstash Redis + Vercel Blob as recommended storage.

---

## TASK 7 — packages/sdk

**Zero dependencies. Ships as ESM + CJS.**

```typescript
/**
 * @file index.ts
 * @description Zero-dependency SDK for the og-engine hosted API.
 *
 * Uses only:
 * - Native URLSearchParams (URL building)
 * - Native fetch (Node 18+ / all browsers)
 * - Native fs/promises (file saving, Node only)
 *
 * No runtime dependencies required.
 */

/**
 * Creates an og-engine client pointing at a specific API base URL.
 *
 * @param options.baseUrl - API base URL (default: https://api.og-engine.com)
 * @param options.apiKey  - Optional paid API key (removes watermark)
 *
 * @example
 * ```ts
 * // Use hosted API (default)
 * import { generateUrl } from '@og-engine/sdk';
 * const url = generateUrl({ title: 'Hello', template: 'sunset' });
 *
 * // Self-hosted
 * const og = createClient({ baseUrl: 'https://og.mycompany.com' });
 * const url = og.generateUrl({ title: 'Hello' });
 * ```
 */
export function createClient(options?: ClientOptions): OGClient

/** Standalone export using the hosted API. Most users use this. */
export const { generateUrl, getMetaTags, generate, generateToFile } = createClient();
```

Framework integration examples in README:
- Next.js App Router
- Next.js Pages Router
- Astro
- Remix
- SvelteKit

**Acceptance:** Zero deps in `package.json`. Works in Node 18, browser, CF Workers.

---

## TASK 8 — Templates

### Design rules (read before writing any template code)

**Satori CSS hard limitations — must be respected:**
- `display: flex` only — NO CSS Grid
- No `position: sticky` or `position: fixed`
- No `overflow: hidden` on flex containers
- No `calc()`
- No `::before` / `::after`
- No `background-clip: text`
- All dimensions must be explicit (no `auto` heights)
- RTL languages (Arabic, Hebrew) — limited support, document as known limitation

### Subtask 8.1 — `templates/free/sunset.tsx` — Editorial

Direction: newspaper editorial. Stops the scroll.

- Background: deep ink `#0a0a0a`, text: off-white `#f5f0e8`
- Display font: `Playfair Display` heavy for title
- Red accent `#c0392b` on horizontal rule only — one element
- Layout: tag top-right, red rule, large title, thin rule, subtitle, author bottom-left

```typescript
const sunset: OGTemplate = {
  id: 'sunset',
  tier: 'free',
  supportedSizes: ['twitter-og', 'facebook-og', 'linkedin-og', 'og', 'discord', 'github', 'whatsapp', 'ig-post'],
  schema: {
    title:    { type: 'string', required: true,  maxLength: 120 },
    subtitle: { type: 'string', required: false, maxLength: 200 },
    author:   { type: 'string', required: false },
    tag:      { type: 'string', required: false },
    date:     { type: 'string', required: false },
  },
  // ...
};
```

### Subtask 8.2 — `templates/free/minimal.tsx` — Swiss International

Direction: typography IS the design. Extreme whitespace.

- Light or dark via `theme` param
- `Instrument Serif` italic for title, `DM Sans` for labels
- One accent color (configurable)
- Title can be huge (80-96px) — deliberate overflow is intentional
- Logo top-right if provided

### Subtask 8.3 — `templates/free/dark.tsx` — Terminal

Direction: developer tool aesthetic. Raw and sharp.

- True black `#000000`
- `JetBrains Mono` throughout
- `>` cursor prefix on title in accent color
- Dot-grid background (absolute-positioned divs, not CSS pattern — Satori safe)
- Terminal statusline at bottom

### Subtask 8.4 — `templates/pro/glass.tsx` — Layered depth

Direction: premium SaaS landing page energy. Light and refined.

- Off-white background with subtle layered cards
- Soft shadows creating depth
- `Bricolage Grotesque` for title, fine weight
- Gradient accent bar at top (2px, configurable color)
- Company logo prominent

### Subtask 8.5 — `templates/pro/editorial.tsx` — Magazine spread

Direction: high-end print magazine. Bold and asymmetric.

- Full bleed with strong typographic grid
- Large number or category identifier (left side, huge, semi-transparent)
- Title breaks the grid intentionally
- `DM Serif Display` for display text

### Subtask 8.6 — Preview generation

After each template is written:
```bash
pnpm template:preview --id sunset    # → templates/free/sunset.preview.png
pnpm template:preview --id minimal
pnpm template:preview --id dark
pnpm template:preview --id glass
pnpm template:preview --id editorial
```

All previews at `1200×630`. Commit the PNG files.

**Acceptance:** Every template renders at all declared sizes without error. No text overflow. No layout breaks.

---

## TASK 9 — apps/web (Simple Editor)

**Scope:** Demo editor only. No auth, no payments, no accounts.
Points at `NEXT_PUBLIC_API_URL` — works locally against the worker, in production against the hosted API.

### Design system

```css
:root {
  --bg-base:       #0c0c0e;
  --bg-surface:    #141416;
  --bg-elevated:   #1c1c1f;
  --border-subtle: #242428;
  --border-default:#2e2e33;
  --text-primary:  #f0eff2;
  --text-secondary:#8b8a94;
  --text-tertiary: #55545e;
  --accent:        #e8a020;
  --accent-dim:    rgba(232, 160, 32, 0.12);
  --font-display:  'Bricolage Grotesque', sans-serif;
  --font-body:     'Geist', sans-serif;
  --font-mono:     'Geist Mono', monospace;
  --radius-md:     8px;
  --radius-lg:     12px;
}
```

### Subtask 9.1 — Layout + navigation
- 48px nav: logo left, links center, GitHub star right
- No sidebar — full-width layouts only

### Subtask 9.2 — Gallery (`/templates`)
- Static previews only — NEVER hit `/api/og` on gallery load
- Masonry grid, 3 cols desktop
- Pro templates show lock icon + "unlock at og-engine.com"
- Filter by tag, search by name

### Subtask 9.3 — Editor (`/`)

**Two-panel layout:**

Left panel (380px, independently scrollable):
- Template selector (thumbnail + name)
- Dynamic form from schema:
  - `string` → input + char counter
  - `text` → auto-resize textarea
  - `color` → color swatch + hex input
  - `enum` → segmented control
  - `boolean` → toggle
  - `image` → URL input + thumbnail preview
- Size selector (platform pills)
- Font picker

Right panel (fills remaining width, sticky):
- Preview pane — **aspect-ratio locked container, zero layout shift**
- Checkerboard background for transparency
- 500ms debounce — never fires on every keystroke
- Skeleton while loading, error state on failure
- URL builder below: generated URL + copy button + copy meta tags
- On copy: silently `fetch(url, { priority: 'low' })` to pre-warm cache

**Fix: aspect-ratio container (no more offset on title change)**
```tsx
<div style={{
  position: 'relative',
  width: '100%',
  paddingTop: `${(height / width) * 100}%`,  // locks ratio
  overflow: 'hidden',
}}>
  <img style={{
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  }} />
</div>
```

### Subtask 9.4 — Mobile
- Stacked layout: preview on top, form below
- Each section independently scrollable
- Touch targets minimum 44×44px

### Subtask 9.5 — Micro-interactions
- Field focus: accent border glow, 150ms
- Template card hover: `translateY(-3px)` + shadow, 200ms
- Copy button: scale pulse on click, "✓ Copied" 2s dismiss
- Preview swap: opacity crossfade 200ms
- Page load: staggered content reveal

**Acceptance:** No layout shift on any input change. Lighthouse ≥ 90. `pnpm dev` starts clean.

---

## TASK 10 — OSS Code Quality

**Do this across all files in `packages/`. Do not skip any.**

### Subtask 10.1 — JSDoc on every exported symbol
Every exported function, interface, type, constant gets a doc block with `@param`, `@returns`, `@throws`, `@example`. See Task 2 for format.

### Subtask 10.2 — Zero `any` in packages
Run `pnpm typecheck`. Fix every `any`. Use `unknown` + type guards where runtime types are genuinely unknown.

### Subtask 10.3 — Remove dead code
Run `npx knip`. Fix every finding. Remove all commented-out code. Remove all `console.log`.

### Subtask 10.4 — Explicit barrel exports
No wildcard `export *` in any `packages/*/src/index.ts`.

### Subtask 10.5 — File-level header comments
Every source file in `packages/` gets a `@file`, `@description`, `@module` header.

### Subtask 10.6 — ESLint enforcement
Add and fix all violations:
```javascript
'@typescript-eslint/no-explicit-any': 'error',
'@typescript-eslint/no-unused-vars': 'error',
'no-console': 'error',
'no-eval': 'error',
'no-new-func': 'error',
'jsdoc/require-jsdoc': ['error', { publicOnly: true }],
```

### Subtask 10.7 — Per-package READMEs
Each `packages/*/README.md`: what it does, install, basic usage, API reference.

**Acceptance:** `pnpm lint` zero warnings. `npx knip` zero findings. `pnpm typecheck` zero errors.

---

## TASK 11 — CI/Release Pipeline

### Subtask 11.1 — Changesets
```bash
pnpm add -DW @changesets/cli && pnpm changeset init
```

Published: all `packages/*`
Ignored: `apps/*`

### Subtask 11.2 — Template security scan
`.github/workflows/template-scan.yml` — triggers on `templates/**` changes:
- AST scan: block `eval`, `Function(`, dynamic import, `fetch`, `process`, `fs`
- Bundle size: < 50kb gzipped per template
- Render test: all declared sizes, < 50ms each
- Upload preview PNGs as artifacts for human review

### Subtask 11.3 — PR checks
`.github/workflows/pr.yml` — all PRs:
- typecheck → lint → test → build
- Fail fast on typecheck

### Subtask 11.4 — Release workflow
`.github/workflows/release.yml` — push to main:
- build → test → publish via changesets action

---

## TASK 12 — Documentation

### Subtask 12.1 — Root README
```
# og-engine
[badges: npm, license, CI]
## Quick start (5 lines)
## Templates (3 screenshots)
## Platform sizes (table)
## Self-hosting (CF | Railway | Docker)
## Contributing templates
## Packages (table with version badges)
## License: MIT
```

### Subtask 12.2 — CONTRIBUTING.md
- How to add a free template
- The OGTemplate interface
- Satori CSS limitations (prominent section)
- How to run CI scan locally
- PR checklist
- CLA: "By submitting, you grant og-engine irrevocable license to include this template"

### Subtask 12.3 — In-app docs (`apps/web/app/docs/`)
- `getting-started.mdx`
- `api-reference.mdx`
- `platforms.mdx`
- `contributing-templates.mdx`
- `self-hosting.mdx`
- `limitations.mdx` — Satori subset, WASM overhead, RTL, emoji

---

## Build Order

```
1. packages/types
2. packages/core
3. packages/adapter-node
4. packages/adapter-cloudflare
5. packages/adapter-vercel
6. packages/sdk
7. templates/free/*
8. templates/pro/*
9. apps/web
```

---

## Hard Rules

- Tests pass after every subtask commit
- Never delete before replacement is proven
- Zero `any` in `packages/`
- No `console.log` in production code
- Every exported symbol has a JSDoc block
- 500ms debounce on preview — always
- Preview uses aspect-ratio container — no layout shift ever
- Gallery uses static `preview.png` — never `/api/og` on load
- Template IDs are checked for duplicates at registry startup
- `"private": true` on `apps/*`