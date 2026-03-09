# @og-engine/adapter-cloudflare

Cloudflare platform adapter primitives for `og-engine`.

This package provides:
- R2 storage adapter (`cloudflareStorage`)
- KV cache adapter (`cloudflareCache`)
- in-memory template registry helper (`cloudflareRegistry`)
- composed adapter factory (`cloudflareAdapter`)

## Installation

```bash
pnpm add @og-engine/adapter-cloudflare @og-engine/core @og-engine/types
```

## Usage

```ts
import { cloudflareAdapter, cloudflareRegistry } from '@og-engine/adapter-cloudflare';
import { createHandler } from '@og-engine/core';
import type { OGTemplate } from '@og-engine/types';

const templates: OGTemplate[] = [/* your templates */];

const platform = cloudflareAdapter({
  KV: env.KV,
  BUCKET: env.BUCKET,
  PUBLIC_BASE_URL: env.PUBLIC_BASE_URL,
  registry: cloudflareRegistry(templates)
});

const handler = createHandler({ platform });
```

## Exports

- `cloudflareStorage(bucket, publicBaseUrl)`
- `cloudflareCache(kv)`
- `cloudflareRegistry(templates)`
- `cloudflareAdapter(bindings)`
