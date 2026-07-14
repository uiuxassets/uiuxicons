/**
 * Inline browser script strings embedded into generated HTML by scripts/site.js.
 */

/** Blocking head script: saved preference, else prefers-color-scheme. */
export const headThemeInitScript = `<script>(function(){try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.classList.add("light");else if(t!=="dark"&&window.matchMedia("(prefers-color-scheme: light)").matches)document.documentElement.classList.add("light");}catch(e){}})();</script>`;

/** Defines window.uiuxStartFocusTrap(panel) → stop function; restores focus on stop. */
export const focusTrapRuntime = `(function(){function q(p){return[].slice.call(p.querySelectorAll("a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex=\\"-1\\"])")).filter(function(el){return el.offsetWidth>0||el.offsetHeight>0||el.getClientRects().length>0;});}window.uiuxStartFocusTrap=function(panel){var prev=document.activeElement;if(!panel.hasAttribute("tabindex"))panel.setAttribute("tabindex","-1");panel.style.outline="none";panel.focus();function onKey(e){if(e.key!=="Tab")return;var list=q(panel);if(!list.length)return;var a=list[0],b=list[list.length-1],act=document.activeElement;if(e.shiftKey){if(act===a||act===panel){e.preventDefault();b.focus();}}else if(act===b){e.preventDefault();a.focus();}}panel.addEventListener("keydown",onKey);return function(){panel.removeEventListener("keydown",onKey);if(prev&&typeof prev.focus==="function")prev.focus();}};})();`;

/**
 * Icon tile runtime shared by the homepage grid and the related-icons grid on
 * icon detail pages. Only the line-regular variant is inlined in the HTML;
 * other variants are fetched on demand (same-origin static SVGs) and cached.
 *
 * Defines:
 * - window.uiuxVariantSvg(variant, name) → Promise<svg markup>
 * - window.uiuxUpdateTiles(rootSel, variant, isCurrent) → swap visible .icon-svg holders
 * - window.uiuxInitIconTiles(rootSel, opts) → seed cache, inject Copy button, wire click-to-copy
 *   opts: { getVariant, copyText, onCopy }
 */
export const iconTileRuntime = `
  (function () {
    const cache = new Map();

    function fetchVariantSvg(variant, name) {
      const key = variant + '/' + name;
      if (cache.has(key)) return Promise.resolve(cache.get(key));
      return fetch('/uiuxicons/' + variant + '/' + name + '.svg')
        .then((r) => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then((text) => {
          if (!text.trimStart().startsWith('<svg')) throw new Error('unexpected content');
          cache.set(key, text);
          return text;
        });
    }
    window.uiuxVariantSvg = fetchVariantSvg;

    // Seed the cache from markup already inlined in the HTML
    window.uiuxSeedVariant = function (variant, name, svg) {
      cache.set(variant + '/' + name, svg);
    };

    window.uiuxUpdateTiles = function (rootSel, variant, isCurrent) {
      document.querySelectorAll(rootSel + ' .icon-item').forEach((tile) => {
        if (tile.classList.contains('hidden')) return; // updated when they become visible
        const holder = tile.querySelector('.icon-svg');
        if (!holder || (holder.dataset.shownVariant || 'line-regular') === variant) return;
        fetchVariantSvg(variant, tile.dataset.name)
          .then((svg) => {
            if (isCurrent && !isCurrent(variant)) return; // stale switch
            holder.innerHTML = svg;
            holder.dataset.shownVariant = variant;
          })
          .catch(() => {});
      });
    };

    window.uiuxInitIconTiles = function (rootSel, opts) {
      document.querySelectorAll(rootSel + ' .icon-item').forEach((tile) => {
        const holder = tile.querySelector('.icon-svg');
        if (holder) cache.set('line-regular/' + tile.dataset.name, holder.innerHTML);
        // The Copy button only works with JS, so it is injected here instead
        // of being shipped as static HTML for every tile (saves ~30 KB on the
        // index). The View anchor stays static as the crawl path.
        const actions = tile.querySelector('.icon-actions');
        if (actions) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'icon-action';
          btn.textContent = 'Copy';
          btn.setAttribute('aria-label', 'Copy ' + tile.dataset.name + ' SVG');
          actions.insertBefore(btn, actions.firstChild);
          actions.querySelector('a')?.setAttribute('aria-label', 'View ' + tile.dataset.name + ' icon details');
        }
        tile.addEventListener('click', (e) => {
          // The View link navigates; everything else on the tile copies.
          if (e.target.closest('a')) return;
          fetchVariantSvg(opts.getVariant(), tile.dataset.name)
            .then((svg) => opts.copyText(svg))
            .then((ok) => opts.onCopy(ok))
            .catch(() => opts.onCopy(false));
        });
      });
    };
  })();
`;

