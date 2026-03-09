import { describe, expect, it } from 'vitest';
import { OGEngineError, type TemplateSchema } from '@og-engine/types';
import { coerceParams } from './params.js';

describe('coerceParams', () => {
  it('coerces values and applies defaults', () => {
    const schema: TemplateSchema = {
      title: { type: 'string', maxLength: 10 },
      content: { type: 'text', default: 'fallback' },
      published: { type: 'boolean' },
      color: { type: 'color' },
      mode: { type: 'enum', values: ['light', 'dark'], default: 'light' },
      image: { type: 'image' }
    };

    const result = coerceParams(
      {
        title: 'hello',
        published: '1',
        color: '#ff00ff',
        mode: 'dark',
        image: 'https://example.com/a.png'
      },
      schema
    );

    expect(result).toEqual({
      title: 'hello',
      content: 'fallback',
      published: true,
      color: '#ff00ff',
      mode: 'dark',
      image: 'https://example.com/a.png'
    });
  });

  it('throws on missing required field', () => {
    const schema: TemplateSchema = {
      title: { type: 'string', required: true }
    };

    expect(() => coerceParams({}, schema)).toThrowError(OGEngineError);
    expect(() => coerceParams({}, schema)).toThrow('Missing required parameter: title');
  });

  it('throws on maxLength and invalid enum/color', () => {
    const schema: TemplateSchema = {
      title: { type: 'string', maxLength: 2 },
      color: { type: 'color' },
      mode: { type: 'enum', values: ['a', 'b'] }
    };

    expect(() => coerceParams({ title: 'abc' }, schema)).toThrow('exceeds maximum length');
    expect(() => coerceParams({ title: 'ok', color: 'red' }, schema)).toThrow('Invalid color format');
    expect(() => coerceParams({ title: 'ok', color: '#fff', mode: 'c' }, schema)).toThrow('Invalid enum value');
  });

  it('coerces boolean false and ignores unsupported field types', () => {
    const schema = {
      enabled: { type: 'boolean' },
      strange: { type: 'unknown' }
    } as unknown as TemplateSchema;

    const result = coerceParams({ enabled: 'false', strange: 'x' }, schema);

    expect(result).toEqual({ enabled: false });
  });

  it('uses default maxLength=500 when maxLength key exists but value is undefined', () => {
    const schema = {
      body: { type: 'string', maxLength: undefined }
    } as unknown as TemplateSchema;

    const overLimit = 'x'.repeat(501);
    expect(() => coerceParams({ body: overLimit }, schema)).toThrow('exceeds maximum length');
  });
});
