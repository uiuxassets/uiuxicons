#!/usr/bin/env node

import { readFile, writeFile, readdir } from 'fs/promises';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';
import { escapeHtml as escapeMdHtml } from 'markdown-it/lib/common/utils.mjs';
import hljs from 'highlight.js/lib/core';
import hljsJavascript from 'highlight.js/lib/languages/javascript';
import hljsTypescript from 'highlight.js/lib/languages/typescript';
import hljsXml from 'highlight.js/lib/languages/xml';
import hljsBash from 'highlight.js/lib/languages/bash';
import hljsJson from 'highlight.js/lib/languages/json';
import hljsCss from 'highlight.js/lib/languages/css';
import {
  headThemeInitScript,
  focusTrapRuntime,
  mobileNavScript,
  categoriesDrawerScript,
  simplePageScripts,
  docsPageScripts,
} from './site-snippets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const DOCS_DIR = join(ROOT, 'docs');
const DOC_FILE_RE = /^(\d{2})-(.+)\.md$/;
hljs.registerLanguage('javascript', hljsJavascript);
hljs.registerLanguage('js', hljsJavascript);
hljs.registerLanguage('jsx', hljsJavascript);
hljs.registerLanguage('typescript', hljsTypescript);
hljs.registerLanguage('ts', hljsTypescript);
hljs.registerLanguage('tsx', hljsTypescript);
hljs.registerLanguage('html', hljsXml);
hljs.registerLanguage('xml', hljsXml);
hljs.registerLanguage('bash', hljsBash);
hljs.registerLanguage('sh', hljsBash);
hljs.registerLanguage('shell', hljsBash);
hljs.registerLanguage('json', hljsJson);
hljs.registerLanguage('css', hljsCss);
hljs.registerLanguage('vue', hljsXml);

const DOCS_HIGHLIGHT_CSS = readFileSync(
  join(ROOT, 'node_modules/highlight.js/styles/github-dark.min.css'),
  'utf8'
);

function highlightDocCode(str, lang) {
  const trimmed = lang?.trim();
  if (!trimmed) return escapeMdHtml(str);
  const lower = trimmed.toLowerCase();
  const aliases = { sh: 'bash', shell: 'bash', zsh: 'bash' };
  const name = aliases[lower] || lower;
  try {
    if (hljs.getLanguage(name)) {
      return hljs.highlight(str, { language: name, ignoreIllegals: true }).value;
    }
  } catch (_) {
    /* fall through */
  }
  return escapeMdHtml(str);
}

// SECURITY: html:true allows raw HTML in docs/*.md. This is safe only while
// doc sources are trusted (internal maintainers). Disable if docs accept
// external contributions to prevent XSS in generated pages.
const markdownIt = new MarkdownIt({
  html: true,
  langPrefix: 'hljs language-',
  highlight: highlightDocCode,
});

const DEFAULT_DOC_TITLES = {
  introduction: 'Introduction',
  download: 'Download',
  react: 'React',
  vue: 'Vue',
  font: 'Web Font',
  accessibility: 'Accessibility',
};

function getSiteOrigin() {
  const raw = process.env.SITE_URL || 'https://uiuxicons.com';
  return raw.replace(/\/$/, '');
}

function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseDocFrontmatter(raw) {
  if (!raw.startsWith('---\n')) {
    return { meta: {}, body: raw };
  }
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) {
    return { meta: {}, body: raw };
  }
  const header = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const meta = {};
  for (const line of header.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    meta[key] = line.slice(idx + 1).trim();
  }
  return { meta, body };
}

async function loadDocSections(meta) {
  if (!existsSync(DOCS_DIR)) {
    throw new Error('docs/ not found (expected numbered .md files)');
  }
  const names = (await readdir(DOCS_DIR)).filter((f) => DOC_FILE_RE.test(f)).sort();
  if (names.length === 0) {
    throw new Error('docs/ has no numbered .md files');
  }
  const sections = [];
  for (const name of names) {
    const m = name.match(DOC_FILE_RE);
    const slug = m[2];
    const fileRaw = await readFile(join(DOCS_DIR, name), 'utf8');
    const { meta: fm, body } = parseDocFrontmatter(fileRaw);
    const title = fm.title || DEFAULT_DOC_TITLES[slug] || slug;
    const filled = body.replace(/\{\{total\}\}/g, String(meta.total)).trim();
    const html = markdownIt
      .render(filled)
      .replace(/<pre><code>/g, '<pre><code class="hljs">');
    sections.push({ id: slug, title, html });
  }
  return sections;
}

