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

const fontCache = new Map<string, ArrayBuffer>();

/**
 * Downloads and caches a font in-memory.
 *
 * @param name - Font family name.
 * @param url - Absolute font URL.
 * @returns A Satori-compatible font config object.
 */
export async function loadFont(name: string, url: string): Promise<FontConfig> {
  if (!fontCache.has(url)) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unable to load font from ${url}`);
    }
    fontCache.set(url, await response.arrayBuffer());
  }

  const data = fontCache.get(url);
  if (!data) {
    throw new Error(`Font cache missing loaded value for ${url}`);
  }

  return { name, data, weight: 400 };
}

/**
 * Loads the default font stack used by bundled templates.
 *
 * @returns Default regular, bold, and black Noto Sans fonts.
 */
export async function getDefaultFonts(): Promise<FontConfig[]> {
  const baseUrl = 'https://github.com/googlefonts/noto-fonts/raw/master/unhinted/ttf/NotoSans';

  return Promise.all([
    loadFont('Noto Sans', `${baseUrl}/NotoSans-Regular.ttf`),
    loadFont('Noto Sans', `${baseUrl}/NotoSans-Bold.ttf`).then((font) => ({
      ...font,
      weight: 700 as const
    })),
    loadFont('Noto Sans', `${baseUrl}/NotoSans-Black.ttf`).then((font) => ({
      ...font,
      weight: 900 as const
    }))
  ]);
}
