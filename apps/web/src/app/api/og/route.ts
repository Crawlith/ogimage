import { NextRequest } from 'next/server';
import { nodeAdapter } from '@og-engine/adapter-node';
import { createHandler } from '@og-engine/core';
import type { OGRequest } from '@og-engine/types';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const template = searchParams.get('template');
    const size = searchParams.get('size') || 'og';
    const format = searchParams.get('format') || 'png';

    if (!template) {
        return new Response('Missing template', { status: 400 });
    }

    // Extract all other params
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        if (!['template', 'size', 'format'].includes(key)) {
            params[key] = value;
        }
    });

    const adapter = nodeAdapter({
        storageDir: './.og-cache',
        baseUrl: req.nextUrl.origin
    });

    const handler = createHandler({ platform: adapter });

    const ogReq: OGRequest = {
        template,
        size: size as any,
        format: format as any,
        params
    };

    try {
        const { buffer, contentType, headers } = await handler.handleImageRequest(ogReq);

        return new Response(buffer as any, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                ...headers
            }
        });
    } catch (err) {
        console.error('API Error details:', err);
        return new Response(err instanceof Error ? err.message : 'Internal error', { status: 500 });
    }
}
