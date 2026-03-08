/**
 * @file images.ts
 * @description SSRF-safe image fetching and processing.
 * @module @og-engine/core
 */

import { OGEngineError, type TemplateSchema } from '@og-engine/types';

/**
 * Validates an external URL before fetching to prevent SSRF and excessive resource usage.
 *
 * Blocks:
 * - Private IP ranges (10.x, 172.16.x, 192.168.x, 127.x, 0.0.0.0, ::1)
 * - Non-HTTP/HTTPS protocols
 * - Files exceeding 5MB (checked via HEAD)
 *
 * @param url - The URL to validate.
 * @throws {OGEngineError} If the URL is unsafe or invalid.
 */
export async function validateImageUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  // Only allow http/https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new OGEngineError('Only http and https protocols are allowed', 'SSRF_BLOCKED', 403);
  }

  const { hostname } = parsed;

  // Block common private/local hostnames
  const blockedHostnames = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
  if (blockedHostnames.includes(hostname.toLowerCase())) {
     throw new OGEngineError(`Unsafe hostname blocked: ${hostname}`, 'SSRF_BLOCKED', 403);
  }

  // Block private IP ranges via regex
  if (/^10\./.test(hostname)) throw new OGEngineError('Private IP range blocked', 'SSRF_BLOCKED', 403);
  if (/^192\.168\./.test(hostname)) throw new OGEngineError('Private IP range blocked', 'SSRF_BLOCKED', 403);
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) throw new OGEngineError('Private IP range blocked', 'SSRF_BLOCKED', 403);
  if (/^169\.254\./.test(hostname)) throw new OGEngineError('Link-local IP blocked', 'SSRF_BLOCKED', 403);

  // Check file size via HEAD request (Task 3.5)
  try {
    const headResponse = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    });

    if (headResponse.ok) {
      const contentLength = headResponse.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
        throw new OGEngineError('Image file exceeds 5MB limit', 'INVALID_PARAM', 413);
      }
    }
  } catch (error) {
    if (error instanceof OGEngineError) throw error;
    // Swallow HEAD errors (some servers block HEAD) and proceed to GET where we check size again
    console.warn(`[Images] HEAD request failed for ${url}, skipping pre-fetch size check`);
  }
}

/**
 * Fetches an external image and converts it to a base64 Data URI.
 *
 * @param url - Public image URL.
 * @returns Base64 Data URI string.
 * @throws {OGEngineError} If fetching fails or URL is unsafe.
 */
export async function fetchImageAsDataUri(url: string): Promise<string> {
  await validateImageUrl(url);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();
    
    // Final check for size after download
    if (buffer.byteLength > 5 * 1024 * 1024) {
       throw new OGEngineError('Image file exceeds 5MB limit', 'INVALID_PARAM', 413);
    }

    const base64 = typeof Buffer !== 'undefined'
      ? Buffer.from(buffer).toString('base64')
      : btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    if (error instanceof OGEngineError) throw error;
    throw new OGEngineError(
      `Failed to process image parameter: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RENDER_FAILED',
      424
    );
  }
}

/**
 * Scans parameters for image URLs and pre-processes them into base64 for Satori.
 *
 * @param params - Coerced template parameters.
 * @param schema - Template schema to identify image fields.
 * @returns Parameters with image URLs replaced by Data URIs.
 */
export async function processImageParams(
    params: Record<string, unknown>,
    schema: TemplateSchema
): Promise<Record<string, unknown>> {
    const processed = { ...params };

    const imageFields = Object.entries(schema)
        .filter(([, field]) => field.type === 'image')
        .map(([key]) => key);

    await Promise.all(
        imageFields.map(async (key) => {
            const url = params[key];
            if (typeof url === 'string' && url.startsWith('http')) {
                processed[key] = await fetchImageAsDataUri(url);
            }
        })
    );

    return processed;
}
