import type { OGRequest } from '@og-engine/types';

export async function buildCacheKey(req: OGRequest, templateVersion: string): Promise<string> {
  const sorted = Object.entries({
    ...req.params,
    template: req.template,
    size: req.size,
    format: req.format ?? 'png',
    _tv: templateVersion
  })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sorted));
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}
