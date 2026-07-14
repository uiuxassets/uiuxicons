/**
 * SEO artifacts: sitemap.xml, robots.txt, llms.txt, and JSON-LD builders.
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { execFileSync } from 'child_process';
import {
  ROOT,
  DIST,
  DOCS_DIR,
  DOC_FILE_RE,
  getSiteOrigin,
  escapeXml,
  parseDocFrontmatter,
} from './common.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Last commit date (YYYY-MM-DD) touching any of the given paths, or null. */
function gitLastCommitDate(paths) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...paths], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return DATE_RE.test(out) ? out : null;
  } catch (_) {
    return null;
  }
}

/**
 * Map of icon name -> last commit date, from a single pass over the history
 * of exports/ (a change to any style/weight variant counts as a change to
 * the icon's page). Returns an empty map when git is unavailable.
 */
function gitIconDates() {
  const dates = new Map();
  let out;
  try {
    out = execFileSync('git', ['log', '--format=COMMIT:%cs', '--name-only', '--', 'exports'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (_) {
    return dates;
  }
  let current = null;
  for (const line of out.split('\n')) {
    if (line.startsWith('COMMIT:')) {
      const d = line.slice(7).trim();
      current = DATE_RE.test(d) ? d : null;
      continue;
    }
    const m = line.match(/([^/]+)\.svg$/);
    // Log is newest-first: keep the first date seen for each icon
    if (m && current && !dates.has(m[1])) dates.set(m[1], current);
  }
  return dates;
}

export async function writeSeoAuxFiles(meta) {
  const origin = getSiteOrigin();
  const buildDate = new Date().toISOString().slice(0, 10);

  // Per-URL lastmod from the git history of each page's source, so crawlers
  // see real change dates instead of the build date on every deploy.
  const iconDates = gitIconDates();
  const indexDate =
    [...iconDates.values()].sort().pop() || gitLastCommitDate(['exports']) || buildDate;
  const entries = [
    { loc: `${origin}/`, lastmod: indexDate },
    { loc: `${origin}/docs`, lastmod: gitLastCommitDate(['docs']) || buildDate },
    { loc: `${origin}/examples`, lastmod: gitLastCommitDate(['scripts/site/pages/examples.js']) || buildDate },
    { loc: `${origin}/changelog`, lastmod: gitLastCommitDate(['changelog']) || buildDate },
    ...meta.icons.map((icon) => ({
      loc: `${origin}/icons/${icon.name}`,
      lastmod: iconDates.get(icon.name) || buildDate,
    })),
  ];
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => `  <url><loc>${escapeXml(e.loc)}</loc><lastmod>${e.lastmod}</lastmod></url>`)
      .join('\n') +
    `\n</urlset>\n`;
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
  await writeFile(join(DIST, 'sitemap.xml'), sitemap);
  await writeFile(join(DIST, 'robots.txt'), robots);
  console.log('  Generated sitemap.xml, robots.txt');
}

export async function writeLlmsTxt(meta) {
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
    '- Packages: @uiuxicons/core, @uiuxicons/react, @uiuxicons/vue',
    '- License: MIT',
    '',
  ].join('\n');

  const content = header + sections.join('\n\n---\n\n') + '\n';
  await writeFile(join(DIST, 'llms.txt'), content, 'utf8');
  console.log('  Generated llms.txt');
}

export function iconPageJsonLd(icon, display, description) {
  const origin = getSiteOrigin();
  const categoryLabel = icon.category.charAt(0).toUpperCase() + icon.category.slice(1);
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'All', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: categoryLabel, item: `${origin}/?category=${icon.category}` },
      { '@type': 'ListItem', position: 3, name: icon.name },
    ],
  };
  const image = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: `${display} icon`,
    description,
    contentUrl: `${origin}/uiuxicons/line-regular/${icon.name}.svg`,
    thumbnailUrl: `${origin}/uiuxicons/line-regular/${icon.name}.svg`,
    encodingFormat: 'image/svg+xml',
    license: 'https://github.com/uiuxassets/uiuxicons/blob/main/LICENSE',
    acquireLicensePage: `${origin}/docs`,
    creator: { '@type': 'Organization', name: 'UI/UX Icons', url: `${origin}/` },
    creditText: 'UI/UX Icons',
    copyrightNotice: 'UI/UX Icons',
  };
  // JSON.stringify never emits "</" unescaped in these fields (names are
  // [a-z0-9-], other strings are ours), but guard anyway for script contexts.
  const safe = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
  return `
  <script type="application/ld+json">${safe(breadcrumb)}</script>
  <script type="application/ld+json">${safe(image)}</script>`;
}
