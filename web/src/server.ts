import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { nodeAdapter, staticRegistry } from '@og-engine/adapter-node';
import { createHandler } from '@og-engine/core';
import {
  PLATFORM_SIZES,
  type OGRequest,
  type OGTemplate,
  type PlatformSize,
  type TemplateSchema
} from '@og-engine/types';
import sunset from '../../templates/free/sunset.js';
import minimal from '../../templates/free/minimal.js';
import dark from '../../templates/free/dark.js';
import glass from '../../templates/pro/glass.js';
import editorial from '../../templates/pro/editorial.js';

const PORT = Number(process.env.PORT ?? 3000);
const PLATFORM_SIZE_KEYS = Object.keys(PLATFORM_SIZES) as PlatformSize[];
const registry = staticRegistry([
  sunset as unknown as OGTemplate,
  minimal as unknown as OGTemplate,
  dark as unknown as OGTemplate,
  glass as unknown as OGTemplate,
  editorial as unknown as OGTemplate
]);

function parseSize(value: string | null): PlatformSize {
  if (value && PLATFORM_SIZE_KEYS.includes(value as PlatformSize)) {
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

function toTemplateRoot(): string {
  const candidateA = resolve(process.cwd(), '../templates');
  if (existsSync(candidateA)) {
    return candidateA;
  }
  return resolve(process.cwd(), 'templates');
}

function findPreviewFile(id: string): { data: Buffer; type: string } | null {
  const root = toTemplateRoot();
  const candidates = [
    { path: join(root, 'free', `${id}.preview.png`), type: 'image/png' },
    { path: join(root, 'free', `${id}.preview.svg`), type: 'image/svg+xml' },
    { path: join(root, 'pro', `${id}.preview.png`), type: 'image/png' },
    { path: join(root, 'pro', `${id}.preview.svg`), type: 'image/svg+xml' }
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate.path)) {
      return { data: readFileSync(candidate.path), type: candidate.type };
    }
  }

  return null;
}

function editorPageHtml(): string {
  const platformJson = JSON.stringify(PLATFORM_SIZES);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OG Engine Editor</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0c1018;
      --panel: #131a24;
      --line: #283246;
      --text: #e5edf8;
      --muted: #97a5bb;
      --accent: #ffcd4a;
      --accentText: #161616;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top right, #182030 0%, var(--bg) 45%);
      color: var(--text);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      min-height: 100vh;
    }
    .shell {
      display: grid;
      grid-template-columns: 340px 1fr;
      min-height: 100vh;
    }
    .panel {
      border-right: 1px solid var(--line);
      background: rgba(19, 26, 36, 0.9);
      padding: 20px;
      overflow-y: auto;
    }
    .content {
      padding: 24px;
      display: grid;
      grid-template-rows: auto auto 1fr;
      gap: 16px;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 18px;
    }
    h2 {
      margin: 18px 0 10px;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    label { display: block; margin-bottom: 8px; font-size: 12px; color: var(--muted); }
    input, select, textarea, button {
      width: 100%;
      border: 1px solid var(--line);
      background: #0f1620;
      color: var(--text);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
    }
    textarea { min-height: 80px; }
    button {
      cursor: pointer;
      background: var(--accent);
      color: var(--accentText);
      border: 0;
      font-weight: 700;
    }
    .muted {
      font-size: 12px;
      color: var(--muted);
    }
    .row { margin-bottom: 12px; }
    .previewWrap {
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
      background: #0b111a;
      display: grid;
      place-items: center;
      min-height: 360px;
    }
    img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
    }
    code {
      display: block;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #0f1620;
      color: #b4f6b8;
      overflow-x: auto;
      white-space: nowrap;
    }
    @media (max-width: 920px) {
      .shell { grid-template-columns: 1fr; }
      .panel { border-right: 0; border-bottom: 1px solid var(--line); }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="panel">
      <h1>OG Engine Editor</h1>
      <div class="row">
        <label for="template">Template</label>
        <select id="template"></select>
      </div>
      <div class="row">
        <label for="size">Size</label>
        <select id="size"></select>
      </div>
      <h2>Parameters</h2>
      <form id="params"></form>
      <button id="refresh" type="button">Refresh Preview</button>
      <div style="height: 8px"></div>
      <button id="copy" type="button">Copy URL</button>
      <p class="muted" style="margin-top: 12px">Server uses the Node adapter and runs on port 3000 by default.</p>
    </aside>

    <main class="content">
      <div class="muted">Live Preview</div>
      <code id="url"></code>
      <div class="previewWrap">
        <img id="preview" alt="OG preview" />
      </div>
    </main>
  </div>

  <script>
    const platformSizes = ${platformJson};
    const templateSelect = document.getElementById('template');
    const sizeSelect = document.getElementById('size');
    const paramsForm = document.getElementById('params');
    const preview = document.getElementById('preview');
    const urlNode = document.getElementById('url');
    const refreshBtn = document.getElementById('refresh');
    const copyBtn = document.getElementById('copy');

    let templates = [];
    let selectedTemplate = null;
    let params = {};

    function defaultsFromSchema(schema) {
      const out = {};
      for (const key of Object.keys(schema)) {
        const field = schema[key];
        out[key] = field.default !== undefined ? String(field.default) : '';
      }
      return out;
    }

    function buildUrl() {
      const qp = new URLSearchParams();
      qp.set('template', selectedTemplate.id);
      qp.set('size', sizeSelect.value || 'og');
      qp.set('format', 'png');
      qp.set('_t', String(Date.now()));

      for (const [k, v] of Object.entries(params)) {
        if (v !== '' && v !== undefined && v !== null) {
          qp.set(k, String(v));
        }
      }

      return '/api/og?' + qp.toString();
    }

    function renderParams() {
      paramsForm.innerHTML = '';
      const schema = selectedTemplate.schema;

      for (const key of Object.keys(schema)) {
        const field = schema[key];
        const row = document.createElement('div');
        row.className = 'row';

        const label = document.createElement('label');
        label.textContent = key;
        row.appendChild(label);

        let input;
        if (field.type === 'enum') {
          input = document.createElement('select');
          for (const value of field.values) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            input.appendChild(option);
          }
          input.value = params[key] || field.values[0];
        } else if (field.type === 'text') {
          input = document.createElement('textarea');
          input.value = params[key] || '';
        } else if (field.type === 'color') {
          input = document.createElement('input');
          input.type = 'color';
          input.value = params[key] || '#000000';
        } else if (field.type === 'boolean') {
          input = document.createElement('select');
          input.innerHTML = '<option value="true">true</option><option value="false">false</option>';
          input.value = params[key] || 'false';
        } else {
          input = document.createElement('input');
          input.type = 'text';
          input.value = params[key] || '';
        }

        input.addEventListener('input', () => {
          params[key] = input.value;
          updatePreview();
        });

        row.appendChild(input);
        paramsForm.appendChild(row);
      }
    }

    function updatePreview() {
      const path = buildUrl();
      const full = window.location.origin + path;
      preview.src = path;
      urlNode.textContent = full;
    }

    function setupSizes() {
      sizeSelect.innerHTML = '';
      for (const [id, meta] of Object.entries(platformSizes)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = meta.label + ' (' + meta.width + 'x' + meta.height + ')';
        sizeSelect.appendChild(option);
      }
      sizeSelect.value = 'og';
      sizeSelect.addEventListener('change', updatePreview);
    }

    async function boot() {
      const response = await fetch('/api/templates');
      templates = await response.json();

      templateSelect.innerHTML = '';
      for (const template of templates) {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        templateSelect.appendChild(option);
      }

      selectedTemplate = templates[0];
      params = defaultsFromSchema(selectedTemplate.schema);
      renderParams();
      updatePreview();

      templateSelect.addEventListener('change', () => {
        selectedTemplate = templates.find((template) => template.id === templateSelect.value) || templates[0];
        params = defaultsFromSchema(selectedTemplate.schema);
        renderParams();
        updatePreview();
      });

      refreshBtn.addEventListener('click', updatePreview);
      copyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(urlNode.textContent || '');
        copyBtn.textContent = 'Copied';
        setTimeout(() => {
          copyBtn.textContent = 'Copy URL';
        }, 1200);
      });
    }

    setupSizes();
    boot().catch((error) => {
      paramsForm.innerHTML = '<p class="muted">Failed to load templates: ' + String(error) + '</p>';
    });
  </script>
