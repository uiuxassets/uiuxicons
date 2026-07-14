/**
 * Shared paths, escaping helpers, and small utilities used across the site
 * generator modules (templates, seo, and pages/*).
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ROOT = join(__dirname, '..', '..');
export const DIST = join(ROOT, 'dist');
export const DOCS_DIR = join(ROOT, 'docs');
export const DOC_FILE_RE = /^(\d{2})-(.+)\.md$/;

export function getSiteOrigin() {
  const raw = (process.env.SITE_URL || 'https://uiuxicons.com').replace(/\/$/, '');
  // Reject anything that is not a plain https origin so a compromised CI env
  // cannot inject newlines/extra content into robots.txt, sitemap, or SEO tags.
  if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(raw)) {
    throw new Error(`Invalid SITE_URL "${raw}": expected an https origin like https://uiuxicons.com`);
  }
  return raw;
}

export function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function escapeHtmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function parseDocFrontmatter(raw) {
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

export async function loadSvg(style, weight, name) {
  const path = join(DIST, 'uiuxicons', `${style}-${weight}`, `${name}.svg`);
  if (!existsSync(path)) return null;
  return await readFile(path, 'utf8');
}
