/**
 * @file index.ts
 * @description Zero-dependency SDK for og-engine.
 *
 * Provides utilities for building OG image URLs and metadata URLs.
 *
 * @module @og-engine/sdk
 */

/**
 * Request parameters for building an OG image URL.
 */
export interface UrlBuilderOptions {
    /** Base URL of the hosted og-engine API. */
    baseUrl: string;
    /** Template identifier to render. */
    template: string;
    /** Output size preset key. Defaults to 'og'. */
    size?: string;
    /** Output format (png or jpeg). Defaults to 'png'. */
    format?: 'png' | 'jpeg';
    /** Raw parameters passed to the template. */
    params?: Record<string, string | number | boolean>;
}

/**
 * Builds a signed or unsigned OG image URL.
 *
 * @param options - Configuration and parameters for the URL.
 * @returns A fully qualified URL string.
 *
 * @example
 * ```ts
 * const url = buildOgUrl({
 *   baseUrl: 'https://og.example.com',
 *   template: 'sunset',
 *   params: { title: 'Hello World' }
 * });
 * ```
 */
export function buildOgUrl(options: UrlBuilderOptions): string {
    const { baseUrl, template, size = 'og', format = 'png', params = {} } = options;

    const url = new URL(`${baseUrl}/api/og`);
    url.searchParams.set('template', template);
    url.searchParams.set('size', size);
    url.searchParams.set('format', format);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
    }

    return url.toString();
}

/**
 * Builds a metadata URL for a specific OG request.
 *
 * @param options - Configuration and parameters for the metadata request.
 * @returns A fully qualified URL string.
 */
export function buildMetaUrl(options: Omit<UrlBuilderOptions, 'format'> & { format?: 'json' | 'html' }): string {
    const { baseUrl, template, size = 'og', format = 'json', params = {} } = options;

    const url = new URL(`${baseUrl}/api/meta`);
    url.searchParams.set('template', template);
    url.searchParams.set('size', size);
    url.searchParams.set('format', format);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
    }

    return url.toString();
}
