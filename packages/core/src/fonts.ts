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
  const baseUrl = 'https://github.com/googlefonts/noto-fonts/raw/master/unhinted/ttf/NotoSans';
  const emojiUrl = 'https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf';

  return Promise.all([
    loadFont('Noto Sans', `${baseUrl}/NotoSans-Regular.ttf`),
    loadFont('Noto Sans', `${baseUrl}/NotoSans-Bold.ttf`).then(f => ({ ...f, weight: 700 as const })),
    loadFont('Noto Sans', `${baseUrl}/NotoSans-Black.ttf`).then(f => ({ ...f, weight: 900 as const }))
  ]);
}