/** Clipboard copy with execCommand fallback for non-secure contexts.
 *  Resolves true/false; never rejects. Shared by the homepage and icon pages. */
export const copyTextRuntime = `
    function copyText(text) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text).then(() => true, () => false);
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
`;

/** Bottom-center toast; expects the #toast element in the page body. */
export const toastRuntime = `
    const toastEl = document.getElementById('toast');
    function showToast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.remove('hidden');
      toastEl.classList.add('toast');
      setTimeout(() => {
        toastEl.classList.add('hidden');
        toastEl.classList.remove('toast');
      }, 2000);
    }
`;

/** Theme toggle for pages without the index color picker (docs, examples, changelog). */
export const themeToggleBodyScript = `
  const themeToggle = document.getElementById('theme-toggle');
  const themeIconDark = document.getElementById('theme-icon-dark');
  const themeIconLight = document.getElementById('theme-icon-light');
  if (themeToggle && themeIconDark && themeIconLight) {
    function updateThemeIcons() {
      const isLight = document.documentElement.classList.contains('light');
      themeIconDark.classList.toggle('hidden', isLight);
      themeIconDark.classList.toggle('inline-flex', !isLight);
      themeIconLight.classList.toggle('hidden', !isLight);
      themeIconLight.classList.toggle('inline-flex', isLight);
    }
    updateThemeIcons();
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('light');
      localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
      updateThemeIcons();
    });
  }
`;

/** Identity of each full-screen overlay (mobile nav + drawers) so any one of
 *  them can close the others when it opens. */
const OVERLAYS = {
  mobileNav: {
    rootId: 'mobile-nav',
    toggleId: 'mobile-nav-toggle',
    releaseName: 'uiuxReleaseMobileNavFocusTrap',
  },
  categories: {
    rootId: 'categories-drawer',
    toggleId: 'categories-toggle',
    releaseName: 'uiuxReleaseCategoriesFocusTrap',
  },
  docs: {
    rootId: 'docs-drawer',
    toggleId: 'docs-nav-toggle',
    releaseName: 'uiuxReleaseDocsFocusTrap',
  },
};

/**
 * Emits the open/close/focus-trap runtime for one full-screen overlay.
 * All three overlays (mobile nav, categories drawer, docs drawer) share this
 * behavior; only ids, sibling overlays, and a few extras differ.
 *
 * @param {object} overlay - entry from OVERLAYS (rootId, toggleId, releaseName)
 * @param {object} opts
 * @param {string} opts.closeId - id of the close button inside the panel
 * @param {object[]} [opts.siblings] - OVERLAYS entries force-closed when this one opens
 * @param {boolean} [opts.guardOverflowOnClose] - drawers only restore body scroll
 *   when the mobile nav is not open underneath; the mobile nav restores it always
 * @param {string} [opts.extraCloseSelector] - extra elements inside the overlay
 *   that close it on click (footer link, in-page anchors)
 */