function docsNavLinksHtml(sections) {
  const itemBase =
    'docs-nav-link inline-flex w-full min-w-0 items-center px-3 py-2 text-base md:text-sm rounded-md text-fg-secondary hover:text-fg hover:bg-secondary';
  return sections
    .map(
      (s) => `
          <a href="#${s.id}" class="${itemBase}">
            <span class="min-w-0 flex-1 truncate text-left">${escapeHtmlText(s.title)}</span>
          </a>`
    )
    .join('');
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absolutePageUrl(pageFile) {
  const origin = getSiteOrigin();
  if (pageFile === 'index.html') return `${origin}/`;
  return `${origin}/${pageFile}`;
}

function seoHead({ title, description, pageFile }) {
  const url = absolutePageUrl(pageFile);
  const imageUrl = `${getSiteOrigin()}/icon.png`;
  const t = escapeHtmlAttr(title);
  const d = escapeHtmlAttr(description);
  const u = escapeHtmlAttr(url);
  const i = escapeHtmlAttr(imageUrl);
  return `
  <link rel="canonical" href="${u}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${t}">
  <meta property="og:description" content="${d}">
  <meta property="og:url" content="${u}">
  <meta property="og:image" content="${i}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${t}">
  <meta name="twitter:description" content="${d}">
  <meta name="twitter:image" content="${i}">`;
}

/**
 * Shared document <head> for static pages. Each output HTML file still has a single <head>;
 * this DRYs the repeated meta, SEO, favicon, stylesheet, and theme script.
 */
function sitePageHead({ title, description, pageFile, robotsNoindex = false, extraAfterTheme = '' }) {
  const robotsLine = robotsNoindex ? '  <meta name="robots" content="noindex">\n' : '';
  return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtmlAttr(title)}</title>
  <meta name="description" content="${escapeHtmlAttr(description)}">
${robotsLine}${seoHead({ title, description, pageFile })}
  <link rel="icon" type="image/png" href="icon.png">
  <link rel="apple-touch-icon" href="icon.png">
  <link rel="stylesheet" href="${SITE_CSS_FILE}">
  ${headThemeInitScript}${extraAfterTheme}
</head>`;
}

/**
 * Full HTML document: head + body wrapper + shared footer + optional trailing <script>.
 * @param {object} opts.headOptions - passed to sitePageHead
 * @param {string} opts.bodyHtml - main content only (no footer); typically indented with two spaces
 * @param {string} [opts.scriptInner] - raw JS inserted inside one <script> block
 */
function layoutSitePage({ headOptions, bodyHtml, scriptInner }) {
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

async function writeSeoAuxFiles() {
  const origin = getSiteOrigin();
  const urls = [
    `${origin}/`,
    `${origin}/docs.html`,
    `${origin}/examples.html`,
    `${origin}/changelog.html`,
  ];
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join('\n') +
    `\n</urlset>\n`;
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
  await writeFile(join(DIST, 'sitemap.xml'), sitemap);
  await writeFile(join(DIST, 'robots.txt'), robots);
  console.log('  Generated sitemap.xml, robots.txt');
}

async function loadSvg(style, weight, name) {
  const path = join(DIST, 'uiuxicons', `${style}-${weight}`, `${name}.svg`);
  if (!existsSync(path)) return null;
  return await readFile(path, 'utf8');
}

// ============================================================================
// SHARED TEMPLATES
// ============================================================================

function themeToggleIcons(moonIcon, sunIcon) {
  return `
    <span id="theme-icon-dark" class="size-4 shrink-0 [&>svg]:size-4 inline-flex" aria-hidden="true">${moonIcon}</span>
    <span id="theme-icon-light" class="size-4 shrink-0 [&>svg]:size-4 hidden" aria-hidden="true">${sunIcon}</span>
  `;
}

const CLOSE_ICON_SVG = `<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.2929 6.29289C17.6834 5.90237 18.3166 5.90237 18.7071 6.29289C19.0976 6.68342 19.0976 7.31658 18.7071 7.70711L13.4142 13L18.7071 18.2929C19.0976 18.6834 19.0976 19.3166 18.7071 19.7071C18.3166 20.0976 17.6834 20.0976 17.2929 19.7071L12 14.4142L6.70711 19.7071C6.31658 20.0976 5.68342 20.0976 5.29289 19.7071C4.90237 19.3166 4.90237 18.6834 5.29289 18.2929L10.5858 13L5.29289 7.70711C4.90237 7.31658 4.90237 6.68342 5.29289 6.29289C5.68342 5.90237 6.31658 5.90237 6.70711 6.29289L12 11.5858L17.2929 6.29289Z"/></svg>`;

function sharedHeader(
  currentPage = 'icons',
  totalIcons = null,
  themeIcons = '',
  logoIcon = '',
  downloadIcon = '',
  menuIcon = ''
) {
  const navLinks = [
    { id: 'icons', href: 'index.html', label: 'Icons' },
    { id: 'docs', href: 'docs.html', label: 'Docs' },
    { id: 'examples', href: 'examples.html', label: 'Examples' },
    { id: 'changelog', href: 'changelog.html', label: 'Changelog' },
  ];
  
  const badge = totalIcons
    ? `<span class="inline-flex shrink-0 items-center rounded-md bg-secondary px-1.5 py-1 text-xs font-medium leading-none tabular-nums text-fg">${totalIcons}</span>`
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
        <a href="index.html" class="flex items-center shrink-0" title="UI/UX Icons">
          <span class="inline-flex size-8">${logoIcon}</span>
        </a>
        <nav class="hidden md:flex items-center gap-3" aria-label="Primary">
          ${navLinks.map(link => `
            <a href="${link.href}" class="inline-flex items-center gap-1.5 text-sm ${linkClass(link)}"><span class="shrink-0">${link.label}</span>${link.id === 'icons' ? badge : ''}</a>
          `).join('')}
        </nav>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <a href="https://uiuxassets.com" class="hidden md:inline text-sm text-fg-muted hover:text-fg" target="_blank" rel="noopener noreferrer">By UI/UX Assets</a>
        <button
          id="theme-toggle"
          type="button"
          class="inline-flex shrink-0 items-center justify-center gap-1.5 p-2 rounded-md border border-border bg-secondary hover:bg-tertiary text-fg cursor-pointer"
          title="Toggle theme"
          aria-label="Toggle light or dark theme"
        >
          ${themeIcons}
        </button>
        <a
          href="downloads/uiuxicons.zip"
          download="uiuxicons.zip"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 max-md:p-2 text-sm rounded-md border border-border bg-secondary hover:bg-tertiary text-fg"
          title="Download all icons (ZIP: SVG, fonts)"
          aria-label="Download all icons (ZIP: SVG, fonts)"
        >
          <span class="inline-flex size-4 shrink-0 [&>svg]:size-4" aria-hidden="true">${downloadIcon}</span>
          <span class="max-md:sr-only">Download</span>
        </a>
        <button
          type="button"
          id="mobile-nav-toggle"
          class="md:hidden inline-flex shrink-0 items-center justify-center p-2 rounded-md border border-border bg-secondary hover:bg-tertiary text-fg cursor-pointer"
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
        <a href="index.html" class="inline-flex shrink-0 items-center" title="UI/UX Icons">
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
      <div class="mt-auto p-3 border-t border-border shrink-0">
        <a id="mobile-nav-footer-link" href="https://uiuxassets.com" class="text-sm text-fg-muted hover:text-fg" target="_blank" rel="noopener noreferrer">By UI/UX Assets</a>
      </div>
    </div>
  </div>`;
}

function categoryNavInnerHtml(meta, icons) {
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

const sharedFooter = `
  <footer class="border-t border-border">
    <div class="max-w-7xl mx-auto px-3 py-8 text-center text-sm text-fg-muted">
      <p>MIT License - Free for personal and commercial use.</p>
      <p class="mt-2"><a href="https://uiuxicons.com" class="text-fg-secondary hover:text-fg">uiuxicons.com</a></p>
    </div>
  </footer>
`;

// Stylesheet filename referenced by every generated page. The build passes a
// content-hashed name (styles.<hash>.css) so browsers never serve stale CSS.
let SITE_CSS_FILE = 'styles.css';

async function generateSite({ cssFile } = {}) {
  if (cssFile) SITE_CSS_FILE = cssFile;
  const metaPath = join(DIST, 'uiuxicons.json');
  if (!existsSync(metaPath)) {
    throw new Error('dist/uiuxicons.json not found - run npm run build first');
  }

  let meta;
  try {
    meta = JSON.parse(await readFile(metaPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse dist/uiuxicons.json: ${err.message}`);
  }
  
  // Load all SVGs for all style-weight combinations
  const icons = [];
  for (const icon of meta.icons) {
    const svgs = {};
    for (const style of meta.styles) {
      for (const weight of meta.weights) {
        const key = `${style}-${weight}`;
        svgs[key] = await loadSvg(style, weight, icon.name);
      }
    }
    icons.push({ ...icon, svgs });
  }

  // Load theme toggle icons
  const moonIcon = await loadSvg('line', 'regular', 'moon') || '';
  const sunIcon = await loadSvg('line', 'regular', 'sun') || '';
  const themeIcons = themeToggleIcons(moonIcon, sunIcon);
  
  // Load logo icon
  const logoIcon = await loadSvg('solid', 'regular', 'ui-ux') || '';
  const downloadIcon = await loadSvg('line', 'regular', 'file-arrow-down') || '';
  const menuIcon = await loadSvg('line', 'regular', 'menu') || '';
  const listIcon = await loadSvg('solid', 'regular', 'list') || '';

  const indexTitle = 'UI/UX Icons - Free Icon Library';
  const indexDescription = `A clean, consistent icon library for modern interfaces. ${meta.total} icons in 3 styles and 3 weights. Free and open source.`;

  const html = layoutSitePage({
    headOptions: {
      title: indexTitle,
      description: indexDescription,
      pageFile: 'index.html',
      extraAfterTheme: '',
    },
    bodyHtml: `  ${sharedHeader('icons', meta.total, themeIcons, logoIcon, downloadIcon, menuIcon)}
  
  <!-- Toolbar -->
  <div class="sticky top-[var(--site-header-h)] z-10 bg-main/90 backdrop-blur-sm border-b border-border">
    <div class="max-w-7xl mx-auto p-3 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      <!-- Mobile -->
      <div class="flex items-center gap-3 w-full md:contents">
        <div class="flex-1 min-w-0 md:flex-1 md:min-w-[200px]">
          <input 
            type="text" 
            id="search" 
            placeholder="Search..." 
            class="h-10 w-full box-border px-3 bg-secondary border border-border hover:border-border-hover focus:border-border-hover rounded-md text-sm leading-normal focus:outline-none placeholder:text-fg-muted"
          >
        </div>
        <button
          type="button"
          id="categories-toggle"
          class="md:hidden h-10 shrink-0 flex min-w-0 max-w-[min(11rem,46%)] items-center gap-3 px-3 rounded-md border border-border bg-secondary hover:bg-tertiary text-fg-secondary hover:text-fg cursor-pointer"
          aria-expanded="false"
          aria-controls="categories-drawer"
          aria-label="Icon categories, currently All Icons"
        >
          <span class="inline-flex size-5 shrink-0 [&>svg]:size-5 text-fg" aria-hidden="true">${listIcon}</span>
          <span id="categories-toolbar-label" class="truncate text-left text-sm text-fg">All Icons</span>
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-3 w-full md:hidden">
        <select
          id="style-select"
          aria-label="Style"
          class="toolbar-select h-10 min-w-0 w-full box-border text-sm leading-normal rounded-md bg-secondary border border-border hover:border-border-hover focus:border-border-hover text-fg focus:outline-none cursor-pointer"
        >
          ${meta.styles.map((s, i) => `
          <option value="${s}"${i === 0 ? ' selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>
          `).join('')}
        </select>
        <select
          id="weight-select"
          aria-label="Weight"
          class="toolbar-select h-10 min-w-0 w-full box-border text-sm leading-normal rounded-md bg-secondary border border-border hover:border-border-hover focus:border-border-hover text-fg focus:outline-none cursor-pointer"
        >
          ${meta.weights.map((w) => `
          <option value="${w}"${w === 'regular' ? ' selected' : ''}>${w.charAt(0).toUpperCase() + w.slice(1)}</option>
          `).join('')}
        </select>
      </div>
      
      <div class="hidden md:flex gap-1 bg-secondary p-1 rounded-md">
        ${meta.styles.map((s, i) => `
          <button 
            data-style-btn="${s}" 
            type="button"
            class="style-btn px-3 py-1.5 text-sm rounded-md cursor-pointer ${i === 0 ? 'bg-active text-fg' : 'text-fg-secondary hover:text-fg'}"
          >${s.charAt(0).toUpperCase() + s.slice(1)}</button>
        `).join('')}
      </div>
      
      <div class="hidden md:flex gap-1 bg-secondary p-1 rounded-md">
        ${meta.weights.map((w) => `
          <button 
            data-weight-btn="${w}" 
            type="button"
            class="weight-btn px-3 py-1.5 text-sm rounded-md cursor-pointer ${w === 'regular' ? 'bg-active text-fg' : 'text-fg-secondary hover:text-fg'}"
          >${w.charAt(0).toUpperCase() + w.slice(1)}</button>
        `).join('')}
      </div>
      
      <div class="flex w-full min-w-0 flex-wrap items-center gap-3 md:flex-1 md:min-w-[12rem]">
        <div class="flex min-h-10 min-w-0 flex-1 items-center gap-3">
          <input type="range" id="size" min="12" max="96" value="24" step="4" class="min-w-0 flex-1 h-1.5 bg-tertiary rounded-md appearance-none cursor-pointer">
          <span id="size-label" class="w-8 shrink-0 text-xs text-fg tabular-nums">24px</span>
        </div>
        <input type="color" id="color" class="size-10 shrink-0 rounded-md cursor-pointer bg-transparent border-0">
        <button type="button" id="reset-btn" class="inline-flex size-10 shrink-0 items-center justify-center rounded-md cursor-pointer bg-secondary hover:bg-tertiary text-fg-secondary hover:text-fg" title="Reset to defaults">
          <svg class="size-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.47195 1.39342C3.47195 0.979215 3.80774 0.643431 4.22195 0.643425C4.63616 0.643425 4.97195 0.979211 4.97195 1.39342V5.24499C5.0165 5.19867 5.0601 5.15097 5.10574 5.10534C8.91336 1.29788 15.0872 1.29779 18.8948 5.10534C22.7024 8.9129 22.7023 15.0868 18.8948 18.8944C15.0872 22.702 8.91335 22.702 5.10574 18.8944C3.25579 17.0445 2.30432 14.6343 2.25222 12.2108C2.24333 11.7967 2.57248 11.4531 2.9866 11.4442C3.40049 11.4356 3.74333 11.7646 3.75222 12.1786C3.79635 14.231 4.60054 16.2681 6.16628 17.8339C9.38799 21.0556 14.6114 21.0553 17.8333 17.8339C21.0551 14.612 21.0551 9.38869 17.8333 6.16686C14.6114 2.94505 9.38811 2.94504 6.16628 6.16686C6.12237 6.21078 6.08008 6.25602 6.03738 6.30065H9.87917C10.2932 6.30085 10.6292 6.63656 10.6292 7.05065C10.629 7.46457 10.2931 7.80046 9.87917 7.80065H4.72195C4.03172 7.80065 3.47215 7.24083 3.47195 6.55065V1.39342Z"/></svg>
        </button>
      </div>
    </div>
  </div>

  <div id="categories-drawer" class="fixed inset-0 z-[35] md:hidden hidden" role="dialog" aria-modal="true" aria-label="Icon categories">
    <div id="categories-drawer-backdrop" class="absolute inset-0 bg-black/60" aria-hidden="true"></div>
    <div id="categories-drawer-panel" class="absolute inset-0 w-full h-full bg-main flex flex-col overflow-y-auto shadow-xl">
      <div class="flex items-center justify-between gap-3 p-3 border-b border-border shrink-0">
        <a href="index.html" class="inline-flex shrink-0" title="UI/UX Icons">
          <span class="inline-flex size-8">${logoIcon}</span>
        </a>
        <button type="button" id="categories-drawer-close" class="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-secondary p-2 text-fg hover:bg-tertiary cursor-pointer" aria-label="Close category menu">
          ${CLOSE_ICON_SVG}
        </button>
      </div>
      <nav class="space-y-1 p-3 flex-1">
        ${categoryNavInnerHtml(meta, icons)}
      </nav>
    </div>
  </div>

  <div class="max-w-7xl mx-auto p-3 flex gap-3">
    <!-- Sidebar -->
    <aside class="hidden md:block w-48 shrink-0">
      <div class="sticky top-[var(--site-icons-sidebar-sticky-top)]">
        <nav class="space-y-1">
          ${categoryNavInnerHtml(meta, icons)}
        </nav>
      </div>
    </aside>

    <!-- Icons Grid -->
    <main class="flex-1">
      <h1 class="sr-only">${escapeHtmlAttr(indexTitle)}</h1>
      <div id="icons" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        ${icons.map(icon => `
          <div 
            class="icon-item group relative flex flex-col items-center justify-center p-4 rounded-md bg-secondary hover:bg-tertiary cursor-pointer"
            data-name="${escapeHtmlAttr(icon.name)}"
            data-category="${escapeHtmlAttr(icon.category)}"
            data-tags="${escapeHtmlAttr(icon.tags.join(' '))}"
          >
            ${meta.styles.map(style => 
              meta.weights.map(weight => {
                const key = `${style}-${weight}`;
                const isDefault = style === 'line' && weight === 'regular';
                return `<div data-variant="${key}" class="${isDefault ? 'active' : ''}">${icon.svgs[key] || ''}</div>`;
              }).join('')
            ).join('')}
            <span class="mt-2 text-xs text-fg-muted truncate w-full text-center group-hover:text-fg-secondary">${escapeHtmlText(icon.name)}</span>
          </div>
        `).join('')}
      </div>
      
      <!-- No Results -->
      <div id="no-results" class="hidden py-20 text-center text-fg-muted">
        No icons found
      </div>
    </main>
  </div>

  <!-- Toast -->
  <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 px-3 py-2 bg-tertiary text-sm rounded-md hidden"></div>
`,
    scriptInner: `${focusTrapRuntime}

    const iconItems = document.querySelectorAll('.icon-item');
    const search = document.getElementById('search');
    const noResults = document.getElementById('no-results');
    const styleBtns = document.querySelectorAll('[data-style-btn]');
    const weightBtns = document.querySelectorAll('[data-weight-btn]');
    const styleSelect = document.getElementById('style-select');
    const weightSelect = document.getElementById('weight-select');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const colorPicker = document.getElementById('color');
    const sizeSlider = document.getElementById('size');
    const sizeLabel = document.getElementById('size-label');
    const iconsGrid = document.getElementById('icons');
    const toast = document.getElementById('toast');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const themeIconLight = document.getElementById('theme-icon-light');
    
    let currentStyle = 'line';
    let currentWeight = 'regular';
    let currentCategory = 'all';

    function categoryDisplayName(slug) {
      if (slug === 'all') return 'All Icons';
      return slug.charAt(0).toUpperCase() + slug.slice(1);
    }

    function updateCategoryLabels() {
      const name = categoryDisplayName(currentCategory);
      const toolbar = document.getElementById('categories-toolbar-label');
      const toggle = document.getElementById('categories-toggle');
      if (toolbar) toolbar.textContent = name;
      if (toggle) toggle.setAttribute('aria-label', 'Icon categories, currently ' + name);
    }
    updateCategoryLabels();

    function updateVariant() {
      const variant = currentStyle + '-' + currentWeight;
      document.querySelectorAll('[data-variant]').forEach(el => {
        el.classList.toggle('active', el.dataset.variant === variant);
      });
    }

    function syncStyleControls() {
      if (styleSelect) styleSelect.value = currentStyle;
      styleBtns.forEach(b => {
        const active = b.dataset.styleBtn === currentStyle;
        b.classList.toggle('bg-active', active);
        b.classList.toggle('text-fg', active);
        b.classList.toggle('text-fg-secondary', !active);
      });
    }

    function syncWeightControls() {
      if (weightSelect) weightSelect.value = currentWeight;
      weightBtns.forEach(b => {
        const active = b.dataset.weightBtn === currentWeight;
        b.classList.toggle('bg-active', active);
        b.classList.toggle('text-fg', active);
        b.classList.toggle('text-fg-secondary', !active);
      });
    }

    // Theme and color (index-specific: handles color picker)
    function updateThemeAndColor() {
      const isLight = document.documentElement.classList.contains('light');
      themeIconDark.classList.toggle('hidden', isLight);
      themeIconDark.classList.toggle('inline-flex', !isLight);
      themeIconLight.classList.toggle('hidden', !isLight);
      themeIconLight.classList.toggle('inline-flex', isLight);
      
      const defaultColor = isLight ? '#000000' : '#ffffff';
      const color = localStorage.userColor || defaultColor;
      colorPicker.value = color;
      iconsGrid.style.color = color;
    }
    updateThemeAndColor();

    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('light');
      localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
      updateThemeAndColor();
    });

    // Reset to defaults
    document.getElementById('reset-btn').addEventListener('click', () => {
      currentStyle = 'line';
      currentWeight = 'regular';
      syncStyleControls();
      syncWeightControls();
      updateVariant();
      
      // Reset size
      sizeSlider.value = 24;
      sizeLabel.textContent = '24px';
      document.documentElement.style.setProperty('--icon-size', '24px');
      
      // Reset color
      delete localStorage.userColor;
      updateThemeAndColor();
      
      // Reset category
      currentCategory = 'all';
      categoryBtns.forEach(b => {
        b.classList.toggle('bg-tertiary', b.dataset.category === 'all');
        b.classList.toggle('text-fg', b.dataset.category === 'all');
        b.classList.toggle('text-fg-secondary', b.dataset.category !== 'all');
      });
      
      // Reset search
      search.value = '';
      filter();
      updateCategoryLabels();

      showToast('Reset to defaults');
    });

    // Search
    search.addEventListener('input', filter);

    // Color picker
    colorPicker.addEventListener('input', (e) => {
      iconsGrid.style.color = e.target.value;
      localStorage.userColor = e.target.value;
    });

    // Size slider
    sizeSlider.addEventListener('input', (e) => {
      const size = e.target.value;
      document.documentElement.style.setProperty('--icon-size', size + 'px');
      sizeLabel.textContent = size + 'px';
    });

    styleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentStyle = btn.dataset.styleBtn;
        syncStyleControls();
        updateVariant();
      });
    });

    weightBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentWeight = btn.dataset.weightBtn;
        syncWeightControls();
        updateVariant();
      });
    });

    styleSelect?.addEventListener('change', () => {
      currentStyle = styleSelect.value;
      syncStyleControls();
      updateVariant();
    });

    weightSelect?.addEventListener('change', () => {
      currentWeight = weightSelect.value;
      syncWeightControls();
      updateVariant();
    });

    // Category filter
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.category;
        categoryBtns.forEach(b => {
          b.classList.toggle('bg-tertiary', b === btn);
          b.classList.toggle('text-fg', b === btn);
          b.classList.toggle('text-fg-secondary', b !== btn);
        });
        filter();
        updateCategoryLabels();
        const cd = document.getElementById('categories-drawer');
        const ct = document.getElementById('categories-toggle');
        if (cd && !cd.classList.contains('hidden')) {
          if (window.uiuxReleaseCategoriesFocusTrap) window.uiuxReleaseCategoriesFocusTrap();
          cd.classList.add('hidden');
          if (ct) ct.setAttribute('aria-expanded', 'false');
          if (document.getElementById('mobile-nav')?.classList.contains('hidden')) {
            document.body.style.overflow = '';
          }
        }
      });
    });

    ${categoriesDrawerScript}

    ${mobileNavScript}

    // Filter icons
    function filter() {
      const q = search.value.toLowerCase().trim();
      let visible = 0;
      iconItems.forEach(icon => {
        const name = icon.dataset.name;
        const tags = icon.dataset.tags;
        const category = icon.dataset.category;
        const matchesSearch = !q || name.includes(q) || tags.includes(q);
        const matchesCategory = currentCategory === 'all' || category === currentCategory;
        const show = matchesSearch && matchesCategory;
        icon.classList.toggle('hidden', !show);
        if (show) visible++;
      });
      noResults.classList.toggle('hidden', visible > 0);
    }

    function copySvgMarkup(text) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text).then(
          () => true,
          () => false
        );
      }
      return new Promise((resolve) => {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          resolve(ok);
        } catch (e) {
          resolve(false);
        }
      });
    }

    iconItems.forEach(icon => {
      icon.addEventListener('click', () => {
        const svg = icon.querySelector('[data-variant].active svg');
        if (!svg) return;
        copySvgMarkup(svg.outerHTML).then((ok) => {
          showToast(ok ? 'Copied SVG' : 'Could not copy - try selecting the icon or use HTTPS');
        });
      });
    });

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.remove('hidden');
      toast.classList.add('toast');
      setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('toast');
      }, 2000);
    }
`,
  });

  await writeFile(join(DIST, 'index.html'), html);
  console.log('  Generated index.html');
  
  // Generate examples page
  await generateExamples(meta.total, themeIcons, logoIcon, downloadIcon, menuIcon);
  
  // Generate changelog page
  await generateChangelog(meta.total, themeIcons, logoIcon, downloadIcon, menuIcon);
  
  // Generate docs page
  await generateDocs(meta, themeIcons, logoIcon, downloadIcon, menuIcon, listIcon);

  await generate404Page(meta.total, themeIcons, logoIcon, downloadIcon, menuIcon);

  await writeLlmsTxt(meta);

  await writeSeoAuxFiles();
}

