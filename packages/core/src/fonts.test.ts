import { beforeEach, describe, expect, it, vi } from 'vitest';

function cssWith(url: string): string {
  return `@font-face { src: url(${url}) format('truetype'); }`;
}

function ttfBytes(): ArrayBuffer {
  return new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x11]).buffer;
}

function otfBytes(): ArrayBuffer {
  return new Uint8Array([0x4f, 0x54, 0x54, 0x4f, 0x11]).buffer;
}

describe('fonts', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads a font and uses binary cache', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => otfBytes()
    }));

    vi.stubGlobal('fetch', fetchMock);

    const { loadFont } = await import('./fonts.js');
    const a = await loadFont('Test', 'https://fonts.gstatic.com/a.otf');
    const b = await loadFont('Test', 'https://fonts.gstatic.com/a.otf');

    expect(a.name).toBe('Test');
    expect(a.style).toBe('normal');
    expect(a.weight).toBe(400);
    expect(b.data).toBe(a.data);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when loaded font has invalid signature', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer
      }))
    );

    const { loadFont } = await import('./fonts.js');
    await expect(loadFont('Bad', 'https://fonts.gstatic.com/bad.ttf')).rejects.toThrow('invalid signature');
  });

  it('loads default fonts from primary Google API path and CSS cache', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('fonts.googleapis.com')) {
        return { ok: true, text: async () => cssWith('https://fonts.gstatic.com/shared.ttf') };
      }
      if (url.includes('fonts.gstatic.com')) {
        return { ok: true, status: 200, arrayBuffer: async () => ttfBytes() };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const { getDefaultFonts } = await import('./fonts.js');
    const first = await getDefaultFonts();
    const callsAfterFirst = fetchMock.mock.calls.length;
    const second = await getDefaultFonts();

    expect(first).toHaveLength(12);
    expect(second).toHaveLength(12);
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it('falls back to GitHub and then local font file when Google API fails', async () => {
    const readFile = vi.fn(async () => Buffer.from([0x00, 0x01, 0x00, 0x00, 0x01]));
    vi.doMock('node:fs/promises', () => ({ readFile }));

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('Playfair+Display:ital,wght@0,400')) {
        throw new Error('google fail playfair 400');
      }
      if (url.includes('DM+Sans:ital,wght@0,400')) {
        throw new Error('google fail dm sans');
      }
      if (url.includes('raw.githubusercontent.com/googlefonts/playfair')) {
        return { ok: true, status: 200, arrayBuffer: async () => ttfBytes() };
      }
      if (url.includes('fonts.googleapis.com')) {
        return { ok: true, text: async () => cssWith('https://fonts.gstatic.com/ok.ttf') };
      }
      if (url.includes('fonts.gstatic.com')) {
        return { ok: true, status: 200, arrayBuffer: async () => ttfBytes() };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', fetchMock);

    const { getDefaultFonts } = await import('./fonts.js');
    const fonts = await getDefaultFonts();

    expect(fonts).toHaveLength(12);
    expect(warnSpy).toHaveBeenCalled();
    expect(readFile).toHaveBeenCalled();
  });

  it('throws when no font source is available after fallbacks', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('Bricolage+Grotesque')) {
        throw new Error('google fail bricolage');
      }
      if (url.includes('fonts.googleapis.com')) {
        return { ok: true, text: async () => cssWith('https://fonts.gstatic.com/ok2.ttf') };
      }
      if (url.includes('fonts.gstatic.com')) {
        return { ok: true, status: 200, arrayBuffer: async () => ttfBytes() };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const { getDefaultFonts } = await import('./fonts.js');
    await expect(getDefaultFonts()).rejects.toThrow('No font source available');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('uses local fallback failure path when file read errors', async () => {
    vi.doMock('node:fs/promises', () => ({ readFile: vi.fn(async () => { throw new Error('no file'); }) }));

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('DM+Sans')) {
        throw new Error('google fail dm sans');
      }
      if (url.includes('fonts.googleapis.com')) {
        return { ok: true, text: async () => cssWith('https://fonts.gstatic.com/ok3.ttf') };
      }
      if (url.includes('fonts.gstatic.com')) {
        return { ok: true, status: 200, arrayBuffer: async () => ttfBytes() };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const { getDefaultFonts } = await import('./fonts.js');
    await expect(getDefaultFonts()).rejects.toThrow('No font source available');
  });

  it('warns when GitHub fallback also fails before local fallback succeeds', async () => {
    const readFile = vi.fn(async () => Buffer.from([0x00, 0x01, 0x00, 0x00, 0x01]));
    vi.doMock('node:fs/promises', () => ({ readFile }));

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('Playfair+Display:ital,wght@0,400')) {
        return { ok: true, text: async () => '@font-face { font-family: x; }' };
      }
      if (url.includes('raw.githubusercontent.com/googlefonts/playfair')) {
        return { ok: false, status: 503, arrayBuffer: async () => ttfBytes() };
      }
      if (url.includes('fonts.googleapis.com')) {
        return { ok: true, text: async () => cssWith('https://fonts.gstatic.com/ok4.ttf') };
      }
      if (url.includes('fonts.gstatic.com')) {
        return { ok: true, status: 200, arrayBuffer: async () => ttfBytes() };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', fetchMock);

    const { getDefaultFonts } = await import('./fonts.js');
    const fonts = await getDefaultFonts();
    expect(fonts).toHaveLength(12);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('handles non-ok CSS responses from Google API', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('Bricolage+Grotesque')) {
        return { ok: false, status: 500, text: async () => '' };
      }
      if (url.includes('fonts.googleapis.com')) {
        return { ok: true, text: async () => cssWith('https://fonts.gstatic.com/ok5.ttf') };
      }
      if (url.includes('fonts.gstatic.com')) {
        return { ok: true, status: 200, arrayBuffer: async () => ttfBytes() };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', fetchMock);

    const { getDefaultFonts } = await import('./fonts.js');
    await expect(getDefaultFonts()).rejects.toThrow('No font source available');
  });

  it('handles non-ok binary responses from Google font URL', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('Bricolage+Grotesque')) {
        return { ok: true, text: async () => cssWith('https://fonts.gstatic.com/brico-bad.ttf') };
      }
      if (url.includes('brico-bad.ttf')) {
        return { ok: false, status: 404, arrayBuffer: async () => ttfBytes() };
      }
      if (url.includes('fonts.googleapis.com')) {
        return { ok: true, text: async () => cssWith('https://fonts.gstatic.com/ok6.ttf') };
      }
      if (url.includes('fonts.gstatic.com')) {
        return { ok: true, status: 200, arrayBuffer: async () => ttfBytes() };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', fetchMock);

    const { getDefaultFonts } = await import('./fonts.js');
    await expect(getDefaultFonts()).rejects.toThrow('No font source available');
  });
});
