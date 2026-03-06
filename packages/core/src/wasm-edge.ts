let initialized = false;

export async function initWasm(): Promise<void> {
  if (initialized) {
    return;
  }

  // yoga (flexbox engine used by satori)
  const { default: initYoga } = await import('yoga-wasm-web/auto');
  await (initYoga as any)();

  // resvg
  const { initWasm: initResvg } = await import('@resvg/resvg-wasm');
  // fetch from CDN
  await initResvg(fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'));

  initialized = true;
}
