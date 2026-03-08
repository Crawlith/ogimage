/**
 * @file index.ts
 * @description Public type contracts shared across og-engine packages.
 *
 * This module defines template schemas, rendering interfaces, platform adapter
 * contracts, and request/response payload types used throughout the monorepo.
 *
 * @module @og-engine/types
 */
/**
 * Canonical output size presets for supported social platforms.
 */
export const PLATFORM_SIZES = {
    'twitter-og': { width: 1200, height: 628, label: 'Twitter / X' },
    'facebook-og': { width: 1200, height: 630, label: 'Facebook OG' },
    'linkedin-og': { width: 1200, height: 627, label: 'LinkedIn' },
    'ig-post': { width: 1080, height: 1080, label: 'Instagram Post' },
    'ig-story': { width: 1080, height: 1920, label: 'Instagram Story' },
    discord: { width: 1280, height: 640, label: 'Discord' },
    whatsapp: { width: 400, height: 209, label: 'WhatsApp' },
    github: { width: 1280, height: 640, label: 'GitHub Social' },
    og: { width: 1200, height: 630, label: 'Generic OG (default)' }
};
/**
 * Base error class for all og-engine errors.
 * Includes a machine-readable code and HTTP status hint.
 */
export class OGEngineError extends Error {
    code;
    status;
    constructor(message, 
    /** Machine-readable error code for programmatic handling. */
    code, 
    /** HTTP status code hint for API responses. */
    status = 500) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'OGEngineError';
    }
}
//# sourceMappingURL=index.js.map