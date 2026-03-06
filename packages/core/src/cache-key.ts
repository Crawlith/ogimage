/**
 * @file cache-key.ts
 * @description Deterministic cache key generation for OG image requests.
 * @module @og-engine/core
 */

import type { OGRequest } from '@og-engine/types';

/**
 * Builds a deterministic SHA-256 cache key from normalized request fields.
 *
 * @param req - OG image request payload.
 * @param templateVersion - Template version used for automatic cache busting.
 * @returns Lowercase 64-character SHA-256 hex digest.
 */
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
