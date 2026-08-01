/**
 * Per-icon detail pages (/icons/{name}): hero preview with variant switcher,
 * usage snippets, "in action" mocks, and related icons.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { DIST, escapeHtmlAttr, escapeHtmlText } from '../common.js';
import { layoutSitePage, sharedHeader } from '../templates.js';
import { highlightDocCode, DOCS_HIGHLIGHT_CSS } from '../highlight.js';
import { iconPageJsonLd } from '../seo.js';
import {
  simplePageScripts,
  iconTileRuntime,
  copyTextRuntime,
  toastRuntime,
} from '../../site-snippets.js';

function iconDisplayName(name) {
  return name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

/** Up to `count` icons from the same category, alphabetically nearest to `icon`. */
function relatedIcons(icon, icons, count = 8) {
  const siblings = icons
    .filter((i) => i.category === icon.category && i.name !== icon.name)
    .sort((a, b) => a.name.localeCompare(b.name));
  if (siblings.length <= count) return siblings;
  // Window centered on the icon's alphabetical position for varied cross-links.
  let pos = siblings.findIndex((i) => i.name.localeCompare(icon.name) > 0);
  if (pos === -1) pos = siblings.length;
  const start = Math.max(0, Math.min(pos - Math.floor(count / 2), siblings.length - count));
  return siblings.slice(start, start + count);
}

// Snippets are highlighted at build time with the same hljs setup the docs use.
function iconSnippets(icon, pascalName, style, weight) {
  // line-regular is the packages' default, so the React/Vue snippets omit props
  const isDefault = style === 'line' && weight === 'regular';
  const componentProps = isDefault ? '' : ` variant="${style}" weight="${weight}"`;
  return [
    {
      id: 'react',
      label: 'React',
      code: highlightDocCode(`import { Icon${pascalName} } from "@uiuxicons/react";\n\n<Icon${pascalName}${componentProps} />`, 'tsx'),
    },
    {
      id: 'vue',
      label: 'Vue',
      code: highlightDocCode(`import { Icon${pascalName} } from "@uiuxicons/vue";\n\n<Icon${pascalName}${componentProps} />`, 'tsx'),
    },
    {
      id: 'font',
      label: 'Font',
      code: highlightDocCode(`<span class="uiuxicon uiux-${style} uiux-${weight} uiux-${icon.name}" aria-hidden="true"></span>`, 'html'),
    },
    {
      id: 'cdn',
      label: 'CDN',
      code: highlightDocCode(`https://cdn.jsdelivr.net/npm/@uiuxicons/core@0/svg/${style}-${weight}/${icon.name}.svg`, ''),
    },
  ];
}

/** Pre-rendered snippet HTML for every style/weight combination, keyed by
 *  "{style}-{weight}" then snippet id, so the client can swap snippets when
 *  the variant changes without shipping a highlighter. */
function iconSnippetVariants(icon, pascalName, styles, weights) {
  const map = {};
  for (const style of styles) {
    for (const weight of weights) {
      map[`${style}-${weight}`] = Object.fromEntries(
        iconSnippets(icon, pascalName, style, weight).map((s) => [s.id, s.code])
      );
    }
  }
  return map;
}

/** Static mock UI cards showing the icon in realistic component contexts.
 *  The .in-action-icon spans are swapped by JS when the variant changes. */
