/**
 * Docs page: numbered markdown files from docs/ rendered into one page with a
 * scrollspy sidebar. Raw HTML in the markdown is allowed but gated by
 * assertDocHtmlSafe at build time.
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import MarkdownIt from 'markdown-it';
import {
  DIST,
  DOCS_DIR,
  DOC_FILE_RE,
  escapeHtmlAttr,
  escapeHtmlText,
  parseDocFrontmatter,
  loadSvg,
} from '../common.js';
import { highlightDocCode, DOCS_HIGHLIGHT_CSS } from '../highlight.js';
import { layoutSitePage, sharedHeader, CLOSE_ICON_SVG } from '../templates.js';
import { docsPageScripts, copyTextRuntime, toastRuntime } from '../../site-snippets.js';
import { assertDocHtmlSafe } from '../../doc-safety.js';

// SECURITY: html:true allows raw HTML in docs/*.md (needed for tables, tabs,
// and the font demo). assertDocHtmlSafe (scripts/doc-safety.js) rejects
// injected active content (scripts, embeds, inline event handlers, unsafe
// URLs) at build time so a malicious docs PR cannot introduce XSS into the
// generated pages.
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
    assertDocHtmlSafe(html, name);
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
          <a href="#${escapeHtmlAttr(s.id)}" class="${itemBase}">
            <span class="min-w-0 flex-1 truncate text-left">${escapeHtmlText(s.title)}</span>
          </a>`
    )
    .join('');
}

export async function generateDocs(meta, shared) {
  const { themeIcons, logoIcon, downloadIcon, menuIcon, listIcon } = shared;
  const copySvg = await loadSvg('line', 'regular', 'copy') || '';
  const copyBtnInner = copySvg
    ? `<span class="inline-flex size-4 shrink-0 [&>svg]:size-4" aria-hidden="true">${copySvg}</span>`
    : 'Copy';
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
    'Documentation for UI/UX Icons - React (@uiuxicons/react) and Vue (@uiuxicons/vue) packages, core assets (@uiuxicons/core), SVG download, and web fonts (WOFF2/TTF).';

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
        <a href="/" class="inline-flex shrink-0" title="UI/UX Icons">
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

  <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 px-3 py-2 bg-tertiary text-sm rounded-md hidden"></div>
`,
    scriptInner: `${docsPageScripts}
    ${copyTextRuntime}
    ${toastRuntime}

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

    // Hover-reveal copy buttons on every code block (tabbed groups get one
    // button that copies the visible panel; standalone blocks get their own)
    (function () {
      var copyBtnInner = ${JSON.stringify(copyBtnInner)};
      function addCopyButton(container, getPre) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Copy code');
        btn.className = 'snippet-copy-btn absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md border border-border bg-main hover:bg-tertiary text-fg-secondary hover:text-fg cursor-pointer dark:bg-secondary';
        btn.innerHTML = copyBtnInner;
        btn.addEventListener('click', function () {
          var pre = getPre();
          if (!pre) return;
          copyText(pre.textContent.trim()).then(function (ok) {
            showToast(ok ? 'Copied' : 'Could not copy - use HTTPS');
          });
        });
        container.appendChild(btn);
      }
      document.querySelectorAll('.docs-pkg-tabs-panels').forEach(function (panels) {
        addCopyButton(panels, function () {
          return [].find.call(panels.querySelectorAll('pre'), function (p) { return !p.hidden; });
        });
      });
      document.querySelectorAll('.docs-section-inner pre').forEach(function (pre) {
        if (pre.closest('.docs-pkg-tabs-panels')) return;
        addCopyButton(pre, function () { return pre; });
      });
    })();
`,
  });

  await writeFile(join(DIST, 'docs.html'), html);
  console.log('  Generated docs.html');
}
