import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { OGEngineError, type TemplateSchema } from '@og-engine/types';
import { fetchImageAsDataUri, processImageParams, validateImageUrl } from './images.js';

function response(options: {
  ok?: boolean;
  statusText?: string;
  headers?: Record<string, string>;
  body?: Uint8Array;
  text?: string;
}) {
  const hdrs = new Headers(options.headers ?? {});
  const body = options.body ?? new Uint8Array();
  return {
    ok: options.ok ?? true,
    statusText: options.statusText ?? 'OK',
    headers: hdrs,
    arrayBuffer: vi.fn(async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)),
    text: vi.fn(async () => options.text ?? '')
  };
}

describe('images', () => {
  const fetchMock = vi.fn();
  const originalBuffer = globalThis.Buffer;

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'Buffer', {
      value: originalBuffer,
      configurable: true,
      writable: true
    });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchMock.mockReset();
  });

  it('blocks unsupported protocols and private hostnames/ranges', async () => {
    await expect(validateImageUrl('ftp://example.com/a.png')).rejects.toThrow('Only http and https');
    await expect(validateImageUrl('http://localhost/a.png')).rejects.toThrow('Unsafe hostname blocked');
    await expect(validateImageUrl('http://10.1.1.1/a.png')).rejects.toThrow('Private IP range blocked');
    await expect(validateImageUrl('http://192.168.1.1/a.png')).rejects.toThrow('Private IP range blocked');
    await expect(validateImageUrl('http://172.16.0.1/a.png')).rejects.toThrow('Private IP range blocked');
    await expect(validateImageUrl('http://169.254.0.1/a.png')).rejects.toThrow('Link-local IP blocked');
  });

  it('blocks HEAD responses above 5MB', async () => {
    fetchMock.mockResolvedValue(response({ headers: { 'content-length': String(6 * 1024 * 1024) } }));

    await expect(validateImageUrl('https://example.com/a.png')).rejects.toMatchObject({
      code: 'INVALID_PARAM',
      status: 413
    });
  });

  it('swallows HEAD failures and proceeds', async () => {
    fetchMock.mockRejectedValueOnce(new Error('head blocked'));
    fetchMock.mockResolvedValueOnce(
      response({
        headers: { 'content-type': 'image/png' },
        body: new TextEncoder().encode('png-bytes')
      })
    );

    const uri = await fetchImageAsDataUri('https://example.com/a.png');
    expect(uri.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('proceeds when HEAD responds non-ok', async () => {
    fetchMock.mockResolvedValueOnce(response({ ok: false }));
    fetchMock.mockResolvedValueOnce(
      response({
        headers: { 'content-type': 'image/png' },
        body: new TextEncoder().encode('png-bytes')
      })
    );

    const uri = await fetchImageAsDataUri('https://example.com/non-ok-head.png');
    expect(uri.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('wraps generic fetch failures as RENDER_FAILED', async () => {
    fetchMock.mockResolvedValueOnce(response({ headers: { 'content-length': '10' } }));
    fetchMock.mockResolvedValueOnce(response({ ok: false, statusText: 'Nope' }));

    await expect(fetchImageAsDataUri('https://example.com/b.png')).rejects.toMatchObject({
      code: 'RENDER_FAILED',
      status: 424
    });
  });

  it('wraps non-Error failures with Unknown error message', async () => {
    fetchMock.mockResolvedValueOnce(response({ headers: { 'content-length': '10' } }));
    fetchMock.mockRejectedValueOnce('boom');

    await expect(fetchImageAsDataUri('https://example.com/non-error.png')).rejects.toThrow(
      'Unknown error'
    );
  });

  it('rethrows OGEngineError from post-download size check', async () => {
    fetchMock.mockResolvedValueOnce(response({ headers: { 'content-length': '10' } }));
    fetchMock.mockResolvedValueOnce(response({ body: new Uint8Array(6 * 1024 * 1024) }));

    await expect(fetchImageAsDataUri('https://example.com/c.png')).rejects.toMatchObject({
      code: 'INVALID_PARAM',
      status: 413
    });
  });

  it('processes only http image params from schema image fields', async () => {
    const schema: TemplateSchema = {
      img: { type: 'image' },
      title: { type: 'string' }
    };

    fetchMock.mockResolvedValueOnce(response({ headers: { 'content-length': '10' } }));
    fetchMock.mockResolvedValueOnce(
      response({ headers: { 'content-type': 'image/jpeg' }, body: new TextEncoder().encode('img') })
    );

    const result = await processImageParams(
      {
        img: 'https://example.com/x.jpg',
        title: 'hello',
        local: '/tmp/a.png'
      },
      schema
    );

    expect(result.title).toBe('hello');
    expect(result.local).toBe('/tmp/a.png');
    expect(typeof result.img).toBe('string');
    expect((result.img as string).startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('preserves OGEngineError thrown by validator', async () => {
    await expect(fetchImageAsDataUri('http://127.0.0.1/test.png')).rejects.toBeInstanceOf(OGEngineError);
  });

  it('uses btoa fallback when Buffer is unavailable', async () => {
    fetchMock.mockResolvedValueOnce(response({ headers: { 'content-length': '10' } }));
    fetchMock.mockResolvedValueOnce(
      response({
        headers: { 'content-type': 'image/png' },
        body: new Uint8Array([97, 98, 99])
      })
    );
    vi.stubGlobal('btoa', () => 'YWJj');
    Object.defineProperty(globalThis, 'Buffer', {
      value: undefined,
      configurable: true,
      writable: true
    });

    const uri = await fetchImageAsDataUri('https://example.com/no-buffer.png');
    expect(uri).toBe('data:image/png;base64,YWJj');
  });
});
