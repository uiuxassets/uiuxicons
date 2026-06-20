import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  META_CATEGORIES,
  isValidMetaCategory,
  inferCategory,
  generateTags,
  enrichTags,
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

describe('enrichTags', () => {
  it('preserves the base kebab split first, in order', () => {
    expect(enrichTags('arrow-circle-down').slice(0, 3)).toEqual([
      'arrow',
      'circle',
      'down',
    ]);
  });

  it('adds token synonyms', () => {
    const tags = enrichTags('gear');
    expect(tags).toContain('settings');
    expect(tags).toContain('cog');
  });

  it('adds name-specific extras', () => {
    expect(enrichTags('file-arrow-down')).toContain('download');
  });

  it('still filters numeric-only parts (inherited from generateTags)', () => {
    expect(enrichTags('icon-24-big')).not.toContain('24');
  });

  it('produces no duplicate tags', () => {
    const tags = enrichTags('clipboard-copy');
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('returns lowercase tags', () => {
    const tags = enrichTags('sun-moon');
    expect(tags.every(t => t === t.toLowerCase())).toBe(true);
  });
});
