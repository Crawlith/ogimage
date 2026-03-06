# @og-engine/types

Shared TypeScript contracts for `og-engine` packages. This package contains strongly-typed interfaces and utility types for template definitions, render requests, platform adapters, and metadata responses used by core and adapter packages.

## Installation

```bash
pnpm add @og-engine/types
```

## Basic usage

```ts
import type { OGTemplate, PlatformSize, TemplateSchema } from '@og-engine/types';

const schema = {
  title: { type: 'string', required: true, maxLength: 120 }
} satisfies TemplateSchema;

const template: OGTemplate<typeof schema> = {
  id: 'example',
  name: 'Example',
  description: 'Example template',
  author: 'og-engine',
  version: '1.0.0',
  supportedSizes: ['og' satisfies PlatformSize],
  schema,
  render: ({ title }) => <div>{title}</div>
};
```

## API reference

- `PLATFORM_SIZES`: canonical size map for supported social platforms.
- `PlatformSize`: union of supported size keys.
- `TemplateSchema`, `SchemaFieldType`, `InferParams`: schema/typing helpers for templates.
- `OGTemplate`, `TemplateMetadata`, `RenderContext`: template contracts.
- `StorageAdapter`, `CacheAdapter`, `TemplateRegistryAdapter`, `PlatformAdapter`: integration interfaces.
- `OGRequest`, `MetaRequest`, `MetaResponse`: request/response payload types.

## Used by

- `@og-engine/core`
- `@og-engine/adapter-node`
- `@og-engine/adapter-cloudflare`
- `@og-engine/adapter-vercel`
- template packages under `templates/*`
- apps under `apps/*`
