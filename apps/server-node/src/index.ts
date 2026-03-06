import express, { type Request, type Response } from 'express';

const app = express();

app.get('/health', (_request: Request, response: Response) => {
  response.json({ ok: true });
});

app.listen(process.env.PORT ?? 3000);
