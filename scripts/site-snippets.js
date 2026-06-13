/**
 * Inline browser script strings embedded into generated HTML by scripts/site.js.
 */

/** Blocking head script: saved preference, else prefers-color-scheme. */
export const headThemeInitScript = `<script>(function(){try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.classList.add("light");else if(t!=="dark"&&window.matchMedia("(prefers-color-scheme: light)").matches)document.documentElement.classList.add("light");}catch(e){}})();</script>`;

/** Defines window.uiuxStartFocusTrap(panel) → stop function; restores focus on stop. */
export const focusTrapRuntime = `(function(){function q(p){return[].slice.call(p.querySelectorAll("a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex=\\"-1\\"])")).filter(function(el){return el.offsetWidth>0||el.offsetHeight>0||el.getClientRects().length>0;});}window.uiuxStartFocusTrap=function(panel){var prev=document.activeElement;if(!panel.hasAttribute("tabindex"))panel.setAttribute("tabindex","-1");panel.style.outline="none";panel.focus();function onKey(e){if(e.key!=="Tab")return;var list=q(panel);if(!list.length)return;var a=list[0],b=list[list.length-1],act=document.activeElement;if(e.shiftKey){if(act===a||act===panel){e.preventDefault();b.focus();}}else if(act===b){e.preventDefault();a.focus();}}panel.addEventListener("keydown",onKey);return function(){panel.removeEventListener("keydown",onKey);if(prev&&typeof prev.focus==="function")prev.focus();}};})();`;

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

export const mobileNavScript = `
  (function () {
    const root = document.getElementById('mobile-nav');
    const toggle = document.getElementById('mobile-nav-toggle');
    if (!root || !toggle) return;
    const backdrop = document.getElementById('mobile-nav-backdrop');
    const panel = document.getElementById('mobile-nav-panel');
    let trapStop = null;

    window.uiuxReleaseMobileNavFocusTrap = function () {
      if (trapStop) {
        trapStop();
        trapStop = null;
      }
    };

    function closeCategoriesDrawer() {
      if (window.uiuxReleaseCategoriesFocusTrap) window.uiuxReleaseCategoriesFocusTrap();
      const cd = document.getElementById('categories-drawer');
      const ct = document.getElementById('categories-toggle');
      if (cd && !cd.classList.contains('hidden')) {
        cd.classList.add('hidden');
        if (ct) ct.setAttribute('aria-expanded', 'false');
      }
    }

    function closeDocsDrawer() {
      if (window.uiuxReleaseDocsFocusTrap) window.uiuxReleaseDocsFocusTrap();
      const dd = document.getElementById('docs-drawer');
      const dt = document.getElementById('docs-nav-toggle');
      if (dd && !dd.classList.contains('hidden')) {
        dd.classList.add('hidden');
        if (dt) dt.setAttribute('aria-expanded', 'false');
      }
    }

    function setOpen(open) {
      root.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        closeCategoriesDrawer();
        closeDocsDrawer();
        document.body.style.overflow = 'hidden';
        window.uiuxReleaseMobileNavFocusTrap();
        trapStop = panel && window.uiuxStartFocusTrap ? window.uiuxStartFocusTrap(panel) : null;
      } else {
        window.uiuxReleaseMobileNavFocusTrap();
        document.body.style.overflow = '';
      }
    }

    toggle.addEventListener('click', () => setOpen(root.classList.contains('hidden')));
    backdrop?.addEventListener('click', () => setOpen(false));
    document.getElementById('mobile-nav-close')?.addEventListener('click', () => setOpen(false));
    document.getElementById('mobile-nav-footer-link')?.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !root.classList.contains('hidden')) setOpen(false);
    });
  })();
`;

export const categoriesDrawerScript = `
  (function () {
    const root = document.getElementById('categories-drawer');
    const toggle = document.getElementById('categories-toggle');
    if (!root || !toggle) return;
    const backdrop = document.getElementById('categories-drawer-backdrop');
    const panel = document.getElementById('categories-drawer-panel');
    let trapStop = null;

    window.uiuxReleaseCategoriesFocusTrap = function () {
      if (trapStop) {
        trapStop();
        trapStop = null;
      }
    };

    function closeMobileNav() {
      if (window.uiuxReleaseMobileNavFocusTrap) window.uiuxReleaseMobileNavFocusTrap();
      const mn = document.getElementById('mobile-nav');
      const mnt = document.getElementById('mobile-nav-toggle');
      if (mn && !mn.classList.contains('hidden')) {
        mn.classList.add('hidden');
        if (mnt) mnt.setAttribute('aria-expanded', 'false');
      }
    }

    function setOpen(open) {
      root.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        closeMobileNav();
        document.body.style.overflow = 'hidden';
        window.uiuxReleaseCategoriesFocusTrap();
        trapStop = panel && window.uiuxStartFocusTrap ? window.uiuxStartFocusTrap(panel) : null;
      } else {
        window.uiuxReleaseCategoriesFocusTrap();
        if (document.getElementById('mobile-nav')?.classList.contains('hidden')) {
          document.body.style.overflow = '';
        }
      }
    }

    toggle.addEventListener('click', () => setOpen(root.classList.contains('hidden')));
    backdrop?.addEventListener('click', () => setOpen(false));
    document.getElementById('categories-drawer-close')?.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !root.classList.contains('hidden')) setOpen(false);
    });
  })();
`;

export const docsDrawerScript = `
  (function () {
    const root = document.getElementById('docs-drawer');
    const toggle = document.getElementById('docs-nav-toggle');
    if (!root || !toggle) return;
    const backdrop = document.getElementById('docs-drawer-backdrop');
    const panel = document.getElementById('docs-drawer-panel');
    let trapStop = null;

    window.uiuxReleaseDocsFocusTrap = function () {
      if (trapStop) {
        trapStop();
        trapStop = null;
      }
    };

    function closeCategoriesDrawer() {
      if (window.uiuxReleaseCategoriesFocusTrap) window.uiuxReleaseCategoriesFocusTrap();
      const cd = document.getElementById('categories-drawer');
      const ct = document.getElementById('categories-toggle');
      if (cd && !cd.classList.contains('hidden')) {
        cd.classList.add('hidden');
        if (ct) ct.setAttribute('aria-expanded', 'false');
      }
    }

    function closeMobileNav() {
      if (window.uiuxReleaseMobileNavFocusTrap) window.uiuxReleaseMobileNavFocusTrap();
      const mn = document.getElementById('mobile-nav');
      const mnt = document.getElementById('mobile-nav-toggle');
      if (mn && !mn.classList.contains('hidden')) {
        mn.classList.add('hidden');
        if (mnt) mnt.setAttribute('aria-expanded', 'false');
      }
    }

    function setOpen(open) {
      root.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        closeMobileNav();
        closeCategoriesDrawer();
        document.body.style.overflow = 'hidden';
        window.uiuxReleaseDocsFocusTrap();
        trapStop = panel && window.uiuxStartFocusTrap ? window.uiuxStartFocusTrap(panel) : null;
      } else {
        window.uiuxReleaseDocsFocusTrap();
        if (document.getElementById('mobile-nav')?.classList.contains('hidden')) {
          document.body.style.overflow = '';
        }
      }
    }

    toggle.addEventListener('click', () => setOpen(root.classList.contains('hidden')));
    backdrop?.addEventListener('click', () => setOpen(false));
    document.getElementById('docs-drawer-close')?.addEventListener('click', () => setOpen(false));
    root.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !root.classList.contains('hidden')) setOpen(false);
    });
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
