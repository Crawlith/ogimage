import { NextRequest } from 'next/server';
import { nodeAdapter } from '@og-engine/adapter-node';
import { createHandler } from '@og-engine/core';
import type { OGRequest, PlatformSize } from '@og-engine/types';


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

function parseSize(value: string | null): PlatformSize {
  if (value && PLATFORM_SIZES.includes(value as PlatformSize)) {
    return value as PlatformSize;
  }

  return 'og';
}

function parseFormat(value: string | null): OGRequest['format'] {
  if (value === 'jpeg' || value === 'png') {
    return value;
  }

  return 'png';
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const template = searchParams.get('template');
    const size = searchParams.get('size');
    const format = searchParams.get('format');

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
        size: parseSize(size),
        format: parseFormat(format),
        params
    };

    try {
        const { buffer, contentType, headers } = await handler.handleImageRequest(ogReq);

        return new Response(buffer as unknown as BodyInit, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                ...headers
            }
        });
    } catch (error) {
        return new Response(error instanceof Error ? error.message : 'Internal error', { status: 500 });
    }
}
