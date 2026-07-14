/**
 * Changelog page: one entry per dated .txt file in changelog/.
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { ROOT, DIST, escapeHtmlText } from '../common.js';
import { layoutSitePage, sharedHeader } from '../templates.js';
import { simplePageScripts } from '../../site-snippets.js';

export async function generateChangelog(totalIcons, shared) {
  const { themeIcons, logoIcon, downloadIcon, menuIcon } = shared;
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
