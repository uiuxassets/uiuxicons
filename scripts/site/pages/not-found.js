/**
 * 404 page (noindex): served by GitHub Pages for unknown URLs.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { DIST } from '../common.js';
import { layoutSitePage, sharedHeader } from '../templates.js';
import { simplePageScripts } from '../../site-snippets.js';

export async function generate404Page(totalIcons, shared) {
  const { themeIcons, logoIcon, downloadIcon, menuIcon } = shared;
  const title = 'Page not found - UI/UX Icons';
  const description = 'The page you requested is not available. Browse the icon library or documentation.';

  const html = layoutSitePage({
    headOptions: { title, description, pageFile: '404.html', robotsNoindex: true },
    bodyHtml: `  ${sharedHeader('__404__', totalIcons, themeIcons, logoIcon, downloadIcon, menuIcon)}

  <main class="max-w-3xl mx-auto px-3 py-16 text-center">
    <h1 class="text-3xl font-bold mb-3">Page not found</h1>
    <p class="text-fg mb-8">That URL does not exist or has moved.</p>
    <p class="flex flex-wrap items-center justify-center gap-3">
      <a href="/" class="inline-flex items-center px-4 py-2 rounded-md border border-border bg-secondary hover:bg-tertiary text-fg text-sm">Browse Icons</a>
      <a href="/docs" class="inline-flex items-center px-4 py-2 rounded-md border border-border bg-secondary hover:bg-tertiary text-fg text-sm">Documentation</a>
    </p>
  </main>
`,
    scriptInner: simplePageScripts,
  });

  await writeFile(join(DIST, '404.html'), html);
  console.log('  Generated 404.html');
}
