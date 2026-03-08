# @og-engine/sdk

Zero-dependency SDK for `og-engine`. Provides lightweight utilities for building OG image URLs and metadata URLs for use in frontends (Next.js, Astro, Remix, etc.) or backends.

## Installation

```bash
pnpm add @og-engine/sdk
```

## Basic usage

### 1. Build an OG image URL

```ts
import { buildOgUrl } from '@og-engine/sdk';

const url = buildOgUrl({
  baseUrl: 'https://og.example.com',
  template: 'sunset',
  params: {
    title: 'Hello from SDK',
    author: 'og-engine'
  }
});
// → 'https://og.example.com/api/og?template=sunset&size=og&format=png&title=Hello+from+SDK&author=og-engine'
```

### 2. Build metadata URL (for og:image tags)

```ts
import { buildMetaUrl } from '@og-engine/sdk';

const url = buildMetaUrl({
  baseUrl: 'https://og.example.com',
  template: 'minimal',
  params: { title: 'Pricing' }
});
// → 'https://og.example.com/api/meta?template=minimal&size=og&format=json&title=Pricing'
```

## API reference

### `buildOgUrl(options)`
Builds a fully qualified `og-engine` image URL.
- `options.baseUrl`: Base URL of the hosted engine.
- `options.template`: Template ID.
- `options.size`: Platform size preset (default: 'og').
- `options.format`: Output format (default: 'png').
- `options.params`: Key-value map of template-specific parameters.

### `buildMetaUrl(options)`
Builds a fully qualified `og-engine` metadata URL.
- `options.baseUrl`: Base URL of the hosted engine.
- `options.template`: Template ID.
- `options.size`: Platform size preset (default: 'og').
- `options.format`: Metadata response format ('json' or 'html', default: 'json').
- `options.params`: Key-value map of template-specific parameters.

## Dependencies

This package has **zero** external dependencies and can run in any JavaScript environment (Browser, Node.js, Edge, Deno).
