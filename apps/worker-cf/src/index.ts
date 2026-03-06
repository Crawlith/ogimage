import { cloudflareAdapter } from '@og-engine/adapter-cloudflare';
import { createHandler } from '@og-engine/core';
import type { MetaRequest, OGRequest, PlatformSize } from '@og-engine/types';
import { Hono } from 'hono';

type Bindings = {
  KV: KVNamespace;
  BUCKET: R2Bucket;
  PUBLIC_BASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const PLATFORM_SIZES: ReadonlyArray<PlatformSize> = [
  'twitter-og',
  'facebook-og',
  'linkedin-og',
  'ig-post',
  'ig-story',
  'discord',
  'whatsapp',
  'github',
  'og'
];

function parseSize(value: string | undefined): PlatformSize {
  if (value && PLATFORM_SIZES.includes(value as PlatformSize)) {
    return value as PlatformSize;
  }

  return 'og';
}

function parseFormat(value: string | undefined): OGRequest['format'] {
  if (value === 'jpeg' || value === 'png') {
    return value;
  }

  return 'png';
}

app.get('/health', (context) => context.json({ ok: true }));

app.get('/api/og', async (context) => {
  const adapter = cloudflareAdapter({
    KV: context.env.KV,
    BUCKET: context.env.BUCKET,
    PUBLIC_BASE_URL: context.env.PUBLIC_BASE_URL
  });

  const handler = createHandler({ platform: adapter });
  const { template, size, format, ...params } = context.req.query();

  if (!template) {
    return context.text('Missing template parameter', 400);
  }

  const ogReq: OGRequest = {
    template,
    size: parseSize(size),
    format: parseFormat(format),
    params: params as Record<string, string>
  };

  const { buffer, contentType, headers } = await handler.handleImageRequest(ogReq);

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      ...headers
    }
  });
});

app.get('/api/meta', async (context) => {
  const adapter = cloudflareAdapter({
    KV: context.env.KV,
    BUCKET: context.env.BUCKET,
    PUBLIC_BASE_URL: context.env.PUBLIC_BASE_URL
  });

  const handler = createHandler({ platform: adapter });
  const { template, size, ...params } = context.req.query();

  if (!template) {
    return context.text('Missing template parameter', 400);
  }

  const metaReq: MetaRequest = {
    template,
    size: parseSize(size),
    params: params as Record<string, string>,
    baseUrl: new URL(context.req.url).origin
  };

  const meta = await handler.handleMetaRequest(metaReq);
  return context.json(meta);
});

export default app;
