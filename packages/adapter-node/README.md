# @og-engine/adapter-node

Node.js platform adapter primitives for `og-engine`.

This package provides:
- filesystem storage (`fileSystemStorage`)
- in-memory cache (`memoryCache`)
- in-memory template registry helper (`staticRegistry`)
- composed adapter factory (`nodeAdapter`)

## Installation

```bash
pnpm add @og-engine/adapter-node @og-engine/core @og-engine/types
```

## Usage

```ts
import { nodeAdapter, staticRegistry } from '@og-engine/adapter-node';
import { createHandler } from '@og-engine/core';
import type { OGTemplate } from '@og-engine/types';

const templates: OGTemplate[] = [/* your templates */];

const platform = nodeAdapter({
  storageDir: './.og-cache',
  baseUrl: 'http://localhost:3000',
  registry: staticRegistry(templates)
});

const handler = createHandler({ platform });
```

## Exports

- `fileSystemStorage(dir, baseUrl)`
- `memoryCache()`
- `staticRegistry(templates)`
- `nodeAdapter(options)`