function iconInActionHtml(defaultSvg, chevronSvg) {
  const iconSpan = `<span class="in-action-icon inline-flex size-4 shrink-0 [&>svg]:size-4" aria-hidden="true">${defaultSvg}</span>`;
  const chevron = chevronSvg
    ? `<span class="inline-flex size-4 shrink-0 [&>svg]:size-4 text-fg" aria-hidden="true">${chevronSvg}</span>`
    : '';
  return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div class="rounded-lg border border-border bg-secondary/70 p-6 flex items-center justify-center gap-3 min-h-32">
          <button type="button" tabindex="-1" aria-hidden="true" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-active text-main text-sm font-medium cursor-pointer hover:bg-active/90">
            ${iconSpan}
            <span>Button</span>
          </button>
          <button type="button" tabindex="-1" aria-hidden="true" class="inline-flex items-center justify-center size-9 rounded-md border border-border bg-main text-fg cursor-pointer hover:bg-tertiary dark:bg-secondary">
            ${iconSpan}
          </button>
        </div>
        <div class="rounded-lg border border-border bg-secondary/70 p-6 flex items-center min-h-32">
          <div class="group relative w-full">
            <span class="in-action-icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 inline-flex size-4 [&>svg]:size-4 text-fg-muted group-focus-within:text-fg" aria-hidden="true">${defaultSvg}</span>
            <input type="text" placeholder="Search..." aria-label="Example search input" class="h-10 w-full box-border pl-9 pr-12 bg-main border border-border hover:border-border-hover focus:border-border-hover rounded-md text-base md:text-sm text-fg placeholder:text-fg-muted focus:outline-none">
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-sm border border-border px-1.5 py-0.5 text-[10px] leading-none text-fg-muted" aria-hidden="true">\u2318K</span>
          </div>
        </div>
        <div class="rounded-lg border border-border bg-secondary/70 p-6 flex flex-col justify-center gap-1 min-h-32 sm:col-span-2 lg:col-span-1" aria-hidden="true">
          <div class="flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-main border border-border text-sm text-fg cursor-pointer hover:bg-secondary/60 dark:bg-secondary">
            ${iconSpan}
            <span class="flex-1 min-w-0 truncate">List item</span>
            ${chevron}
          </div>
        </div>
      </div>`;
}

export async function generateIconPages(meta, icons, shared) {
  const { themeIcons, logoIcon, downloadIcon, menuIcon } = shared;
  await mkdir(join(DIST, 'icons'), { recursive: true });

  const chevronSvg = icons.find((i) => i.name === 'chevron-right')?.svgs['line-regular'] || '';
  const copySvg = icons.find((i) => i.name === 'copy')?.svgs['line-regular'] || '';

  for (const icon of icons) {
    const name = icon.name;
    const display = iconDisplayName(name);
    const pascalName = name.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    const title = `${display} Icon - UI/UX Icons`;
    const tagText = icon.tags.slice(0, 6).join(', ');
    const description = `Free ${display} icon in 3 styles (line, duotone, solid) and 3 weights. Copy the SVG or use it via React, Vue, icon font, or CDN. Tags: ${tagText}. MIT licensed.`;
    const related = relatedIcons(icon, icons);
    const snippets = iconSnippets(icon, pascalName, 'line', 'regular');
    const snippetVariants = iconSnippetVariants(icon, pascalName, meta.styles, meta.weights);
    const defaultSvg = icon.svgs['line-regular'] || '';
    const categoryLabel = icon.category.charAt(0).toUpperCase() + icon.category.slice(1);

    const bodyHtml = `  ${sharedHeader('icons', meta.total, themeIcons, logoIcon, downloadIcon, menuIcon)}

  <main class="max-w-7xl mx-auto px-3 py-6">
    <nav aria-label="Breadcrumb" class="mb-6 text-sm">
      <ol class="flex items-center gap-1 -ml-2 min-w-0">
        <li class="shrink-0"><a href="/" class="inline-flex items-center px-2 py-1 rounded-md text-fg-secondary hover:text-fg hover:bg-secondary">All</a></li>
        <li class="inline-flex size-3.5 shrink-0 [&>svg]:size-3.5 text-fg-muted" aria-hidden="true">${chevronSvg}</li>
        <li class="shrink-0"><a href="/?category=${icon.category}" class="inline-flex items-center px-2 py-1 rounded-md text-fg-secondary hover:text-fg hover:bg-secondary">${escapeHtmlText(categoryLabel)}</a></li>
        <li class="inline-flex size-3.5 shrink-0 [&>svg]:size-3.5 text-fg-muted" aria-hidden="true">${chevronSvg}</li>
        <li class="min-w-0"><button type="button" id="copy-name-btn" aria-current="page" aria-label="Copy icon name" title="Copy icon name" class="inline-flex max-w-full items-center px-2 py-1 rounded-md bg-secondary hover:bg-tertiary text-fg font-mono cursor-pointer"><span class="truncate">${escapeHtmlText(name)}</span></button></li>
      </ol>
    </nav>

    <div class="flex flex-col md:flex-row gap-6">
      <div class="shrink-0">
        <div class="relative size-48 sm:size-64 rounded-lg border border-border bg-secondary/70">
          <div id="icon-preview" class="flex size-full items-center justify-center text-fg [&_svg]:size-20 sm:[&_svg]:size-28">
            <div class="icon-svg" aria-hidden="true">${defaultSvg}</div>
          </div>
          <div class="absolute inset-x-0 bottom-0 flex justify-center gap-3 p-3">
            <button type="button" id="copy-svg-btn" aria-label="Copy SVG" class="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md border border-border bg-main text-fg w-full justify-center hover:bg-tertiary cursor-pointer dark:bg-secondary">Copy</button>
            <a id="download-svg-link" href="/uiuxicons/line-regular/${name}.svg" download="${name}.svg" aria-label="Download SVG" class="inline-flex items-center px-2.5 py-1.5 text-xs rounded-md border border-border bg-main text-fg w-full justify-center hover:bg-tertiary dark:bg-secondary">Download</a>
          </div>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-bold leading-tight">${escapeHtmlText(display)} Icon</h1>
        <p class="mt-1.5 text-sm text-fg-muted">${escapeHtmlText(icon.tags.join(' \u00b7 '))}</p>
        <p class="mt-1.5 text-sm text-fg-secondary">Category: <a href="/?category=${icon.category}" class="text-fg hover:underline">${escapeHtmlText(categoryLabel)}</a></p>

        <div class="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 md:hidden">
          <select id="style-select" aria-label="Style" class="toolbar-select h-10 min-w-0 w-full box-border text-sm leading-normal rounded-md bg-secondary border border-border hover:border-border-hover focus:border-border-hover text-fg focus:outline-none cursor-pointer">
            ${meta.styles.map((s, i) => `<option value="${s}"${i === 0 ? ' selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('\n            ')}
          </select>
          <select id="weight-select" aria-label="Weight" class="toolbar-select h-10 min-w-0 w-full box-border text-sm leading-normal rounded-md bg-secondary border border-border hover:border-border-hover focus:border-border-hover text-fg focus:outline-none cursor-pointer">
            ${meta.weights.map((w) => `<option value="${w}"${w === 'regular' ? ' selected' : ''}>${w.charAt(0).toUpperCase() + w.slice(1)}</option>`).join('\n            ')}
          </select>
          <input type="color" aria-label="Icon color" class="icon-color-picker size-10 shrink-0 rounded-md cursor-pointer bg-transparent border-0">
        </div>

        <div class="mt-5 hidden md:flex flex-wrap items-center gap-2">
          <div class="border border-border flex gap-1 bg-secondary p-0.75 rounded-md">
            ${meta.styles.map((s, i) => `
            <button type="button" data-style-btn="${s}" class="style-btn px-3 py-1.5 text-sm rounded-sm cursor-pointer ${i === 0 ? 'bg-active text-main hover:text-main' : 'text-fg-secondary hover:text-fg'}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`).join('')}
          </div>
          <div class="border border-border flex gap-1 bg-secondary p-0.75 rounded-md">
            ${meta.weights.map((w) => `
            <button type="button" data-weight-btn="${w}" class="weight-btn px-3 py-1.5 text-sm rounded-sm cursor-pointer ${w === 'regular' ? 'bg-active text-main hover:text-main' : 'text-fg-secondary hover:text-fg'}">${w.charAt(0).toUpperCase() + w.slice(1)}</button>`).join('')}
          </div>
          <input type="color" aria-label="Icon color" class="icon-color-picker size-10 shrink-0 rounded-md cursor-pointer bg-transparent border-0">
        </div>
      </div>
    </div>

    <section class="mt-12 icon-snippets">
      <h2 class="text-lg font-semibold mb-3">Use this icon</h2>
      <div class="docs-pkg-tabs" data-icon-snippets>
        <div class="docs-pkg-tabs-bar" role="tablist">
          ${snippets.map((s, i) => `<button role="tab" data-snippet="${s.id}" aria-selected="${i === 0 ? 'true' : 'false'}">${s.label}</button>`).join('\n          ')}
        </div>
        <div class="docs-pkg-tabs-panels relative">
          ${snippets.map((s, i) => `<pre data-snippet="${s.id}"${i === 0 ? '' : ' hidden'}><code class="hljs">${s.code}</code></pre>`).join('\n          ')}
          <button type="button" id="copy-snippet-btn" aria-label="Copy code" class="snippet-copy-btn absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md border border-border bg-main hover:bg-tertiary text-fg-secondary hover:text-fg cursor-pointer dark:bg-secondary">${copySvg ? `<span class="inline-flex size-4 shrink-0 [&>svg]:size-4" aria-hidden="true">${copySvg}</span>` : 'Copy'}</button>
        </div>
      </div>
    </section>

    <section class="mt-12">
      <h2 class="text-lg font-semibold mb-3">In action</h2>
${iconInActionHtml(defaultSvg, chevronSvg)}
    </section>

    ${related.length ? `<section class="mt-12">
      <h2 class="text-lg font-semibold mb-3">Related icons</h2>
      <div id="related-icons" class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3 text-fg">
        ${related.map((r) =>
          `<div class="icon-item" data-name="${escapeHtmlAttr(r.name)}">` +
          `<div class="icon-svg" aria-hidden="true">${r.svgs['line-regular'] || ''}</div>` +
          `<span class="icon-name">${escapeHtmlText(r.name)}</span>` +
          `<div class="icon-actions"><a href="/icons/${r.name}" class="icon-action">View</a></div></div>`
        ).join('\n        ')}
      </div>
    </section>` : ''}
  </main>

  <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 px-3 py-2 bg-tertiary text-sm rounded-md hidden"></div>
`;

    const scriptInner = `${simplePageScripts}
    ${iconTileRuntime}
    ${copyTextRuntime}
    ${toastRuntime}

    // Style/weight switcher (icon page: updates preview, In action mocks,
    // download link, usage snippets, and related icons; selection is shared
    // with the homepage via localStorage)
    (function () {
      const styleBtns = document.querySelectorAll('[data-style-btn]');
      const weightBtns = document.querySelectorAll('[data-weight-btn]');
      const styleSelect = document.getElementById('style-select');
      const weightSelect = document.getElementById('weight-select');
      const downloadLink = document.getElementById('download-svg-link');
      const previewHolder = document.querySelector('#icon-preview .icon-svg');
      const inActionIcons = document.querySelectorAll('.in-action-icon');
      const snippetPanels = document.querySelectorAll('[data-icon-snippets] pre[data-snippet] code');
      const snippetVariants = ${JSON.stringify(snippetVariants)};
      const iconName = ${JSON.stringify(name)};
      let currentStyle = 'line';
      let currentWeight = 'regular';

      // Restore the variant picked on the homepage (or a previous icon page)
      try {
        const s = localStorage.getItem('uiuxicons-style');
        const w = localStorage.getItem('uiuxicons-weight');
        if (s && [...styleBtns].some((b) => b.dataset.styleBtn === s)) currentStyle = s;
        if (w && [...weightBtns].some((b) => b.dataset.weightBtn === w)) currentWeight = w;
      } catch (_) {}

      function currentVariant() {
        return currentStyle + '-' + currentWeight;
      }

      function setActive(entries) {
        entries.forEach(({ btn, active }) => {
          btn.classList.toggle('bg-active', active);
          btn.classList.toggle('text-main', active);
          btn.classList.toggle('hover:text-main', active);
          btn.classList.toggle('text-fg-secondary', !active);
          btn.classList.toggle('hover:text-fg', !active);
        });
      }

      function syncControls() {
        setActive([...styleBtns].map((btn) => ({ btn, active: btn.dataset.styleBtn === currentStyle })));
        setActive([...weightBtns].map((btn) => ({ btn, active: btn.dataset.weightBtn === currentWeight })));
        if (styleSelect) styleSelect.value = currentStyle;
        if (weightSelect) weightSelect.value = currentWeight;
      }

      function update() {
        const variant = currentVariant();
        syncControls();
        // One fetch covers the hero preview and every In action mock
        uiuxVariantSvg(variant, iconName)
          .then((svg) => {
            if (currentVariant() !== variant) return; // stale switch
            if (previewHolder) previewHolder.innerHTML = svg;
            inActionIcons.forEach((el) => { el.innerHTML = svg; });
          })
          .catch(() => {});
        if (downloadLink) {
          downloadLink.href = '/uiuxicons/' + variant + '/' + iconName + '.svg';
          downloadLink.setAttribute('download', iconName + '-' + variant + '.svg');
        }
        const variantSnippets = snippetVariants[variant];
        if (variantSnippets) {
          snippetPanels.forEach((code) => {
            const html = variantSnippets[code.parentElement.dataset.snippet];
            if (html != null) code.innerHTML = html;
          });
        }
        uiuxUpdateTiles('#related-icons', variant, (v) => v === currentVariant());
        try {
          localStorage.setItem('uiuxicons-style', currentStyle);
          localStorage.setItem('uiuxicons-weight', currentWeight);
        } catch (_) {}
      }

      styleBtns.forEach((btn) => btn.addEventListener('click', () => { currentStyle = btn.dataset.styleBtn; update(); }));
      weightBtns.forEach((btn) => btn.addEventListener('click', () => { currentWeight = btn.dataset.weightBtn; update(); }));
      styleSelect?.addEventListener('change', () => { currentStyle = styleSelect.value; update(); });
      weightSelect?.addEventListener('change', () => { currentWeight = weightSelect.value; update(); });

      // Related tiles behave exactly like the homepage grid (Copy/View)
      uiuxInitIconTiles('#related-icons', {
        getVariant: currentVariant,
        copyText,
        onCopy: (ok) => showToast(ok ? 'Copied SVG' : 'Could not copy - use HTTPS'),
      });
      // Seed the cache from the inlined default so switching back is instant
      if (previewHolder) uiuxSeedVariant('line-regular', iconName, previewHolder.innerHTML);

      // Apply a restored non-default variant on load
      if (currentStyle !== 'line' || currentWeight !== 'regular') update();
    })();

    // Icon color picker (shared with the homepage via localStorage.userColor;
    // colors the hero preview and related icons, defaults follow the theme)
    (function () {
      const pickers = document.querySelectorAll('.icon-color-picker');
      const preview = document.getElementById('icon-preview');
      const relatedGrid = document.getElementById('related-icons');
      if (!pickers.length) return;

      function applyColor() {
        const isLight = document.documentElement.classList.contains('light');
        const color = localStorage.userColor || (isLight ? '#000000' : '#ffffff');
        pickers.forEach((p) => { p.value = color; });
        if (preview) preview.style.color = color;
        if (relatedGrid) relatedGrid.style.color = color;
      }
      applyColor();

      pickers.forEach((picker) => picker.addEventListener('input', (e) => {
        try { localStorage.userColor = e.target.value; } catch (_) {}
        applyColor();
      }));

      // The shared theme toggle script flips the theme class; re-derive the
      // default color after it runs so an unset color follows the theme.
      document.getElementById('theme-toggle')?.addEventListener('click', applyColor);
    })();

    // Copy actions + snippet tabs
    (function () {
      document.getElementById('copy-svg-btn')?.addEventListener('click', () => {
        const svg = document.querySelector('#icon-preview .icon-svg svg');
        if (!svg) return;
        copyText(svg.outerHTML).then((ok) => showToast(ok ? 'Copied SVG' : 'Could not copy - use HTTPS'));
      });

      document.getElementById('copy-name-btn')?.addEventListener('click', () => {
        copyText(${JSON.stringify(name)}).then((ok) => showToast(ok ? 'Copied name' : 'Could not copy - use HTTPS'));
      });

      // Snippet tabs + copy
      const tabs = document.querySelectorAll('[data-icon-snippets] [role="tab"]');
      const panels = document.querySelectorAll('[data-icon-snippets] pre[data-snippet]');
      const KEY = 'uiuxicons-snippet';
      function activate(id) {
        let found = false;
        panels.forEach((p) => { if (p.dataset.snippet === id) found = true; });
        if (!found) return;
        tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.snippet === id ? 'true' : 'false'));
        panels.forEach((p) => { p.hidden = p.dataset.snippet !== id; });
        try { localStorage.setItem(KEY, id); } catch (_) {}
      }
      tabs.forEach((t) => t.addEventListener('click', () => activate(t.dataset.snippet)));
      try {
        const saved = localStorage.getItem(KEY);
        if (saved) activate(saved);
      } catch (_) {}

      document.getElementById('copy-snippet-btn')?.addEventListener('click', () => {
        const visible = [...panels].find((p) => !p.hidden);
        if (!visible) return;
        copyText(visible.textContent.trim()).then((ok) => showToast(ok ? 'Copied' : 'Could not copy - use HTTPS'));
      });
    })();
`;

    const html = layoutSitePage({
      headOptions: {
        title,
        description,
        pageFile: `icons/${name}.html`,
        image: `/og/icon-${name}.png`,
        imageAlt: `${display} icon - UI/UX Icons`,
        extraAfterTheme: `
  <style>
    ${DOCS_HIGHLIGHT_CSS}
  </style>${iconPageJsonLd(icon, display, description)}`,
      },
      bodyHtml,
      scriptInner,
    });

    await writeFile(join(DIST, 'icons', `${name}.html`), html);
  }

  console.log(`  Generated ${icons.length} icon pages (icons/{name}.html)`);
}
