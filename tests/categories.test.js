import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  META_CATEGORIES,
  isValidMetaCategory,
  inferCategory,
  generateTags,
} from '../scripts/categories.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('META_CATEGORIES', () => {
  it('matches the enum in icons.meta.schema.json', async () => {
    const schema = JSON.parse(
      await readFile(join(ROOT, 'icons.meta.schema.json'), 'utf8'),
    );
    const schemaEnum = schema.properties.icons.items.properties.category.enum;
    expect([...META_CATEGORIES].sort()).toEqual([...schemaEnum].sort());
  });
});

describe('isValidMetaCategory', () => {
  it('accepts known categories', () => {
    expect(isValidMetaCategory('arrows')).toBe(true);
    expect(isValidMetaCategory('general')).toBe(true);
    expect(isValidMetaCategory('weather')).toBe(true);
  });

  it('rejects unknown strings', () => {
    expect(isValidMetaCategory('fake')).toBe(false);
    expect(isValidMetaCategory('')).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidMetaCategory(null)).toBe(false);
    expect(isValidMetaCategory(42)).toBe(false);
    expect(isValidMetaCategory(undefined)).toBe(false);
  });
});

describe('inferCategory', () => {
  it('maps arrow names to arrows', () => {
    expect(inferCategory('arrow-down')).toBe('arrows');
    expect(inferCategory('arrow-circle-up')).toBe('arrows');
  });

  it('maps chevron to arrows', () => {
    expect(inferCategory('chevron-left')).toBe('arrows');
  });

  it('maps gear to system', () => {
    expect(inferCategory('gear')).toBe('system');
  });

  it('maps envelope to communication', () => {
    expect(inferCategory('envelope')).toBe('communication');
  });

  it('maps calendar to time', () => {
    expect(inferCategory('calendar-check')).toBe('time');
  });

  it('maps house to buildings', () => {
    expect(inferCategory('house')).toBe('buildings');
  });

  it('maps sun to weather', () => {
    expect(inferCategory('sun')).toBe('weather');
  });

  it('maps circle to shapes', () => {
    expect(inferCategory('circle')).toBe('shapes');
  });

  it('maps file to files', () => {
    expect(inferCategory('file-text')).toBe('files');
  });

  it('maps plus to actions', () => {
    expect(inferCategory('plus')).toBe('actions');
  });

  it('falls back to general for unknown names', () => {
    expect(inferCategory('unknown-thing')).toBe('general');
    expect(inferCategory('zzz-widget')).toBe('general');
  });
});

describe('generateTags', () => {
  it('splits kebab-case into word tags', () => {
    expect(generateTags('arrow-circle-down')).toEqual(['arrow', 'circle', 'down']);
  });

  it('filters out numeric-only parts', () => {
    expect(generateTags('icon-24-big')).toEqual(['icon', 'big']);
  });

  it('handles single-word names', () => {
    expect(generateTags('gear')).toEqual(['gear']);
  });
});
