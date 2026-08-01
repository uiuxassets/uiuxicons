/**
 * Homepage: searchable, filterable icon grid with style/weight/size/color
 * controls. Only the line-regular variant is inlined; other variants are
 * fetched on demand by the icon tile runtime.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { DIST, getSiteOrigin, escapeHtmlAttr, escapeHtmlText } from '../common.js';
import { layoutSitePage, sharedHeader, categoryNavInnerHtml, CLOSE_ICON_SVG } from '../templates.js';
import {
  focusTrapRuntime,
  iconTileRuntime,
  copyTextRuntime,
  toastRuntime,
  mobileNavScript,
  categoriesDrawerScript,
  sidebarScrollFadeScript,
} from '../../site-snippets.js';

export async function generateIndex(meta, icons, shared) {
  const { themeIcons, logoIcon, downloadIcon, menuIcon, listIcon, resetIcon } = shared;

  const indexTitle = 'UI/UX Icons - Free Icon Library';
  const indexDescription = `A clean, consistent icon library for modern interfaces. ${meta.total} icons in 3 styles and 3 weights. Free and open source.`;

  const origin = getSiteOrigin();
  const websiteJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UI/UX Icons',
    url: `${origin}/`,
    description: indexDescription,
  }).replace(/</g, '\\u003c');

  const html = layoutSitePage({
    headOptions: {
      title: indexTitle,
      description: indexDescription,
      pageFile: 'index.html',
      extraAfterTheme: `
  <script type="application/ld+json">${websiteJsonLd}</script>`,
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
            aria-label="Search icons"
            class="h-10 w-full box-border px-3 bg-secondary border border-border hover:border-border-hover focus:border-border-hover rounded-md text-base md:text-sm leading-normal focus:outline-none placeholder:text-fg-muted"
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
      
      <div class="border border-border hidden md:flex gap-1 bg-secondary p-0.75 rounded-md">
        ${meta.styles.map((s, i) => `
          <button 
            data-style-btn="${s}" 
            type="button"
            class="style-btn px-3 py-1.5 text-sm rounded-sm cursor-pointer ${i === 0 ? 'bg-active text-main hover:text-main' : 'text-fg-secondary hover:text-fg'}"
          >${s.charAt(0).toUpperCase() + s.slice(1)}</button>
        `).join('')}
      </div>
      
      <div class="border border-border hidden md:flex gap-1 bg-secondary p-0.75 rounded-md">
        ${meta.weights.map((w) => `
          <button 
            data-weight-btn="${w}" 
            type="button"
            class="weight-btn px-3 py-1.5 text-sm rounded-sm cursor-pointer ${w === 'regular' ? 'bg-active text-main hover:text-main' : 'text-fg-secondary hover:text-fg'}"
          >${w.charAt(0).toUpperCase() + w.slice(1)}</button>
        `).join('')}
      </div>
      
      <div class="flex w-full min-w-0 flex-wrap items-center gap-3 md:flex-1 md:min-w-[12rem]">
        <div class="flex min-h-10 min-w-0 flex-1 items-center gap-3">
          <input type="range" id="size" min="12" max="96" value="24" step="4" class="min-w-0 flex-1 h-1.5 bg-tertiary rounded-md appearance-none cursor-pointer">
          <span id="size-label" class="w-8 shrink-0 text-xs text-fg tabular-nums">24px</span>
        </div>
        <input type="color" id="color" class="size-10 shrink-0 rounded-md cursor-pointer bg-transparent border-0">
        <button type="button" id="reset-btn" class="inline-flex size-10 shrink-0 items-center justify-center rounded-md cursor-pointer bg-main border border-border text-fg hover:bg-tertiary dark:bg-secondary" title="Reset to defaults">
          <span class="inline-flex size-5 shrink-0 [&>svg]:size-5" aria-hidden="true">${resetIcon}</span>
        </button>
      </div>
    </div>
  </div>

  <div id="categories-drawer" class="fixed inset-0 z-[35] md:hidden hidden" role="dialog" aria-modal="true" aria-label="Icon categories">
    <div id="categories-drawer-backdrop" class="absolute inset-0 bg-black/60" aria-hidden="true"></div>
    <div id="categories-drawer-panel" class="absolute inset-0 w-full h-full bg-main flex flex-col overflow-y-auto shadow-xl">
      <div class="flex items-center justify-between gap-3 p-3 border-b border-border shrink-0">
        <a href="/" class="inline-flex shrink-0" title="UI/UX Icons">
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
      <div class="sidebar-scroll no-scrollbar sticky top-[var(--site-icons-sidebar-sticky-top)] max-h-[calc(100dvh-var(--site-icons-sidebar-sticky-top))] overflow-y-auto">
        <nav class="space-y-1">
          ${categoryNavInnerHtml(meta, icons)}
        </nav>
      </div>
    </aside>

    <!-- Icons Grid -->
    <main class="flex-1">
      <h1 class="sr-only">${escapeHtmlAttr(indexTitle)}</h1>
      <div id="icons" class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
        ${icons.map(icon =>
          `<div class="icon-item" data-name="${escapeHtmlAttr(icon.name)}" data-category="${escapeHtmlAttr(icon.category)}" data-tags="${escapeHtmlAttr(icon.tags.join(' '))}">` +
          `<div class="icon-svg" aria-hidden="true">${icon.svgs['line-regular'] || ''}</div>` +
          `<span class="icon-name">${escapeHtmlText(icon.name)}</span>` +
          // Copy button is added by JS at load (interactive-only); the View
          // anchor stays static as the crawl path to every icon page.
          `<div class="icon-actions"><a href="/icons/${icon.name}" class="icon-action">View</a></div></div>`
        ).join('\n        ')}
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
    ${iconTileRuntime}
    ${copyTextRuntime}
    ${toastRuntime}

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
      uiuxUpdateTiles('#icons', currentStyle + '-' + currentWeight, (v) => v === currentStyle + '-' + currentWeight);
    }

    function syncStyleControls() {
      if (styleSelect) styleSelect.value = currentStyle;
      styleBtns.forEach(b => {
        const active = b.dataset.styleBtn === currentStyle;
        b.classList.toggle('bg-active', active);
        b.classList.toggle('text-main', active);
        b.classList.toggle('hover:text-main', active);
        b.classList.toggle('text-fg-secondary', !active);
        b.classList.toggle('hover:text-fg', !active);
      });
    }

    function syncWeightControls() {
      if (weightSelect) weightSelect.value = currentWeight;
      weightBtns.forEach(b => {
        const active = b.dataset.weightBtn === currentWeight;
        b.classList.toggle('bg-active', active);
        b.classList.toggle('text-main', active);
        b.classList.toggle('hover:text-main', active);
        b.classList.toggle('text-fg-secondary', !active);
        b.classList.toggle('hover:text-fg', !active);
      });
    }

    // Style/weight selection is shared with the icon detail pages so the
    // chosen variant follows the user when they open an icon.
    function saveVariantPrefs() {
      try {
        localStorage.setItem('uiuxicons-style', currentStyle);
        localStorage.setItem('uiuxicons-weight', currentWeight);
      } catch (_) {}
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
      try {
        localStorage.removeItem('uiuxicons-style');
        localStorage.removeItem('uiuxicons-weight');
      } catch (_) {}
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
      syncUrl();

      showToast('Reset to defaults');
    });

    // Search
    search.addEventListener('input', () => {
      filter();
      syncUrl();
    });

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
        saveVariantPrefs();
        syncUrl();
      });
    });

    weightBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentWeight = btn.dataset.weightBtn;
        syncWeightControls();
        updateVariant();
        saveVariantPrefs();
        syncUrl();
      });
    });

    styleSelect?.addEventListener('change', () => {
      currentStyle = styleSelect.value;
      syncStyleControls();
      updateVariant();
      saveVariantPrefs();
      syncUrl();
    });

    weightSelect?.addEventListener('change', () => {
      currentWeight = weightSelect.value;
      syncWeightControls();
      updateVariant();
      saveVariantPrefs();
      syncUrl();
    });

    // Keep the URL shareable: reflect search, category, style, and weight as
    // query params, omitting defaults so the bare / stays clean.
    function syncUrl() {
      const params = new URLSearchParams();
      const q = search.value.trim();
      if (q) params.set('q', q);
      if (currentCategory !== 'all') params.set('category', currentCategory);
      if (currentStyle !== 'line') params.set('style', currentStyle);
      if (currentWeight !== 'regular') params.set('weight', currentWeight);
      const qs = params.toString();
      history.replaceState(null, '', qs ? location.pathname + '?' + qs : location.pathname);
    }

    // Category filter (buttons exist twice: mobile drawer + desktop sidebar,
    // so highlight by category value, not by button identity)
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.category;
        categoryBtns.forEach(b => {
          const active = b.dataset.category === currentCategory;
          b.classList.toggle('bg-tertiary', active);
          b.classList.toggle('text-fg', active);
          b.classList.toggle('text-fg-secondary', !active);
        });
        filter();
        updateCategoryLabels();
        syncUrl();
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

    ${sidebarScrollFadeScript}

    ${mobileNavScript}

    // Ranked search. Every query word must match the icon (name or tags);
    // matches are ordered by how well they match using the grid \`order\`
    // property, so \`plus\` ranks the plus icon above clipboard-plus.
    const searchIndex = [...iconItems].map((el) => {
      const name = el.dataset.name;
      return {
        el,
        name,
        parts: name.split('-'),
        tags: el.dataset.tags.split(' ').filter(Boolean),
        category: el.dataset.category,
      };
    });

    // Hyphens, underscores, and spaces are interchangeable: "arrow up",
    // "arrow-up", and "arrow_up" all find arrow-up.
    function normalizeQuery(s) {
      return s.toLowerCase().trim().replace(/[\\s_]+/g, '-');
    }

    function scoreWord(word, entry) {
      if (entry.name === word) return 100;
      if (entry.parts.indexOf(word) !== -1) return 80;      // whole word in name
      if (entry.name.startsWith(word)) return 70;
      if (entry.parts.some((p) => p.startsWith(word))) return 60;
      if (entry.tags.indexOf(word) !== -1) return 50;        // exact tag
      if (entry.tags.some((t) => t.startsWith(word))) return 40;
      if (entry.name.includes(word)) return 30;
      if (entry.tags.some((t) => t.includes(word))) return 20;
      return 0;
    }

    function scoreIcon(q, words, entry) {
      let total = 0;
      for (const word of words) {
        const s = scoreWord(word, entry);
        if (!s) return 0; // every word must match somewhere
        total += s;
      }
      if (entry.name === q) total += 200; // exact full-name match wins
      return total;
    }

    // Filter icons
    function filter() {
      const q = normalizeQuery(search.value);
      const words = q ? q.split('-').filter(Boolean) : [];
      let visible = 0;
      searchIndex.forEach((entry) => {
        const matchesCategory = currentCategory === 'all' || entry.category === currentCategory;
        const score = matchesCategory && words.length ? scoreIcon(q, words, entry) : 0;
        const show = matchesCategory && (!words.length || score > 0);
        entry.el.classList.toggle('hidden', !show);
        // Ties keep DOM (alphabetical) order; no query clears the ordering
        entry.el.style.order = show && words.length ? String(-score) : '';
        if (show) visible++;
      });
      noResults.classList.toggle('hidden', visible > 0);
      // Newly revealed tiles may still show a previously selected variant
      updateVariant();
    }

    // Restore state from the URL and localStorage. URL params win over saved
    // preferences so shared links show exactly what the sender saw; unknown
    // values are ignored and the defaults stay. Must run after searchIndex
    // and filter() above exist, since restoring triggers a filter pass.
    (function () {
      const params = new URLSearchParams(location.search);

      // Search query (?q=)
      const q = params.get('q');
      if (q) {
        search.value = q;
        filter();
      }

      // Category (?category=, links on icon detail pages). click() runs the
      // full selection flow: highlight, filter, labels, URL sync.
      const cat = params.get('category');
      if (cat && cat !== 'all') {
        const target = [...categoryBtns].find((b) => b.dataset.category === cat);
        if (target) target.click();
      }

      // Style/weight: URL params first, then the preference saved by the
      // homepage or an icon detail page.
      try {
        const s = localStorage.getItem('uiuxicons-style');
        const w = localStorage.getItem('uiuxicons-weight');
        if (s && [...styleBtns].some((b) => b.dataset.styleBtn === s)) currentStyle = s;
        if (w && [...weightBtns].some((b) => b.dataset.weightBtn === w)) currentWeight = w;
      } catch (_) {}
      const ps = params.get('style');
      const pw = params.get('weight');
      if (ps && [...styleBtns].some((b) => b.dataset.styleBtn === ps)) currentStyle = ps;
      if (pw && [...weightBtns].some((b) => b.dataset.weightBtn === pw)) currentWeight = pw;
      if (currentStyle !== 'line' || currentWeight !== 'regular') {
        syncStyleControls();
        syncWeightControls();
        updateVariant();
        saveVariantPrefs();
        syncUrl();
      }
    })();

    uiuxInitIconTiles('#icons', {
      getVariant: () => currentStyle + '-' + currentWeight,
      copyText,
      onCopy: (ok) => showToast(ok ? 'Copied SVG' : 'Could not copy - try selecting the icon or use HTTPS'),
    });
`,
  });

  await writeFile(join(DIST, 'index.html'), html);
  console.log('  Generated index.html');
}
