import { nodeAdapter } from '@og-engine/adapter-node';
import { createHandler } from '@og-engine/core';
import type { MetaRequest, OGRequest, PlatformSize } from '@og-engine/types';
import express, { type Request, type Response } from 'express';

const app = express();
const port = process.env.PORT ?? 3001;

const adapter = nodeAdapter({
  storageDir: process.env.STORAGE_DIR ?? './.og-cache',
  baseUrl: process.env.BASE_URL ?? `http://localhost:${port}`
});

const handler = createHandler({ platform: adapter });
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

function parseSize(value: unknown): PlatformSize {
  if (typeof value === 'string' && PLATFORM_SIZES.includes(value as PlatformSize)) {
    return value as PlatformSize;
  }

  return 'og';
}

function parseFormat(value: unknown): OGRequest['format'] {
  if (value === 'jpeg' || value === 'png') {
    return value;
  }

  return 'png';
}

app.get('/health', (_request: Request, response: Response) => {
  response.json({ ok: true });
});

app.get('/api/og', async (req: Request, res: Response) => {
  try {
    const { template, size, format, ...params } = req.query;

    if (!template || typeof template !== 'string') {
      return res.status(400).send('Missing template parameter');
    }

    const ogReq: OGRequest = {
      template,
      size: parseSize(size),
      format: parseFormat(format),
      params: params as Record<string, string>
    };

    const { buffer, contentType, headers } = await handler.handleImageRequest(ogReq);

    res.set({
      'Content-Type': contentType,
      ...headers
    });
    res.send(buffer);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Internal Server Error');
  }
});

app.get('/api/meta', async (req: Request, res: Response) => {
  try {
    const { template, size, ...params } = req.query;

    if (!template || typeof template !== 'string') {
      return res.status(400).send('Missing template parameter');
    }

    const metaReq: MetaRequest = {
      template,
      size: parseSize(size),
      params: params as Record<string, string>,
      baseUrl: `${req.protocol}://${req.get('host')}`
    };

    const meta = await handler.handleMetaRequest(metaReq);
    res.json(meta);
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Internal Server Error');
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[og-engine] Node server listening on http://localhost:${port}`);
});
