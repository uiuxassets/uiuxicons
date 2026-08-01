#!/usr/bin/env node

/**
 * Static site generator orchestrator. Loads the built icon metadata and SVGs
 * once, then delegates each page to a module under scripts/site/:
 *
 *   site/common.js     - paths, escaping, shared utilities
 *   site/templates.js  - document head/layout, header/footer, sidebar
 *   site/highlight.js  - build-time syntax highlighting
 *   site/seo.js        - sitemap, robots.txt, llms.txt, JSON-LD
 *   site/pages/*.js    - one module per generated page
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { DIST, loadSvg } from './site/common.js';
import { setSiteCssFile, setSiteVersion, setCloseIcon, themeToggleIcons } from './site/templates.js';
import { writeSeoAuxFiles, writeLlmsTxt } from './site/seo.js';
import { generateIndex } from './site/pages/index.js';
import { generateIconPages } from './site/pages/icon.js';
import { generateDocs } from './site/pages/docs.js';
import { generateExamples } from './site/pages/examples.js';
import { generateChangelog } from './site/pages/changelog.js';
import { generate404Page } from './site/pages/not-found.js';
import { generateOgImages } from './og-images.js';

async function generateSite({ cssFile } = {}) {
  setSiteCssFile(cssFile);
  const metaPath = join(DIST, 'uiuxicons.json');
  if (!existsSync(metaPath)) {
    throw new Error('dist/uiuxicons.json not found - run npm run build first');
  }

  let meta;
  try {
    meta = JSON.parse(await readFile(metaPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse dist/uiuxicons.json: ${err.message}`);
  }
  setSiteVersion(meta.version);
  
  // Load all SVGs for all style-weight combinations
  const icons = [];
  for (const icon of meta.icons) {
    const svgs = {};
    for (const style of meta.styles) {
      for (const weight of meta.weights) {
        const key = `${style}-${weight}`;
        svgs[key] = await loadSvg(style, weight, icon.name);
      }
    }
    icons.push({ ...icon, svgs });
  }

  // Icons shared by every page chrome (header, drawers, toolbars)
  const moonIcon = await loadSvg('line', 'regular', 'moon') || '';
  const sunIcon = await loadSvg('line', 'regular', 'sun') || '';
  setCloseIcon(await loadSvg('line', 'bold', 'x'));
  const shared = {
    themeIcons: themeToggleIcons(moonIcon, sunIcon),
    logoIcon: await loadSvg('solid', 'regular', 'ui-ux') || '',
    downloadIcon: await loadSvg('line', 'regular', 'file-arrow-down') || '',
    menuIcon: await loadSvg('line', 'regular', 'menu') || '',
    listIcon: await loadSvg('solid', 'regular', 'list') || '',
    resetIcon: await loadSvg('line', 'regular', 'arrow-ccw') || '',
  };

  await generateOgImages(icons);
  await generateIndex(meta, icons, shared);
  await generateExamples(meta.total, shared);
  await generateChangelog(meta.total, shared);
  await generateDocs(meta, shared);
  await generateIconPages(meta, icons, shared);
  await generate404Page(meta.total, shared);
  await writeLlmsTxt(meta);
  await writeSeoAuxFiles(meta);
}

export { generateSite };

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSite().catch(err => {
    console.error('Site generation failed:', err.message);
    process.exit(1);
  });
}
