import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Pre-build integrity checks for the icon sources and committed metadata.
// These run without a build, so a broken icon set fails fast in CI and locally.

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXPORTS = join(ROOT, 'exports');

const STYLES = ['line', 'duotone', 'solid'];
const WEIGHTS = ['light', 'regular', 'bold'];

function iconNamesIn(style, weight) {
  return readdirSync(join(EXPORTS, style, weight))
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.replace(/\.svg$/, ''))
    .sort();
}

const referenceNames = iconNamesIn('line', 'regular');
const meta = JSON.parse(readFileSync(join(ROOT, 'icons.meta.json'), 'utf8'));
const codepoints = JSON.parse(
  readFileSync(join(ROOT, 'icons.codepoints.json'), 'utf8')
);

describe('exports folder parity', () => {
  it('has a non-empty icon set', () => {
    expect(referenceNames.length).toBeGreaterThan(0);
  });

  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      it(`${style}/${weight} matches the reference icon set`, () => {
        expect(iconNamesIn(style, weight)).toEqual(referenceNames);
      });
    }
  }
});

describe('metadata sync', () => {
  it('icons.meta.json matches exports exactly', () => {
    const metaNames = meta.icons.map((i) => i.name).sort();
    expect(metaNames).toEqual(referenceNames);
  });

  it('icons.meta.json has no duplicate names', () => {
    const names = meta.icons.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('icons.codepoints.json matches exports exactly', () => {
    expect(Object.keys(codepoints).sort()).toEqual(referenceNames);
  });
});

describe('codepoint stability contract', () => {
  it('every codepoint is unique (no glyph collisions)', () => {
    const values = Object.values(codepoints);
    expect(new Set(values).size).toBe(values.length);
  });

  it('codepoints stay in the private use area (U+E001 and up)', () => {
    for (const [name, cp] of Object.entries(codepoints)) {
      expect(cp, `codepoint for "${name}"`).toBeGreaterThanOrEqual(0xe001);
      expect(cp, `codepoint for "${name}"`).toBeLessThanOrEqual(0xf8ff);
    }
  });
});

describe('source SVG sanity', () => {
  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      it(`${style}/${weight} SVGs are well-formed 24x24`, () => {
        for (const name of referenceNames) {
          const svg = readFileSync(
            join(EXPORTS, style, weight, `${name}.svg`),
            'utf8'
          ).trim();
          const label = `${style}/${weight}/${name}.svg`;
          expect(svg.startsWith('<svg'), `${label} starts with <svg`).toBe(true);
          expect(svg.endsWith('</svg>'), `${label} ends with </svg>`).toBe(true);
          expect(svg, label).toContain('viewBox="0 0 24 24"');
        }
      });
    }
  }
});
