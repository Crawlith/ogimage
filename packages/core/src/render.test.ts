import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OGRequest, OGTemplate } from '@og-engine/types';

const initWasm = vi.fn(async () => {});
const getResvg = vi.fn(async () => FakeResvg as unknown as new (svg: string) => unknown);
const coerceParams = vi.fn();
const processImageParams = vi.fn();
const buildCacheKey = vi.fn(async () => 'cache-key-1');
const satori = vi.fn(async () => '<svg></svg>');

class FakeResvg {
  constructor(public readonly _svg: string, public readonly _options?: unknown) {}

  render() {
    return { asPng: () => new Uint8Array([1, 2, 3]) };
  }
}

vi.mock('./wasm.js', () => ({ initWasm, getResvg }));
vi.mock('./params.js', () => ({ coerceParams }));
vi.mock('./images.js', () => ({ processImageParams }));
vi.mock('./cache-key.js', () => ({ buildCacheKey }));
vi.mock('satori', () => ({ default: satori }));

describe('render', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coerceParams.mockReturnValue({ title: 'typed' });
    processImageParams.mockResolvedValue({ title: 'processed' });
    satori.mockResolvedValue('<svg></svg>');
    getResvg.mockResolvedValue(FakeResvg);
  });

  it('renders PNG output with cache key', async () => {
    const { render } = await import('./render.js');

    const req: OGRequest = {
      template: 't1',
      size: 'og',
      params: { title: 'raw' }
    };

    const template: OGTemplate = {
      id: 't1',
      name: 'T1',
      description: 'd',
      author: 'a',
      version: '1.0.0',
      tier: 'free',
      supportedSizes: ['og'],
      schema: { title: { type: 'string' } },
      render: vi.fn(() => ({ type: 'div', props: { children: 'ok' } }) as never)
    };

    const result = await render(req, template, [{ name: 'Mock', data: new ArrayBuffer(8) }]);

    expect(initWasm).toHaveBeenCalledTimes(1);
    expect(coerceParams).toHaveBeenCalledWith(req.params, template.schema);
    expect(processImageParams).toHaveBeenCalled();
    expect(satori).toHaveBeenCalled();
    expect(result.contentType).toBe('image/png');
    expect(result.width).toBe(1200);
    expect(result.height).toBe(630);
    expect(result.cacheKey).toBe('cache-key-1');
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('throws when template returns invalid JSX', async () => {
    const { render } = await import('./render.js');

    const req: OGRequest = {
      template: 'bad',
      size: 'og',
      params: {}
    };

    const template: OGTemplate = {
      id: 'bad',
      name: 'Bad',
      description: 'd',
      author: 'a',
      version: '1.0.0',
      tier: 'free',
      supportedSizes: ['og'],
      schema: {},
      render: vi.fn(() => null as never)
    };

    await expect(render(req, template, [])).rejects.toThrow('returned invalid JSX');
  });

  it('times out slow template rendering', async () => {
    vi.useFakeTimers();
    const { render } = await import('./render.js');

    const req: OGRequest = {
      template: 'slow',
      size: 'og',
      params: {}
    };

    const template: OGTemplate = {
      id: 'slow',
      name: 'Slow',
      description: 'd',
      author: 'a',
      version: '1.0.0',
      tier: 'free',
      supportedSizes: ['og'],
      schema: {},
      render: vi.fn(() => new Promise(() => {}) as never)
    };

    const pending = render(req, template, []);
    const assertion = expect(pending).rejects.toThrow('Template render timeout: slow');
    await vi.advanceTimersByTimeAsync(60);
    await assertion;

    vi.useRealTimers();
  });
});
