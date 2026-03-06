import express, { type Request, type Response } from 'express';
import { nodeAdapter } from '@og-engine/adapter-node';
import { createHandler } from '@og-engine/core';
import type { OGRequest, MetaRequest } from '@og-engine/types';

const app = express();
const port = process.env.PORT ?? 3000;

const adapter = nodeAdapter({
  storageDir: process.env.STORAGE_DIR ?? './.og-cache',
  baseUrl: process.env.BASE_URL ?? `http://localhost:${port}`
});

const handler = createHandler({ platform: adapter });

app.get('/health', (_request: Request, response: Response) => {
  response.json({ ok: true });
});

app.get('/api/og', async (req: Request, res: Response) => {
  try {
    const { template, size = 'og', format = 'png', ...params } = req.query;

    if (!template) {
      return res.status(400).send('Missing template parameter');
    }

    const ogReq: OGRequest = {
      template: template as string,
      size: size as any,
      format: format as any,
      params: params as Record<string, string>
    };

    const { buffer, contentType, headers } = await handler.handleImageRequest(ogReq);

    res.set({
      'Content-Type': contentType,
      ...headers
    });
    res.send(buffer);
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).send(error instanceof Error ? error.message : 'Internal Server Error');
  }
});

app.get('/api/meta', async (req: Request, res: Response) => {
  try {
    const { template, size = 'og', ...params } = req.query;

    if (!template) {
      return res.status(400).send('Missing template parameter');
    }

    const metaReq: MetaRequest = {
      template: template as string,
      size: size as any,
      params: params as Record<string, string>,
      baseUrl: `${req.protocol}://${req.get('host')}`
    };

    const meta = await handler.handleMetaRequest(metaReq);
    res.json(meta);
  } catch (error) {
    console.error('Meta error:', error);
    res.status(500).send(error instanceof Error ? error.message : 'Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
