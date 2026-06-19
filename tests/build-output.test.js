import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findUnsafeContent } from '../scripts/svg-safety.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

const hasDist = existsSync(DIST);

describe.skipIf(!hasDist)('build output', () => {
  it('dist/uiuxicons.json exists and has icons', async () => {
    const raw = await readFile(join(DIST, 'uiuxicons.json'), 'utf8');
    const meta = JSON.parse(raw);
    expect(Array.isArray(meta.icons)).toBe(true);
    expect(meta.icons.length).toBeGreaterThan(0);
    expect(meta.total).toBe(meta.icons.length);
    expect(meta.styles).toEqual(['line', 'duotone', 'solid']);
    expect(meta.weights).toEqual(['light', 'regular', 'bold']);
  });

  it('every icon has all 9 variants', async () => {
    const meta = JSON.parse(await readFile(join(DIST, 'uiuxicons.json'), 'utf8'));
    for (const icon of meta.icons) {
      expect(icon.variants).toHaveLength(9);
    }
  });

  it('every variant SVG file exists on disk', async () => {
    const meta = JSON.parse(await readFile(join(DIST, 'uiuxicons.json'), 'utf8'));
    const missing = [];
    for (const icon of meta.icons) {
      for (const variant of icon.variants) {
        const svgPath = join(DIST, 'uiuxicons', variant, `${icon.name}.svg`);
        if (!existsSync(svgPath)) missing.push(svgPath);
      }
    }
    expect(missing).toEqual([]);
  });

  it('all optimized SVGs contain currentColor', async () => {
    const meta = JSON.parse(await readFile(join(DIST, 'uiuxicons.json'), 'utf8'));
    const failures = [];
    for (const icon of meta.icons) {
      const svgPath = join(DIST, 'uiuxicons', 'line-regular', `${icon.name}.svg`);
      if (!existsSync(svgPath)) continue;
      const content = await readFile(svgPath, 'utf8');
      if (!content.includes('currentColor')) {
        failures.push(icon.name);
      }
    }
    expect(failures).toEqual([]);
  });

  it('duotone SVGs contain the accent CSS variable', async () => {
    const meta = JSON.parse(await readFile(join(DIST, 'uiuxicons.json'), 'utf8'));
    const failures = [];
    for (const icon of meta.icons) {
      const svgPath = join(DIST, 'uiuxicons', 'duotone-regular', `${icon.name}.svg`);
      if (!existsSync(svgPath)) continue;
      const content = await readFile(svgPath, 'utf8');
      if (!content.includes('var(--uiux-accent, currentColor)')) {
        failures.push(icon.name);
      }
    }
    expect(failures).toEqual([]);
  });

  it('font CSS exists and contains @font-face', async () => {
    const css = await readFile(join(DIST, 'font', 'uiuxicons.css'), 'utf8');
    expect(css).toContain('@font-face');
    expect(css).toContain('.uiuxicon');
  });

  it('codepoints.json exists and has entries', async () => {
    const raw = await readFile(join(DIST, 'font', 'codepoints.json'), 'utf8');
    const codepoints = JSON.parse(raw);
    expect(Object.keys(codepoints).length).toBeGreaterThan(0);
  });

  it('font files exist for each style', async () => {
    for (const style of ['line', 'duotone', 'solid']) {
      const dir = join(DIST, 'font', style);
      expect(existsSync(dir)).toBe(true);
      const files = await readdir(dir);
      const woff2 = files.filter(f => f.endsWith('.woff2'));
      expect(woff2.length).toBeGreaterThan(0);
    }
  });

  it('ZIP download exists', () => {
    expect(existsSync(join(DIST, 'downloads', 'uiuxicons.zip'))).toBe(true);
  });

  it('no optimized SVG contains active/unsafe content', async () => {
    // These SVGs are inlined into the site HTML, bundled in the ZIP, and
    // compiled into the npm packages, so they must be free of scripts,
    // event handlers, and unsafe URLs.
    const baseDir = join(DIST, 'uiuxicons');
    const offenders = [];
    const variants = await readdir(baseDir);
    for (const variant of variants) {
      const variantDir = join(baseDir, variant);
      const files = (await readdir(variantDir)).filter((f) => f.endsWith('.svg'));
      for (const file of files) {
        const content = await readFile(join(variantDir, file), 'utf8');
        const hits = findUnsafeContent(content);
        if (hits.length > 0) {
          offenders.push(`${variant}/${file}: ${hits.join(', ')}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('index.html exists', () => {
    expect(existsSync(join(DIST, 'index.html'))).toBe(true);
  });

  it('React package dist exists', () => {
    expect(existsSync(join(ROOT, 'packages', 'react', 'dist', 'index.js'))).toBe(true);
    expect(existsSync(join(ROOT, 'packages', 'react', 'dist', 'index.cjs'))).toBe(true);
    expect(existsSync(join(ROOT, 'packages', 'react', 'dist', 'index.d.ts'))).toBe(true);
  });

  it('Vue package dist exists', () => {
    expect(existsSync(join(ROOT, 'packages', 'vue', 'dist', 'index.js'))).toBe(true);
    expect(existsSync(join(ROOT, 'packages', 'vue', 'dist', 'index.cjs'))).toBe(true);
    expect(existsSync(join(ROOT, 'packages', 'vue', 'dist', 'index.d.ts'))).toBe(true);
  });
});
