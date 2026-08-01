/**
 * Shared HTML templates for every generated page: document head, page layout,
 * header/footer, and the category sidebar. Pages compose these with their own
 * body markup and inline scripts.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, getSiteOrigin, escapeHtmlAttr, escapeHtmlText } from './common.js';
import { headThemeInitScript } from '../site-snippets.js';

// Stylesheet filename referenced by every generated page. The build passes a
// content-hashed name (styles.<hash>.css) so browsers never serve stale CSS.
let SITE_CSS_FILE = 'styles.css';
let SITE_VERSION = '';

export function setSiteCssFile(cssFile) {
  if (cssFile) SITE_CSS_FILE = cssFile;
}

export function setSiteVersion(version) {
  SITE_VERSION = version || '';
}

export function absolutePageUrl(pageFile) {
  const origin = getSiteOrigin();
  if (pageFile === 'index.html') return `${origin}/`;
  // Emit clean, extensionless URLs (e.g. /docs) for canonical/OG/sitemap.
  // GitHub Pages still serves the on-disk docs.html for the /docs request.
  return `${origin}/${pageFile.replace(/\.html$/, '')}`;
}

function seoHead({ title, description, pageFile, image, imageAlt }) {
  const url = absolutePageUrl(pageFile);
  // Icon pages pass their generated /og/icon-{name}.png; everything else
  // shares the site-wide og.png.
  const imageUrl = `${getSiteOrigin()}${image || '/og.png'}`;
  const t = escapeHtmlAttr(title);
  const d = escapeHtmlAttr(description);
  const u = escapeHtmlAttr(url);
  const i = escapeHtmlAttr(imageUrl);
  const alt = escapeHtmlAttr(imageAlt || 'UI/UX Icons - free icon library');
  return `
  <link rel="canonical" href="${u}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:url" content="${u}">
  <meta property="og:image" content="${i}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${alt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  <meta name="twitter:image" content="${i}">`;
}

/**
 * Shared document <head> for static pages. Each output HTML file still has a single <head>;
 * this DRYs the repeated meta, SEO, favicon, stylesheet, and theme script.
 */
