import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Post-build checks for the generated website (runs after `npm run build`,
// skipped when dist/ is absent - CI always builds first).

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

const hasDist = existsSync(DIST);

const PAGES = ['index.html', 'docs.html', 'examples.html', 'changelog.html'];
const DOC_SECTIONS = ['introduction', 'download', 'react', 'vue', 'font', 'accessibility'];

describe.skipIf(!hasDist)('site output', () => {
  it.each(PAGES)('%s has full SEO head', async (page) => {
    const html = await readFile(join(DIST, page), 'utf8');
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('<link rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('rel="icon"');
  });

  it.each([...PAGES, '404.html'])(
    '%s links a fingerprinted stylesheet that exists',
    async (page) => {
      const html = await readFile(join(DIST, page), 'utf8');
      const match = html.match(/<link rel="stylesheet" href="(styles\.[a-f0-9]{10}\.css)">/);
      expect(match, `${page} should link styles.<hash>.css`).not.toBeNull();
      expect(existsSync(join(DIST, match[1]))).toBe(true);
    }
  );

  it('404 page exists and is noindex', async () => {
    const html = await readFile(join(DIST, '404.html'), 'utf8');
    expect(html).toContain('<meta name="robots" content="noindex">');
  });

  it.each(DOC_SECTIONS)('docs.html contains the %s section', async (section) => {
    const html = await readFile(join(DIST, 'docs.html'), 'utf8');
    expect(html).toContain(`id="${section}"`);
  });

  it('sitemap.xml lists every page with absolute URLs', async () => {
    const xml = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
    for (const page of PAGES) {
      const path = page === 'index.html' ? '' : page.replace(/\.html$/, '');
      expect(xml).toContain(`<loc>https://uiuxicons.com/${path}</loc>`);
    }
    expect(xml).not.toContain('localhost');
  });

  it('robots.txt allows crawling and points to the sitemap', async () => {
    const robots = await readFile(join(DIST, 'robots.txt'), 'utf8');
    expect(robots).toContain('Sitemap: https://uiuxicons.com/sitemap.xml');
    expect(robots).not.toMatch(/Disallow: \/\s*$/m);
  });

  it('font CSS uses font-display: swap', async () => {
    const css = await readFile(join(DIST, 'font', 'uiuxicons.css'), 'utf8');
    expect(css).toContain('font-display: swap');
    expect(css).not.toContain('font-display: block');
  });

  it('React bundles carry the "use client" directive', async () => {
    for (const file of ['index.js', 'index.cjs']) {
      const js = await readFile(
        join(ROOT, 'packages', 'react', 'dist', file),
        'utf8'
      );
      expect(js.startsWith('"use client";')).toBe(true);
    }
  });
});