function drawerScript(overlay, { closeId, siblings = [], guardOverflowOnClose = false, extraCloseSelector = '' }) {
  const { rootId, toggleId, releaseName } = overlay;
  const closeSiblings = siblings
    .map(
      (s) => `
        if (window.${s.releaseName}) window.${s.releaseName}();
        closeOverlay('${s.rootId}', '${s.toggleId}');`
    )
    .join('');
  const restoreOverflow = guardOverflowOnClose
    ? `if (document.getElementById('${OVERLAYS.mobileNav.rootId}')?.classList.contains('hidden')) {
          document.body.style.overflow = '';
        }`
    : `document.body.style.overflow = '';`;
  const extraCloseWiring = extraCloseSelector
    ? `
    root.querySelectorAll('${extraCloseSelector}').forEach((el) => el.addEventListener('click', () => setOpen(false)));`
    : '';
  return `
  (function () {
    const root = document.getElementById('${rootId}');
    const toggle = document.getElementById('${toggleId}');
    if (!root || !toggle) return;
    const backdrop = document.getElementById('${rootId}-backdrop');
    const panel = document.getElementById('${rootId}-panel');
    let trapStop = null;

    window.${releaseName} = function () {
      if (trapStop) {
        trapStop();
        trapStop = null;
      }
    };

    function closeOverlay(rootId, toggleId) {
      const el = document.getElementById(rootId);
      const tg = document.getElementById(toggleId);
      if (el && !el.classList.contains('hidden')) {
        el.classList.add('hidden');
        if (tg) tg.setAttribute('aria-expanded', 'false');
      }
    }

    function setOpen(open) {
      root.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {${closeSiblings}
        document.body.style.overflow = 'hidden';
        window.${releaseName}();
        trapStop = panel && window.uiuxStartFocusTrap ? window.uiuxStartFocusTrap(panel) : null;
      } else {
        window.${releaseName}();
        ${restoreOverflow}
      }
    }

    toggle.addEventListener('click', () => setOpen(root.classList.contains('hidden')));
    backdrop?.addEventListener('click', () => setOpen(false));
    document.getElementById('${closeId}')?.addEventListener('click', () => setOpen(false));${extraCloseWiring}
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !root.classList.contains('hidden')) setOpen(false);
    });
  })();
`;
}

export const mobileNavScript = drawerScript(OVERLAYS.mobileNav, {
  closeId: 'mobile-nav-close',
  siblings: [OVERLAYS.categories, OVERLAYS.docs],
  extraCloseSelector: '#mobile-nav-footer-link',
});

export const categoriesDrawerScript = drawerScript(OVERLAYS.categories, {
  closeId: 'categories-drawer-close',
  siblings: [OVERLAYS.mobileNav],
  guardOverflowOnClose: true,
});

export const docsDrawerScript = drawerScript(OVERLAYS.docs, {
  closeId: 'docs-drawer-close',
  siblings: [OVERLAYS.mobileNav, OVERLAYS.categories],
  guardOverflowOnClose: true,
  extraCloseSelector: 'a[href^="#"]',
});

/**
 * Desktop-only edge fade hint for the icons category sidebar. Toggles the mask
 * fade sizes based on scroll position so the fade only shows when there is more
 * to scroll in that direction.
 */
export const sidebarScrollFadeScript = `
  (function () {
    const el = document.querySelector('.sidebar-scroll');
    if (!el) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const size = getComputedStyle(el).getPropertyValue('--sidebar-fade').trim() || '1.75rem';
    let frame = null;
    function update() {
      frame = null;
      const max = el.scrollHeight - el.clientHeight;
      const showTop = mq.matches && el.scrollTop > 1;
      const showBottom = mq.matches && el.scrollTop < max - 1;
      el.style.setProperty('--sidebar-fade-top', showTop ? size : '0px');
      el.style.setProperty('--sidebar-fade-bottom', showBottom ? size : '0px');
    }
    function schedule() { if (frame == null) frame = requestAnimationFrame(update); }
    el.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    (mq.addEventListener ? mq.addEventListener('change', schedule) : mq.addListener(schedule));
    update();
  })();
`;

/** 404, examples, changelog: focus trap + theme toggle + mobile nav. */
export const simplePageScripts =
  focusTrapRuntime + themeToggleBodyScript + mobileNavScript;

/** Docs page: same as simple plus docs drawer (before per-page scrollspy script). */
export const docsPageScripts =
  focusTrapRuntime +
  themeToggleBodyScript +
  '\n\n    ' +
  docsDrawerScript +
  '\n\n    ' +
  mobileNavScript;
