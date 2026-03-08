/**
 * @file params.ts
 * @description Request parameter coercion and schema validation utilities.
 * @module @og-engine/core
 */

import { OGEngineError, type TemplateSchema } from '@og-engine/types';

/**
 * Coerces raw query parameters into typed values based on a template schema.
 *
 * @param raw - Raw request params map.
 * @param schema - Template schema used for coercion and validation.
 * @returns Coerced parameter object suitable for template rendering.
 * @throws {OGEngineError} If a required parameter is missing or validation fails.
 */
export function coerceParams(
  raw: Record<string, string>,
  schema: TemplateSchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(schema)) {
    const value = raw[key];

    if (!value) {
      if ('default' in field && field.default !== undefined) {
        result[key] = field.default;
      } else if (field.required) {
        throw new OGEngineError(`Missing required parameter: ${key}`, 'INVALID_PARAM', 400);
      }
      continue;
    }

    switch (field.type) {
      case 'string':
      case 'text': {
        if ('maxLength' in field && value.length > (field.maxLength ?? 500)) {
          throw new OGEngineError(`Parameter ${key} exceeds maximum length`, 'INVALID_PARAM', 400);
        }
        result[key] = value;
        break;
      }
      case 'boolean':
        result[key] = value === 'true' || value === '1';
        break;
      case 'color':
        if (!/^#[0-9a-fA-F]{3,8}$/.test(value)) {
          throw new OGEngineError(`Invalid color format for parameter: ${key}`, 'INVALID_PARAM', 400);
        }
        result[key] = value;
        break;
      case 'enum':
        if (!field.values.includes(value)) {
          throw new OGEngineError(
            `Invalid enum value for parameter: ${key}. Allowed: ${field.values.join(', ')}`,
            'INVALID_PARAM',
            400
          );
        }
        result[key] = value;
        break;
      case 'image':
        // Note: SSRF validation happens in processImageParams if implemented, 
        // or during the fetch phase in the consumer.
        result[key] = value;
        break;
      default:
        break;
    }
  }

  return result;
}