</body>
</html>`;
}

async function listTemplates() {
  const list = await registry.list();

  return Promise.all(
    list.map(async (item) => {
      const template = await registry.get(item.id);
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        supportedSizes: item.supportedSizes,
        schema: template.schema as TemplateSchema
      };
    })
  );
}

function writeJson(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

async function handleOg(requestUrl: URL): Promise<Response> {
  const template = requestUrl.searchParams.get('template');
  if (!template) {
    return new Response('Missing template', { status: 400 });
  }

  const params: Record<string, string> = {};
  requestUrl.searchParams.forEach((value, key) => {
    if (!['template', 'size', 'format', '_t'].includes(key)) {
      params[key] = value;
    }
  });

  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
  const adapter = nodeAdapter({
    storageDir: './.og-cache',
    baseUrl,
    registry
  });
  const handler = createHandler({ platform: adapter });

  const ogReq: OGRequest = {
    template,
    size: parseSize(requestUrl.searchParams.get('size')),
    format: parseFormat(requestUrl.searchParams.get('format')),
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

const server = createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? `localhost:${PORT}`}`);

  if (method === 'GET' && requestUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(editorPageHtml());
    return;
  }

  if (method === 'GET' && requestUrl.pathname === '/api/templates') {
    try {
      const templates = await listTemplates();
      const response = writeJson(200, templates);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(await response.text());
    } catch (error) {
      const response = writeJson(500, { error: error instanceof Error ? error.message : 'Internal error' });
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      res.end(await response.text());
    }
    return;
  }

  if (method === 'GET' && requestUrl.pathname.startsWith('/api/templates/') && requestUrl.pathname.endsWith('/preview')) {
    const id = decodeURIComponent(requestUrl.pathname.replace('/api/templates/', '').replace('/preview', '').replace(/\/$/, ''));
    const preview = findPreviewFile(id);
    if (!preview) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    res.writeHead(200, { 'Content-Type': preview.type });
    res.end(preview.data);
    return;
  }

  if (method === 'GET' && requestUrl.pathname === '/api/og') {
    const response = await handleOg(requestUrl);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));

    if (response.body) {
      const arrayBuffer = await response.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } else {
      res.end();
    }
    return;
  }

  if (method === 'GET' && requestUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

(async () => {
  await mkdir(resolve(process.cwd(), '.og-cache'), { recursive: true });
  server.listen(PORT, () => {
    console.log(`web editor running at http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    await new Promise<void>((resolveDone) => {
      server.close(() => resolveDone());
    });
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });
})();

export { PORT };
