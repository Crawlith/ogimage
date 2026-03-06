/**
 * @file params.ts
 * @description Request parameter coercion and schema validation utilities.
 * @module @og-engine/core
 */

import type { TemplateSchema } from '@og-engine/types';

/**
 * Coerces raw query parameters into typed values based on a template schema.
 *
 * @param raw - Raw request params map.
 * @param schema - Template schema used for coercion and validation.
 * @returns Coerced parameter object suitable for template rendering.
 */
export function coerceParams(
  raw: Record<string, string>,
  schema: TemplateSchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(schema)) {
    const value = raw[key];

    if (!value) {
      if (field.required) {
        throw new Error(`Missing required param: ${key}`);
      }
      if ('default' in field) {
        result[key] = field.default;
      }
      continue;
    }

    switch (field.type) {
      case 'string':
      case 'text': {
        if ('maxLength' in field && value.length > (field.maxLength ?? 500)) {
          throw new Error(`Param ${key} exceeds maxLength`);
        }
        result[key] = value;
        break;
      }
      case 'boolean':
        result[key] = value === 'true' || value === '1';
        break;
      case 'color':
        if (!/^#[0-9a-fA-F]{3,8}$/.test(value)) {
          throw new Error(`Invalid color: ${key}`);
        }
        result[key] = value;
        break;
      case 'enum':
        if (!field.values.includes(value)) {
          throw new Error(`Invalid enum value for ${key}`);
        }
        result[key] = value;
        break;
      case 'image':
        result[key] = value;
        break;
      default:
        break;
    }
  }

  return result;
}
