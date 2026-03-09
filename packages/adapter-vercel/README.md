# @og-engine/adapter-vercel

Vercel-focused adapter for `og-engine`.

This package currently delegates to `@og-engine/adapter-node`, so you can use Node-compatible storage/cache wiring while deploying on Vercel.

## Installation

```bash
pnpm add @og-engine/adapter-vercel @og-engine/core @og-engine/types
```

## Usage

```ts
import { vercelAdapter } from '@og-engine/adapter-vercel';
import { staticRegistry } from '@og-engine/adapter-node';
import { createHandler } from '@og-engine/core';
import type { OGTemplate } from '@og-engine/types';

const templates: OGTemplate[] = [/* your templates */];

const platform = vercelAdapter({
  storageDir: './.og-cache',
  baseUrl: 'https://your-app.vercel.app',
  registry: staticRegistry(templates)
});

const handler = createHandler({ platform });
```

## Exports

- `vercelAdapter(options)`
- `VercelAdapterOptions`