async function writeLlmsTxt(meta) {
  const docFiles = (await readdir(DOCS_DIR)).filter(f => DOC_FILE_RE.test(f)).sort();
  const sections = [];
  for (const name of docFiles) {
    const raw = await readFile(join(DOCS_DIR, name), 'utf8');
    const { meta: fm, body } = parseDocFrontmatter(raw);
    const title = fm.title || name.replace(DOC_FILE_RE, '$2');
    const cleaned = body
      .replace(/\{\{total\}\}/g, String(meta.total))
      .replace(/<table[\s\S]*?<\/table>/g, '')
      .replace(/<div[\s\S]*?<\/div>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    sections.push(`## ${title}\n\n${cleaned}`);
  }

  const header = [
    '# UI/UX Icons',
    '',
    `> ${meta.total} icons in 3 styles (Line, Duotone, Solid) and 3 weights (Light, Regular, Bold).`,
    '> Every icon uses a 24x24 viewBox with currentColor.',
    '',
    '- Website: https://uiuxicons.com',
    '- Packages: @uiuxicons/react, @uiuxicons/vue',
    '- License: MIT',
    '',
  ].join('\n');

  const content = header + sections.join('\n\n---\n\n') + '\n';
  await writeFile(join(DIST, 'llms.txt'), content, 'utf8');
  console.log('  Generated llms.txt');
}

async function generate404Page(
  totalIcons,
  themeIcons,
  logoIcon,
  downloadIcon,
  menuIcon
) {
  const title = 'Page not found - UI/UX Icons';
  const description = 'The page you requested is not available. Browse the icon library or documentation.';

  const html = layoutSitePage({
    headOptions: { title, description, pageFile: '404.html', robotsNoindex: true },
    bodyHtml: `  ${sharedHeader('__404__', totalIcons, themeIcons, logoIcon, downloadIcon, menuIcon)}

  <main class="max-w-3xl mx-auto px-3 py-16 text-center">
    <h1 class="text-3xl font-bold mb-3">Page not found</h1>
    <p class="text-fg mb-8">That URL does not exist or has moved.</p>
    <p class="flex flex-wrap items-center justify-center gap-3">
      <a href="index.html" class="inline-flex items-center px-4 py-2 rounded-md border border-border bg-secondary hover:bg-tertiary text-fg text-sm">Browse icons</a>
      <a href="docs.html" class="inline-flex items-center px-4 py-2 rounded-md border border-border bg-secondary hover:bg-tertiary text-fg text-sm">Documentation</a>
    </p>
  </main>
`,
    scriptInner: simplePageScripts,
  });

  await writeFile(join(DIST, '404.html'), html);
  console.log('  Generated 404.html');
}

async function generateExamples(totalIcons, themeIcons, logoIcon, downloadIcon, menuIcon) {
  // Load icons for examples
  const getIcon = async (name, weight = 'regular') => {
    const svg = await loadSvg('line', weight, name);
    return svg || '';
  };
  
  const icons = {
    // Bold for buttons
    houseBold: await getIcon('house', 'bold'),
    plusBold: await getIcon('plus', 'bold'),
    xBold: await getIcon('x', 'bold'),
    arrowRightBold: await getIcon('arrow-circle-right', 'bold'),
    // Regular for other UI
    envelope: await getIcon('envelope'),
    plus: await getIcon('plus'),
    plusCircle: await getIcon('plus-circle'),
    target: await getIcon('target'),
    house: await getIcon('house'),
    table: await getIcon('table'),
    arrowRight: await getIcon('arrow-circle-right'),
  };

  const examplesTitle = 'Examples - UI/UX Icons';
  const examplesDescription =
    'UI patterns using UI/UX Icons: buttons, inputs, cards, lists, and alerts. See the library in real interface components.';

  const html = layoutSitePage({
    headOptions: {
      title: examplesTitle,
      description: examplesDescription,
      pageFile: 'examples.html',
    },
    bodyHtml: `  ${sharedHeader('examples', totalIcons, themeIcons, logoIcon, downloadIcon, menuIcon)}

  <main class="max-w-3xl mx-auto px-3 py-6">
    <h1 class="text-3xl font-bold mb-2">Examples</h1>
    <p class="text-fg mb-6">See how icons look in real UI components, made with UI/UX Icons.</p>

    <!-- Buttons Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">Buttons</h2>
      <div class="flex flex-wrap gap-3 items-center">
        <!-- Primary Button -->
        <button class="inline-flex items-center justify-center gap-1.5 pl-3 pr-4 py-2 bg-accent text-main rounded-md cursor-pointer hover:bg-accent/90">
          <span class="inline-flex size-4.5">${icons.plusBold}</span>
          Create New
        </button>
        
        <!-- Secondary Button -->
        <button class="inline-flex items-center justify-center gap-1.5 pl-3 pr-4 py-2 bg-fg-secondary/20 text-fg rounded-md cursor-pointer hover:bg-fg-secondary/25">
          <span class="inline-flex size-4.5">${icons.houseBold}</span>
          Dashboard
        </button>
        
        <!-- Outline Button -->
        <button class="inline-flex items-center justify-center gap-1.5 pl-3 pr-4 py-[calc(0.5rem-1px)] border border-border text-fg rounded-md cursor-pointer hover:bg-fg-secondary/10">
          Continue
          <span class="inline-flex size-4.5">${icons.arrowRightBold}</span>
        </button>
        
        <!-- Icon Only -->
        <button class="inline-flex items-center justify-center px-2.5 py-2.5 border border-border text-fg rounded-md cursor-pointer hover:bg-fg-secondary/10">
          <span class="inline-flex size-4.5">${icons.xBold}</span>
        </button>
      </div>
    </section>

    <!-- Inputs Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">Input Fields</h2>
      <div class="space-y-4 max-w-md">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted inline-flex size-5">${icons.target}</span>
          <input type="text" placeholder="Enter target..." class="w-full pl-9 pr-4 py-2 bg-secondary border border-border hover:border-border-hover focus:border-border-hover rounded-md text-fg placeholder:text-fg-muted focus:outline-none">
        </div>
        
        <!-- Input With Button -->
        <div class="flex gap-3">
          <div class="relative w-full">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted inline-flex size-5">${icons.envelope}</span>
            <input type="text" placeholder="Enter your email..." class="w-full pl-9 pr-4 py-2 bg-secondary border border-border hover:border-border-hover focus:border-border-hover rounded-md text-fg placeholder:text-fg-muted focus:outline-none">
          </div>
          <button class="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-accent text-main rounded-md cursor-pointer hover:bg-accent/90">Subscribe</button>
        </div>
      </div>
    </section>

    <!-- Cards Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">Cards</h2>
      <div class="p-6 bg-fg-secondary/5 rounded-md border border-border cursor-pointer hover:bg-fg-secondary/10">
        <div class="w-10 h-10 bg-accent rounded-md flex items-center justify-center mb-2 text-main">
          <span class="inline-flex size-5">${icons.plusCircle}</span>
        </div>
        <h3 class="font-semibold">Create Project</h3>
        <p class="text-sm text-fg-secondary">Start a new project and invite team members to collaborate.</p>
      </div>
    </section>

    <!-- List Items Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">List Items</h2>
      <div class="rounded-md border border-border divide-y divide-border">
        <div class="flex items-center gap-3 p-3 cursor-pointer hover:bg-fg/5">
          <span class="inline-flex size-5">${icons.house}</span>
          <span>Home</span>
        </div>
        <div class="flex items-center gap-3 p-3 cursor-pointer hover:bg-fg/5">
          <span class="inline-flex size-5">${icons.table}</span>
          <span>Data Table</span>
        </div>
        <div class="flex items-center gap-3 p-3 cursor-pointer hover:bg-fg/5">
          <span class="inline-flex size-5">${icons.target}</span>
          <span>Goals</span>
        </div>
      </div>
    </section>

    <!-- Alert/Badge Section -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold mb-3">Alerts & Tags</h2>
      <div class="space-y-4">
        <!-- Alert -->
        <div class="flex items-start gap-3 p-4 bg-accent rounded-md text-main">
          <span class="inline-flex size-5 mt-0.5">${icons.target}</span>
          <div>
            <p class="font-medium">New Feature</p>
            <p class="text-sm text-main/50">Icons now support 3 weights: light, regular, and bold.</p>
          </div>
        </div>
        
        <!-- Tags -->
        <div class="flex flex-wrap gap-3">
          <span class="inline-flex items-center gap-1 pl-2 pr-3 py-1 bg-secondary rounded-full text-xs uppercase">
            <span class="inline-flex size-3.5">${icons.house}</span>
            Home
          </span>
          <span class="inline-flex items-center gap-1 pl-2 pr-3 py-1 bg-secondary rounded-full text-xs uppercase">
            <span class="inline-flex size-3.5">${icons.target}</span>
            Target
          </span>
          <span class="inline-flex items-center gap-1 pl-2 pr-3 py-[calc(0.25rem-1px)] border border-border hover:bg-fg-secondary/10 text-fg/50 hover:text-fg cursor-pointer rounded-full text-xs uppercase">
            <span class="inline-flex size-3.5">${icons.plus}</span>
            Add Tag
          </span>
        </div>
      </div>
    </section>

  </main>
`,
    scriptInner: simplePageScripts,
  });

  await writeFile(join(DIST, 'examples.html'), html);
  console.log('  Generated examples.html');
}

async function generateChangelog(totalIcons, themeIcons, logoIcon, downloadIcon, menuIcon) {
  const changelogDir = join(ROOT, 'changelog');
  
  // Read all .txt files from changelog folder
  let entries = [];
  if (existsSync(changelogDir)) {
    const files = await readdir(changelogDir);
    for (const file of files) {
      if (!file.endsWith('.txt')) continue;
      const date = file.replace('.txt', '');
      const content = await readFile(join(changelogDir, file), 'utf8');
      entries.push({ date, content: content.trim() });
    }
  }
  
  // Sort by date descending (newest first)
  entries.sort((a, b) => b.date.localeCompare(a.date));
  
  // Format date for display (e.g., "December 27, 2024")
  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const changelogTitle = 'Changelog - UI/UX Icons';
  const changelogDescription =
    'Release history and updates for UI/UX Icons - new icons, styles, and fixes.';

  const html = layoutSitePage({
    headOptions: {
      title: changelogTitle,
      description: changelogDescription,
      pageFile: 'changelog.html',
    },
    bodyHtml: `  ${sharedHeader('changelog', totalIcons, themeIcons, logoIcon, downloadIcon, menuIcon)}

  <main class="max-w-3xl mx-auto px-3 py-6">
    <h1 class="text-3xl font-bold mb-2">Changelog</h1>
    <p class="text-fg mb-6">Updates and new additions to UI/UX Icons.</p>

    <div class="space-y-8">
      ${entries.length === 0 ? '<p class="text-fg-muted">No changelog entries yet.</p>' : entries.map(entry => `
      <article class="border-l-2 border-border pl-6">
        <time class="text-sm text-fg-muted">${escapeHtmlText(formatDate(entry.date))}</time>
        <p class="mt-1 text-fg">${escapeHtmlText(entry.content)}</p>
      </article>
      `).join('')}
    </div>
  </main>
`,
    scriptInner: simplePageScripts,
  });

  await writeFile(join(DIST, 'changelog.html'), html);
  console.log('  Generated changelog.html');
}

async function generateDocs(meta, themeIcons, logoIcon, downloadIcon, menuIcon, listIcon) {
  const docSections = await loadDocSections(meta);
  const docsNavItems = docsNavLinksHtml(docSections);
  const docsSectionTitlesJson = JSON.stringify(
    Object.fromEntries(docSections.map((s) => [s.id, s.title]))
  );
  const first = docSections[0];
  const docsMainSectionsHtml = docSections
    .map(
      (s) => `
      <section id="${escapeHtmlAttr(s.id)}" class="mb-6">
        <h2 class="text-xl font-semibold mb-2">${escapeHtmlText(s.title)}</h2>
        <div class="docs-section-inner">${s.html}</div>
      </section>`
    )
    .join('');

  const docsTitle = 'Docs - UI/UX Icons';
  const docsDescription =
    'Documentation for UI/UX Icons - React (@uiuxicons/react) and Vue (@uiuxicons/vue) packages, SVG download, and web fonts (WOFF2/TTF).';

  const html = layoutSitePage({
    headOptions: {
      title: docsTitle,
      description: docsDescription,
      pageFile: 'docs.html',
      extraAfterTheme: `
  <style>
    ${DOCS_HIGHLIGHT_CSS}
  </style>`,
    },
    bodyHtml: `  ${sharedHeader('docs', meta.total, themeIcons, logoIcon, downloadIcon, menuIcon)}

  <div id="docs-drawer" class="fixed inset-0 z-[35] md:hidden hidden" role="dialog" aria-modal="true" aria-label="Documentation sections">
    <div id="docs-drawer-backdrop" class="absolute inset-0 bg-black/60" aria-hidden="true"></div>
    <div id="docs-drawer-panel" class="absolute inset-0 w-full h-full bg-main flex flex-col overflow-y-auto shadow-xl">
      <div class="flex items-center justify-between gap-3 p-3 border-b border-border shrink-0">
        <a href="index.html" class="inline-flex shrink-0" title="UI/UX Icons">
          <span class="inline-flex size-8">${logoIcon}</span>
        </a>
        <button type="button" id="docs-drawer-close" class="inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-secondary p-2 text-fg hover:bg-tertiary cursor-pointer" aria-label="Close documentation menu">
          ${CLOSE_ICON_SVG}
        </button>
      </div>
      <nav class="docs-nav flex-1 space-y-1 p-3" aria-label="Documentation">
        ${docsNavItems}
      </nav>
    </div>
  </div>

  <div class="md:hidden sticky top-[var(--site-header-h)] z-10 border-b border-border bg-main/90 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto px-3 py-3">
      <button
        type="button"
        id="docs-nav-toggle"
        class="h-10 w-full flex min-w-0 items-center gap-3 px-3 rounded-md border border-border bg-secondary hover:bg-tertiary text-fg-secondary hover:text-fg cursor-pointer"
        aria-expanded="false"
        aria-controls="docs-drawer"
        aria-label="${escapeHtmlAttr(`Documentation sections, currently ${first.title}`)}"
      >
        <span class="inline-flex size-5 shrink-0 [&>svg]:size-5 text-fg" aria-hidden="true">${listIcon}</span>
        <span id="docs-nav-toolbar-label" class="min-w-0 flex-1 truncate text-left text-sm text-fg">${escapeHtmlText(first.title)}</span>
      </button>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-3 py-6 flex gap-3">
    <!-- Sidebar -->
    <aside class="hidden md:block w-48 shrink-0">
      <div class="sticky top-[var(--site-docs-aside-sticky-top)]">
        <nav class="docs-nav space-y-1">
          ${docsNavItems}
        </nav>
      </div>
    </aside>

    <!-- Content -->
    <main class="docs-content flex-1 min-w-0">
      <h1 class="text-3xl font-bold mb-2">Documentation</h1>
      <p class="text-sm text-fg mb-6">Everything you need to use UI/UX Icons in your projects.</p>
${docsMainSectionsHtml}
    </main>
  </div>
`,
    scriptInner: `${docsPageScripts}

    // Active sidebar link tracking
    const sections = document.querySelectorAll('.docs-content section[id]');
    const navLinks = document.querySelectorAll('.docs-nav a');
    const docsNavToolbarLabel = document.getElementById('docs-nav-toolbar-label');
    const docsNavToggle = document.getElementById('docs-nav-toggle');
    const docsSectionTitles = ${docsSectionTitlesJson};

    function updateActiveLink() {
      let current = ${JSON.stringify(first.id)};
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 250) current = section.id;
      }
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const isActive = href === '#' + current;
        link.classList.toggle('bg-tertiary', isActive);
        link.classList.toggle('text-fg', isActive);
        link.classList.toggle('text-fg-secondary', !isActive);
      });
      const title = docsSectionTitles[current];
      if (title && docsNavToolbarLabel) docsNavToolbarLabel.textContent = title;
      if (title && docsNavToggle) {
        docsNavToggle.setAttribute('aria-label', 'Documentation sections, currently ' + title);
      }
    }

    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();

    // Package manager tab switching (synced across all tab groups, persisted)
    (function() {
      var KEY = 'uiuxicons-pm';
      var groups = document.querySelectorAll('.docs-pkg-tabs');
      if (!groups.length) return;
      function activate(pm) {
        groups.forEach(function(g) {
          g.querySelectorAll('.docs-pkg-tabs-bar button').forEach(function(btn) {
            btn.setAttribute('aria-selected', btn.dataset.pm === pm ? 'true' : 'false');
          });
          g.querySelectorAll('.docs-pkg-tabs-panels pre').forEach(function(pre) {
            pre.hidden = pre.dataset.pm !== pm;
          });
        });
        try { localStorage.setItem(KEY, pm); } catch(_) {}
      }
      groups.forEach(function(g) {
        g.querySelectorAll('.docs-pkg-tabs-bar button').forEach(function(btn) {
          btn.addEventListener('click', function() { activate(btn.dataset.pm); });
        });
      });
      var saved = null;
      try { saved = localStorage.getItem(KEY); } catch(_) {}
      if (saved) activate(saved);
    })();
`,
  });

  await writeFile(join(DIST, 'docs.html'), html);
  console.log('  Generated docs.html');
}

export { generateSite };

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSite().catch(err => {
    console.error('Site generation failed:', err.message);
    process.exit(1);
  });
}
