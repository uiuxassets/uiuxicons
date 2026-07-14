/**
 * Build-time syntax highlighting shared by the docs page and the per-icon
 * snippet tabs. Registers only the languages the site actually emits.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { escapeHtml as escapeMdHtml } from 'markdown-it/lib/common/utils.mjs';
import hljs from 'highlight.js/lib/core';
import hljsJavascript from 'highlight.js/lib/languages/javascript';
import hljsTypescript from 'highlight.js/lib/languages/typescript';
import hljsXml from 'highlight.js/lib/languages/xml';
import hljsBash from 'highlight.js/lib/languages/bash';
import hljsJson from 'highlight.js/lib/languages/json';
import hljsCss from 'highlight.js/lib/languages/css';
import { ROOT } from './common.js';

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

/**
 * Prefixes every selector in a minified hljs theme with `.light ` and strips
 * background declarations, so the light palette only recolors tokens when the
 * theme class is set while the block background stays driven by --code.
 */
function scopeLightTheme(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/([^{}]+)\{([^{}]*)\}/g, (_, selectors, body) => {
      const scoped = selectors
        .split(',')
        .map((s) => `.light ${s.trim()}`)
        .join(',');
      const declarations = body
        .split(';')
        .filter((d) => d.trim() && !/^\s*background\b/.test(d))
        .join(';');
      return declarations ? `${scoped}{${declarations}}` : '';
    });
}

const darkThemeCss = readFileSync(
  join(ROOT, 'node_modules/highlight.js/styles/github-dark.min.css'),
  'utf8'
);
const lightThemeCss = scopeLightTheme(
  readFileSync(join(ROOT, 'node_modules/highlight.js/styles/github.min.css'), 'utf8')
);

// Dark palette is the default; the scoped light palette wins under html.light
export const DOCS_HIGHLIGHT_CSS = `${darkThemeCss}\n${lightThemeCss}`;

export function highlightDocCode(str, lang) {
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
