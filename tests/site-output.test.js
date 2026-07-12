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
    '%s links a root-absolute fingerprinted stylesheet that exists',
    async (page) => {
      const html = await readFile(join(DIST, page), 'utf8');
      const match = html.match(/<link rel="stylesheet" href="\/(styles\.[a-f0-9]{10}\.css)">/);
      expect(match, `${page} should link /styles.<hash>.css`).not.toBeNull();
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

  it('index.html stays under the size budget', async () => {
    const html = await readFile(join(DIST, 'index.html'), 'utf8');
    expect(html.length).toBeLessThan(200 * 1024);
  });

  it('index.html has WebSite JSON-LD and Copy/View tile overlays', async () => {
    const html = await readFile(join(DIST, 'index.html'), 'utf8');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    const types = blocks.map((b) => JSON.parse(b[1])['@type']);
    expect(types).toContain('WebSite');
    expect(html).toContain('class="icon-actions"');
  });

  describe('icon pages', () => {
    it('exist for every icon in the metadata', async () => {
      const meta = JSON.parse(await readFile(join(DIST, 'uiuxicons.json'), 'utf8'));
      expect(meta.icons.length).toBeGreaterThan(0);
      for (const icon of meta.icons) {
        expect(
          existsSync(join(DIST, 'icons', `${icon.name}.html`)),
          `missing icon page for ${icon.name}`
        ).toBe(true);
      }
    });

    it('have SEO head, actions, breadcrumb, and valid JSON-LD', async () => {
      const meta = JSON.parse(await readFile(join(DIST, 'uiuxicons.json'), 'utf8'));
      // Structure is identical across pages; sample a spread instead of all 150+.
      const sample = [
        meta.icons[0],
        meta.icons[Math.floor(meta.icons.length / 2)],
        meta.icons[meta.icons.length - 1],
      ];
      for (const icon of sample) {
        const html = await readFile(join(DIST, 'icons', `${icon.name}.html`), 'utf8');
        expect(html).toContain(`<link rel="canonical" href="https://uiuxicons.com/icons/${icon.name}">`);
        expect(html).toContain('Copy SVG');
        expect(html).toContain('Download SVG');
        expect(html).toMatch(/<a href="\/"[^>]*>All Icons<\/a>/);
        expect(html).toContain(`/uiuxicons/line-regular/${icon.name}.svg`);
        const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        const types = blocks.map((b) => JSON.parse(b[1])['@type']);
        expect(types).toContain('BreadcrumbList');
        expect(types).toContain('ImageObject');
      }
    });

    it('use shared tiles, a single preview holder, and responsive controls', async () => {
      const meta = JSON.parse(await readFile(join(DIST, 'uiuxicons.json'), 'utf8'));
      const html = await readFile(join(DIST, 'icons', `${meta.icons[0].name}.html`), 'utf8');
      // Hero preview is one swap holder, not a stack of inlined variants
      const preview = html.match(/<div id="icon-preview"[\s\S]*?<\/div>\s*<\/div>/)[0];
      expect(preview).toContain('class="icon-svg"');
      expect(preview).not.toContain('data-variant');
      // Related icons reuse the homepage .icon-item component with hover actions
      expect(html).toContain('id="related-icons"');
      expect(html).toMatch(/<div id="related-icons"[\s\S]*?class="icon-item"/);
      expect(html).toMatch(/<div id="related-icons"[\s\S]*?class="icon-actions"/);
      // Breadcrumb is a component: chip for the current page, chevron separators
      expect(html).toMatch(/<span[^>]*aria-current="page"[^>]*>/);
      // Copyable slug chip under the h1
      expect(html).toContain('id="copy-name-btn"');
      // Grids enforce a minimum tile width via auto-fill columns
      expect(html).toContain('grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]');
      // Style/weight selects below md, button toggles at md+
      expect(html).toMatch(/<div class="mt-5 grid grid-cols-2 gap-3 md:hidden">\s*<select id="style-select"/);
      expect(html).toContain('id="weight-select"');
      expect(html).toContain('class="mt-5 hidden md:flex flex-wrap gap-3"');
      // In action demo has a real, focusable search input
      expect(html).toMatch(/<input type="text" placeholder="Search\.\.\." aria-label="Example search input"/);
    });
  });

  it('sitemap.xml lists every icon page with lastmod', async () => {
    const xml = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
    const meta = JSON.parse(await readFile(join(DIST, 'uiuxicons.json'), 'utf8'));
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBe(PAGES.length + meta.icons.length);
    for (const icon of meta.icons) {
      expect(locs).toContain(`https://uiuxicons.com/icons/${icon.name}`);
    }
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });

  it('og.png exists and pages reference it', async () => {
    expect(existsSync(join(DIST, 'og.png'))).toBe(true);
    const html = await readFile(join(DIST, 'index.html'), 'utf8');
    expect(html).toContain('property="og:image" content="https://uiuxicons.com/og.png"');
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
