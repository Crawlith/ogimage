import { Hono } from 'hono';
import { cloudflareAdapter } from '@og-engine/adapter-cloudflare';
import { createHandler } from '@og-engine/core';
import type { OGRequest, MetaRequest } from '@og-engine/types';

type Bindings = {
    KV: KVNamespace;
    BUCKET: R2Bucket;
    PUBLIC_BASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (context) => context.json({ ok: true }));

app.get('/api/og', async (context) => {
    const adapter = cloudflareAdapter({
        KV: context.env.KV,
        BUCKET: context.env.BUCKET,
        PUBLIC_BASE_URL: context.env.PUBLIC_BASE_URL
    });

    const handler = createHandler({ platform: adapter });

    const { template, size = 'og', format = 'png', ...params } = context.req.query();

    if (!template) {
        return context.text('Missing template parameter', 400);
    }

    const ogReq: OGRequest = {
        template,
        size: size as any,
        format: format as any,
        params: params as Record<string, string>
    };

    const { buffer, contentType, headers } = await handler.handleImageRequest(ogReq);

    return context.body(buffer as any, {
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

    const { template, size = 'og', ...params } = context.req.query();

    if (!template) {
        return context.text('Missing template parameter', 400);
    }

    const metaReq: MetaRequest = {
        template,
        size: size as any,
        params: params as Record<string, string>,
        baseUrl: new URL(context.req.url).origin
    };

    const meta = await handler.handleMetaRequest(metaReq);

    return context.json(meta);
});

export default app;
