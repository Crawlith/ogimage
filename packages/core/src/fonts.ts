/**
 * @file fonts.ts
 * @description Runtime font loading utilities for Satori rendering.
 * @module @og-engine/core
 */

import { OGEngineError } from '@og-engine/types';

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

/**
 * Highly reliable static TTF URLs from GitHub.
 * Used as a secondary fallback if the Google API fails.
 */
const fallbackFontUrls: Record<string, string> = {
  // Most of these are variable font paths from the master/main branches
  'Playfair Display|400|normal':
    'https://raw.githubusercontent.com/googlefonts/playfair/master/fonts/ttf/PlayfairDisplay-Regular.ttf',
  'JetBrains Mono|400|normal':
    'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf',
  'Noto Emoji|400|normal':
    'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoEmoji-Regular.ttf'
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
  if (!path) return null;

  try {
    const { readFile } = await import('node:fs/promises');
    const file = await readFile(path);
    return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  } catch {
    return null;
  }
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

/**
 * Fetches CSS from Google Fonts, forcing TrueType format by spoofing an old Android User-Agent.
 */
async function loadCss(url: string): Promise<string> {
  const cached = cssCache.get(url);
  if (cached) return cached;

  // This specific User-Agent is the "Golden" one that forces Google Fonts to serve TTF instead of WOFF/WOFF2.
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; U; Android 2.2; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
    }
  });

  if (!response.ok) throw new Error(`Unable to load font CSS from ${url}`);
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
  if (cached) return cached;

  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`Unable to load font binary from ${url} (Status: ${response.status})`);

  const data = await response.arrayBuffer();

  // Validate signature (TTF/OTF)
  const head = new Uint8Array(data.slice(0, 4));
  const isTTF = head[0] === 0x00 && head[1] === 0x01 && head[2] === 0x00 && head[3] === 0x00;
  const isCFF = head[0] === 0x4f && head[1] === 0x54 && head[2] === 0x54 && head[3] === 0x4f; // "OTTO"

  if (!isTTF && !isCFF) {
    const signature = Array.from(head).map(b => b.toString(16).padStart(2, '0')).join(' ');
    throw new Error(`Font at ${url} has invalid signature: ${signature}. Expected TTF (00 01 00 00) or OTF (OTTO).`);
  }

  fontBinaryCache.set(url, data);
  return data;
}

async function loadGoogleFont(variant: GoogleFontVariant): Promise<FontConfig> {
  const key = getFallbackKey(variant);

  // 1. Primary: Google Fonts API (Forcing TTF)
  try {
    const cssUrl = buildGoogleCssUrl(variant);
    const css = await loadCss(cssUrl);
    const fontUrl = extractFontUrl(css);

    if (!fontUrl) throw new Error('No font URL found in CSS payload');

    const data = await loadFontBinary(fontUrl);
    return {
      name: variant.family,
      data,
      weight: variant.weight,
      style: variant.style ?? 'normal'
    };
  } catch (err) {
    console.warn(`[Fonts] Google API failed for ${key}, trying fallbacks...`);

    // 2. Secondary: GitHub Fallback
    const githubUrl = fallbackFontUrls[key];
    if (githubUrl) {
      try {
        const data = await loadFontBinary(githubUrl);
        return { name: variant.family, data, weight: variant.weight, style: variant.style ?? 'normal' };
      } catch { }
    }

    // 3. Final: Local System Fonts
    const localData = await loadLocalFallbackFont(variant.family);
    if (!localData) throw new Error(`No font source available for ${key}. Satori render will fail.`);

    return { name: variant.family, data: localData, weight: variant.weight, style: variant.style ?? 'normal' };
  }
}

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
    loadGoogleFont({ family: 'Bricolage Grotesque', weight: 400 }),
    loadGoogleFont({ family: 'Bricolage Grotesque', weight: 700 }),
    loadGoogleFont({ family: 'DM Serif Display', weight: 400 }),
    loadGoogleFont({ family: 'Noto Emoji', weight: 400 })
  ]);
}

export async function loadFont(name: string, url: string): Promise<FontConfig> {
  const data = await loadFontBinary(url);
  return { name, data, weight: 400, style: 'normal' };
}
