/**
 * @file fonts.ts
 * @description Runtime font loading utilities for Satori rendering.
 * @module @og-engine/core
 */

/**
 * Font definition passed into Satori.
 */
export interface FontConfig {
  /** Font family name. */
  name: string;

  /** Raw font binary data. */
  data: ArrayBuffer;

  /** Optional font weight. */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

  /** Optional font style. */
  style?: 'normal' | 'italic';
}

const fontBinaryCache = new Map<string, ArrayBuffer>();
const cssCache = new Map<string, string>();


const fallbackFontUrls: Record<string, string> = {
  'Playfair Display|400|normal':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay-Regular.ttf',
  'Playfair Display|700|normal':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay-Bold.ttf',
  'Playfair Display|900|normal':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay-Black.ttf',
  'Instrument Serif|400|italic':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Italic.ttf',
  'JetBrains Mono|400|normal':
    'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf',
  'JetBrains Mono|700|normal':
    'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Bold.ttf',
  'DM Sans|400|normal':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans-Regular.ttf',
  'DM Sans|500|normal':
    'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans-Medium.ttf',
  'Noto Emoji|400|normal':
    'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoEmoji-VariableFont_wght.ttf'
};

function getFallbackKey(variant: GoogleFontVariant): string {
  return `${variant.family}|${variant.weight}|${variant.style ?? 'normal'}`;
}



const localFontFallbacks: Record<string, string> = {
  'Playfair Display': '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
  'Instrument Serif': '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
  'JetBrains Mono': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
  'DM Sans': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  'Noto Emoji': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
};

async function loadLocalFallbackFont(family: string): Promise<ArrayBuffer | null> {
  const path = localFontFallbacks[family];
  if (!path) {
    return null;
  }

  const isNodeRuntime =
    typeof process !== 'undefined' &&
    typeof process.versions !== 'undefined' &&
    typeof process.versions.node === 'string';

  if (!isNodeRuntime) {
    return null;
  }

  const { readFile } = await import('node:fs/promises');
  const file = await readFile(path);
  const bytes = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  return bytes;
}

interface GoogleFontVariant {
  family: string;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style?: 'normal' | 'italic';
}

function buildGoogleCssUrl(variant: GoogleFontVariant): string {
  const family = variant.family.replace(/\s+/g, '+');
  const style = variant.style ?? 'normal';
  const ital = style === 'italic' ? 1 : 0;
  return `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${ital},${variant.weight}&display=swap`;
}

async function loadCss(url: string): Promise<string> {
  const cached = cssCache.get(url);
  if (cached) {
    return cached;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to load font CSS from ${url}`);
  }

  const css = await response.text();
  cssCache.set(url, css);
  return css;
}

function extractFontUrl(css: string): string | null {
  const match = css.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
  return match ? match[1] : null;
}

async function loadFontBinary(url: string): Promise<ArrayBuffer> {
  const cached = fontBinaryCache.get(url);
  if (cached) {
    return cached;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load font binary from ${url}`);
  }

  const data = await response.arrayBuffer();
  fontBinaryCache.set(url, data);
  return data;
}

async function loadGoogleFont(variant: GoogleFontVariant): Promise<FontConfig> {
  const cssUrl = buildGoogleCssUrl(variant);

  try {
    const css = await loadCss(cssUrl);
    const fontUrl = extractFontUrl(css);

    if (!fontUrl) {
      throw new Error(`Google Fonts CSS does not contain a usable font URL: ${cssUrl}`);
    }

    const data = await loadFontBinary(fontUrl);
    return {
      name: variant.family,
      data,
      weight: variant.weight,
      style: variant.style ?? 'normal'
    };
  } catch {
    const fallbackUrl = fallbackFontUrls[getFallbackKey(variant)];

    if (fallbackUrl) {
      try {
        const data = await loadFontBinary(fallbackUrl);
        return {
          name: variant.family,
          data,
          weight: variant.weight,
          style: variant.style ?? 'normal'
        };
      } catch {
        // continue to local fallback
      }
    }

    const localData = await loadLocalFallbackFont(variant.family);
    if (!localData) {
      throw new Error(`No fallback font source configured for ${getFallbackKey(variant)}`);
    }

    return {
      name: variant.family,
      data: localData,
      weight: variant.weight,
      style: variant.style ?? 'normal'
    };
  }
}

/**
 * Loads the default font stack used by bundled templates.
 *
 * The first cold load usually adds around 80-100ms due to Google Fonts CSS
 * discovery and font binary download; subsequent loads are served from memory.
 *
 * @returns Default fonts for editorial, minimal, terminal, labels, and emoji.
 */
export async function getDefaultFonts(): Promise<FontConfig[]> {
  return Promise.all([
    loadGoogleFont({ family: 'Playfair Display', weight: 400 }),
    loadGoogleFont({ family: 'Playfair Display', weight: 700 }),
    loadGoogleFont({ family: 'Playfair Display', weight: 900 }),
    loadGoogleFont({ family: 'Instrument Serif', weight: 400, style: 'italic' }),
    loadGoogleFont({ family: 'JetBrains Mono', weight: 400 }),
    loadGoogleFont({ family: 'JetBrains Mono', weight: 700 }),
    loadGoogleFont({ family: 'DM Sans', weight: 400 }),
    loadGoogleFont({ family: 'DM Sans', weight: 500 }),
    loadGoogleFont({ family: 'Noto Emoji', weight: 400 })
  ]);
}

/**
 * Backward-compatible font loader for direct URL usage.
 *
 * @param name - Font family name.
 * @param url - Absolute font URL.
 * @returns A Satori-compatible font config object.
 */
export async function loadFont(name: string, url: string): Promise<FontConfig> {
  const data = await loadFontBinary(url);
  return { name, data, weight: 400, style: 'normal' };
}
