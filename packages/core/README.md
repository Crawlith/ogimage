# @og-engine/core

Core rendering and request handling primitives for `og-engine`. This package converts typed template inputs into rendered OG images, generates metadata payloads, and coordinates storage/cache behavior via adapter interfaces.

## Installation

```bash
pnpm add @og-engine/core
```

## Basic usage

```ts
import { createHandler } from '@og-engine/core';
import type { PlatformAdapter } from '@og-engine/types';

const platform: PlatformAdapter = {
  storage: /* your storage adapter */,
  cache: /* your cache adapter */,
  registry: /* your template registry */
};

const handler = createHandler({ platform });
const image = await handler.handleImageRequest({
  template: 'sunset',
  size: 'og',
  params: { title: 'Hello' }
});
```

## API reference

- `createHandler(deps)`: creates image/meta handlers.
- `render(req, template, fonts)`: runs the render pipeline.
- `coerceParams(raw, schema)`: validates/coerces raw params.
- `buildCacheKey(req, templateVersion)`: deterministic cache key generator.
- `getDefaultFonts()`, `loadFont(name, url)`: font loading helpers.
- `initWasm()`, `getResvg()`: runtime WASM/bootstrap helpers.

## Used by

- `@og-engine/adapter-node`
- `@og-engine/adapter-cloudflare`
- `@og-engine/adapter-vercel`
- `apps/web`
- `apps/worker-cf`
- `apps/server-node`