function sitePageHead({ title, description, pageFile, image, imageAlt, robotsNoindex = false, extraAfterTheme = '' }) {
  const robotsLine = robotsNoindex ? '  <meta name="robots" content="noindex">\n' : '';
  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">
  <title>${escapeHtmlAttr(title)}</title>
  <meta name="description" content="${escapeHtmlAttr(description)}">
${robotsLine}${seoHead({ title, description, pageFile, image, imageAlt })}
  <link rel="icon" type="image/png" href="/icon.png">
  <link rel="apple-touch-icon" href="/icon.png">
  <link rel="stylesheet" href="/${SITE_CSS_FILE}">
  ${headThemeInitScript}${extraAfterTheme}
</head>`;
}

/**
 * Full HTML document: head + body wrapper + shared footer + optional trailing <script>.
 * @param {object} opts.headOptions - passed to sitePageHead
 * @param {string} opts.bodyHtml - main content only (no footer); typically indented with two spaces
 * @param {string} [opts.scriptInner] - raw JS inserted inside one <script> block
 */
export function layoutSitePage({ headOptions, bodyHtml, scriptInner }) {
  const hasScript = scriptInner != null && String(scriptInner).trim() !== '';
  const scriptBlock = hasScript ? `\n  <script>\n${scriptInner}\n  </script>` : '';
  return `<!DOCTYPE html>
<html lang="en">
${sitePageHead(headOptions)}
<body class="min-h-screen bg-main text-fg">
${bodyHtml}
  ${sharedFooter}${scriptBlock}
</body>
</html>`;
}

export function themeToggleIcons(moonIcon, sunIcon) {
  return `
    <span id="theme-icon-dark" class="size-4 shrink-0 [&>svg]:size-4 inline-flex" aria-hidden="true">${moonIcon}</span>
    <span id="theme-icon-light" class="size-4 shrink-0 [&>svg]:size-4 hidden" aria-hidden="true">${sunIcon}</span>
  `;
}

// Close (x) glyph for drawer/dialog close buttons. Sourced from the icon
// library at build time (site.js calls setCloseIcon with the optimized dist
// SVG) so glyph changes propagate to the site automatically. Live ESM binding:
// importers see the value set by the setter.
export let CLOSE_ICON_SVG = '';

export function setCloseIcon(svg) {
  if (svg) {
    CLOSE_ICON_SVG = `<span class="inline-flex size-4 shrink-0 [&>svg]:size-4" aria-hidden="true">${svg}</span>`;
  }
}

const GITHUB_ICON_SVG = readFileSync(join(ROOT, 'assets/logo-github.svg'), 'utf8');

export function sharedHeader(
  currentPage = 'icons',
  totalIcons = null,
  themeIcons = '',
  logoIcon = '',
  downloadIcon = '',
  menuIcon = ''
) {
  const navLinks = [
    { id: 'icons', href: '/', label: 'Icons' },
    { id: 'docs', href: '/docs', label: 'Docs' },
    { id: 'examples', href: '/examples', label: 'Examples' },
    { id: 'changelog', href: '/changelog', label: 'Changelog' },
  ];
  
  const badge = totalIcons
    ? `<span class="inline-flex shrink-0 items-center rounded-md bg-active px-1.5 py-1 text-xs font-medium leading-none tabular-nums text-main">${totalIcons}</span>`
    : '';
  const linkClass = (link) =>
    currentPage === link.id ? 'text-fg' : 'text-fg-secondary hover:text-fg';
  const mobileNavLinkClass = (link) =>
    currentPage === link.id
      ? 'text-fg bg-tertiary'
      : 'text-fg-secondary hover:text-fg hover:bg-secondary';
  
  return `
  <header class="border-b border-border sticky top-0 bg-main/90 backdrop-blur-sm z-30">
    <div class="max-w-7xl mx-auto p-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <a href="/" class="flex items-center shrink-0" title="UI/UX Icons">
          <span class="inline-flex size-8">${logoIcon}</span>
        </a>
        <nav class="hidden md:flex items-center gap-3" aria-label="Primary">
          ${navLinks.map(link => `
            <a href="${link.href}" class="inline-flex items-center gap-1.5 text-sm ${linkClass(link)}"><span class="shrink-0">${link.label}</span>${link.id === 'icons' ? badge : ''}</a>
          `).join('')}
        </nav>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <div class="hidden md:flex items-center gap-3 text-sm">
          ${SITE_VERSION ? `<span class="text-fg-muted tabular-nums">v${escapeHtmlText(SITE_VERSION)}</span>
          <span class="h-3 w-px bg-border" aria-hidden="true"></span>` : ''}
          <a href="https://uiuxassets.com" class="text-fg-muted hover:text-fg" target="_blank" rel="noopener noreferrer">By UI/UX Assets</a>
        </div>
        <button
          id="theme-toggle"
          type="button"
          class="inline-flex shrink-0 items-center justify-center gap-1.5 p-2 rounded-md border border-border bg-main hover:bg-tertiary text-fg cursor-pointer dark:bg-secondary"
          title="Toggle theme"
          aria-label="Toggle light or dark theme"
        >
          ${themeIcons}
        </button>
        <a
          href="https://github.com/uiuxassets/uiuxicons"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex shrink-0 items-center justify-center p-2 rounded-md border border-border bg-main hover:bg-tertiary text-fg dark:bg-secondary"
          title="View on GitHub"
          aria-label="View source on GitHub (opens in new tab)"
        >
          <span class="inline-flex size-4 shrink-0 [&>svg]:size-4" aria-hidden="true">${GITHUB_ICON_SVG}</span>
        </a>
        <a
          href="/downloads/uiuxicons.zip"
          download="uiuxicons.zip"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 max-md:p-2 text-sm rounded-md border border-border bg-main hover:bg-tertiary text-fg dark:bg-secondary"
          title="Download all icons (ZIP: SVG, fonts)"
          aria-label="Download all icons (ZIP: SVG, fonts)"
        >
          <span class="inline-flex size-4 shrink-0 [&>svg]:size-4" aria-hidden="true">${downloadIcon}</span>
          <span class="max-md:sr-only">Download</span>
        </a>
        <button
          type="button"
          id="mobile-nav-toggle"
          class="md:hidden inline-flex shrink-0 items-center justify-center p-2 rounded-md border border-border bg-main hover:bg-tertiary text-fg cursor-pointer dark:bg-secondary"
          aria-expanded="false"
          aria-controls="mobile-nav"
          aria-label="Main menu"
        >
          <span class="inline-flex size-4 shrink-0 [&>svg]:size-4" aria-hidden="true">${menuIcon}</span>
        </button>
      </div>
    </div>
  </header>
  <div id="mobile-nav" class="fixed inset-0 z-40 md:hidden hidden" role="dialog" aria-modal="true" aria-label="Site navigation">
    <div id="mobile-nav-backdrop" class="absolute inset-0 bg-black/60" aria-hidden="true"></div>
    <div id="mobile-nav-panel" class="absolute inset-0 w-full h-full bg-main flex flex-col overflow-y-auto shadow-xl">
      <div class="flex items-center justify-between gap-3 p-3 border-b border-border shrink-0">
        <a href="/" class="inline-flex shrink-0 items-center" title="UI/UX Icons">
          <span class="inline-flex size-8">${logoIcon}</span>
        </a>
        <button type="button" id="mobile-nav-close" class="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-secondary p-2 text-fg hover:bg-tertiary cursor-pointer" aria-label="Close menu">
          ${CLOSE_ICON_SVG}
        </button>
      </div>
      <nav class="flex flex-col space-y-1 p-3 flex-1" aria-label="Primary">
        ${navLinks.map(link => `
          <a href="${link.href}"${currentPage === link.id ? ' aria-current="page"' : ''} class="inline-flex items-center gap-3 px-3 py-2 text-base rounded-md ${mobileNavLinkClass(link)}"><span class="shrink-0">${link.label}</span>${link.id === 'icons' ? badge : ''}</a>
        `).join('')}
      </nav>
      <div class="mt-auto p-3 border-t border-border shrink-0 flex items-center gap-3 text-sm">
        ${SITE_VERSION ? `<span class="text-fg-muted tabular-nums">v${escapeHtmlText(SITE_VERSION)}</span>
        <span class="h-3 w-px bg-border" aria-hidden="true"></span>` : ''}
        <a id="mobile-nav-footer-link" href="https://uiuxassets.com" class="text-fg-muted hover:text-fg" target="_blank" rel="noopener noreferrer">By UI/UX Assets</a>
      </div>
    </div>
  </div>`;
}

export function categoryNavInnerHtml(meta, icons) {
  const itemBase =
    'category-btn inline-flex w-full min-w-0 items-center gap-3 px-3 py-2 text-base md:text-sm rounded-md cursor-pointer';
  return `
          <button type="button" data-category="all" class="${itemBase} bg-tertiary text-fg">
            <span class="min-w-0 flex-1 truncate text-left">All Icons</span>
            <span class="shrink-0 tabular-nums text-fg-muted">${meta.total}</span>
          </button>
          ${meta.categories.map(cat => {
            const count = icons.filter(i => i.category === cat).length;
            return `
              <button type="button" data-category="${cat}" class="${itemBase} text-fg-secondary hover:text-fg hover:bg-secondary">
                <span class="min-w-0 flex-1 truncate text-left">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                <span class="shrink-0 tabular-nums text-fg-muted">${count}</span>
              </button>
            `;
          }).join('')}
  `;
}

export const sharedFooter = `
  <footer class="border-t border-border">
    <div class="max-w-7xl mx-auto px-3 py-8 text-center text-sm text-fg-muted">
      <p>MIT License - Free for personal and commercial use.</p>
      <p class="mt-2"><a href="https://uiuxicons.com" class="text-fg-secondary hover:text-fg">uiuxicons.com</a></p>
    </div>
  </footer>
`;
