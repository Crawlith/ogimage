export interface FontConfig {
  name: string;
  data: ArrayBuffer;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style?: 'normal' | 'italic';
}

const fontCache = new Map<string, ArrayBuffer>();

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

export async function getDefaultFonts(): Promise<FontConfig[]> {
  return Promise.all([
    loadFont('Inter', 'https://rsms.me/inter/font-files/Inter-Regular.woff2?v=4.0'),
    loadFont(
      'Noto Emoji',
      'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/fonts/NotoColorEmoji.ttf'
    )
  ]);
}
