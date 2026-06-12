import { describe, it, expect } from 'vitest';
import { parseExportSvgFilename } from '../scripts/icon-names.js';

describe('parseExportSvgFilename', () => {
  it('parses a plain filename', () => {
    const result = parseExportSvgFilename('gear.svg');
    expect(result.exportStem).toBe('gear');
    expect(result.logicalName).toBe('gear');
    expect(result.categoryHint).toBeNull();
    expect(result.invalidPrefix).toBeUndefined();
  });

  it('parses a valid category-prefixed filename', () => {
    const result = parseExportSvgFilename('arrows--arrow-down.svg');
    expect(result.exportStem).toBe('arrows--arrow-down');
    expect(result.logicalName).toBe('arrow-down');
    expect(result.categoryHint).toBe('arrows');
    expect(result.invalidPrefix).toBeUndefined();
  });

  it('detects an invalid category prefix', () => {
    const result = parseExportSvgFilename('fake--icon.svg');
    expect(result.logicalName).toBe('icon');
    expect(result.categoryHint).toBeNull();
    expect(result.invalidPrefix).toBe('fake');
  });

  it('preserves double-dashes in the logical name', () => {
    const result = parseExportSvgFilename('arrows--arrow--special.svg');
    expect(result.logicalName).toBe('arrow--special');
    expect(result.categoryHint).toBe('arrows');
  });

  it('works without .svg extension', () => {
    const result = parseExportSvgFilename('gear');
    expect(result.exportStem).toBe('gear');
    expect(result.logicalName).toBe('gear');
  });

  it('handles uppercase .SVG extension', () => {
    const result = parseExportSvgFilename('gear.SVG');
    expect(result.logicalName).toBe('gear');
  });

  it('handles empty prefix before double-dash', () => {
    const result = parseExportSvgFilename('--icon.svg');
    expect(result.logicalName).toBe('icon');
    expect(result.invalidPrefix).toBeUndefined();
  });
});
