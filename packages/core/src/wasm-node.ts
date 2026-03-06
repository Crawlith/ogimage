let initialized = false;

export async function initWasm(): Promise<void> {
  if (initialized) {
    return;
  }

  initialized = true;
}
