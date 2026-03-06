let initialized = false;

export async function initWasm(): Promise<void> {
  if (initialized) {
    return;
  }

  // yoga (flexbox engine used by satori)
  const yoga = await import('yoga-wasm-web/auto');
  const init = yoga.default || yoga;
  if (typeof init === 'function') {
    await (init as any)();
  }

  initialized = true;
}
