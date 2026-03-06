import type { OGTemplate } from '@og-engine/types';

export async function sandboxedRender(
  template: OGTemplate,
  params: Record<string, unknown>
): Promise<JSX.Element> {
  const timeoutMs = 50;

  const result = await Promise.race([
    Promise.resolve().then(() => template.render(params as never)),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Template render timeout: ${template.id}`)), timeoutMs);
    })
  ]);

  if (!result || typeof result !== 'object') {
    throw new Error(`Template ${template.id} returned invalid JSX`);
  }

  return result;
}
