#!/usr/bin/env node

/**
 * Sync script - keeps icons.meta.json in sync with exports/
 * 
 * - Adds entries for new icons (with auto-detected categories)
 * - Removes entries for deleted icons
 * 
 * Supports category prefix in filenames (optional):
 *   arrows--arrow-circle-down.svg → category: "arrows", name: "arrow-circle-down"
 * 
 * Run: npm run sync
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { inferCategory, generateTags } from './categories.js';
import { parseExportSvgFilename, assertSafeIconName } from './icon-names.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXPORTS = join(ROOT, 'exports');
const META_PATH = join(ROOT, 'icons.meta.json');

async function getExportedIcons() {
  // Use line/regular as the canonical source
  const lineDir = join(EXPORTS, 'line', 'regular');
  if (!existsSync(lineDir)) return [];
  
  const files = await readdir(lineDir);
  const parsed = files.filter(f => f.endsWith('.svg')).map((file) => {
    assertSafeIconName(file.replace(/\.svg$/, ''));
    const p = parseExportSvgFilename(file);
    if (p.invalidPrefix) {
      console.warn(`  Invalid category prefix "${p.invalidPrefix}" in ${file} (not in schema enum)`);
    }
    return {
      name: p.logicalName,
      category: p.categoryHint,
      filename: file,
    };
  });

  const byName = new Map();
  for (const icon of parsed) {
    if (byName.has(icon.name)) {
      console.warn(
        `  Duplicate icon name "${icon.name}" - keeping ${byName.get(icon.name).filename}, ignoring ${icon.filename}`
      );
      continue;
    }
    byName.set(icon.name, icon);
  }

  return [...byName.values()]
    .map(({ name, category }) => ({ name, category }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const EMPTY_META = {
  $schema: './icons.meta.schema.json',
  description: 'Custom metadata for UI/UX Icons. Add categories and tags for each icon here.',
  icons: [],
};

async function loadMeta() {
  if (!existsSync(META_PATH)) {
    return { ...EMPTY_META };
  }
  let content;
  try {
    content = await readFile(META_PATH, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read icons.meta.json: ${err.message}`);
  }
  if (!content.trim()) {
    return { ...EMPTY_META };
  }
  let meta;
  try {
    meta = JSON.parse(content);
  } catch (err) {
    throw new Error(`icons.meta.json is not valid JSON: ${err.message}`);
  }
  if (!Array.isArray(meta.icons)) {
    throw new Error('icons.meta.json must contain an "icons" array');
  }
  return meta;
}

async function sync() {
  const exported = await getExportedIcons();
  const meta = await loadMeta();
  
  const exportedNames = new Set(exported.map(i => i.name));
  const existingNames = new Set(meta.icons.map(i => i.name));
  
  // Find new icons (in exports but not in meta)
  const newIcons = exported.filter(i => !existingNames.has(i.name));
  
  // Find orphaned entries (in meta but not in exports)
  const orphaned = meta.icons.filter(i => !exportedNames.has(i.name));
  
  if (newIcons.length === 0 && orphaned.length === 0) {
    console.log('Metadata is in sync.');
    return;
  }

  let changed = false;

  // Remove orphaned entries
  if (orphaned.length > 0) {
    console.log(`\nRemoving ${orphaned.length} deleted icon(s):`);
    orphaned.forEach(i => console.log(`  - ${i.name}`));
    meta.icons = meta.icons.filter(i => exportedNames.has(i.name));
    changed = true;
  }
  
  // Add new icons
  if (newIcons.length > 0) {
    console.log(`\nAdding ${newIcons.length} new icon(s):`);
    
    for (const icon of newIcons) {
      const category = icon.category || inferCategory(icon.name);
      const entry = {
        name: icon.name,
        category,
        tags: generateTags(icon.name)
      };
      meta.icons.push(entry);
      console.log(`  + ${icon.name} → ${category}`);
    }
    changed = true;
  }
  
  if (changed) {
    // Sort icons alphabetically
    meta.icons.sort((a, b) => a.name.localeCompare(b.name));
    
    // Write updated meta
    await writeFile(META_PATH, JSON.stringify(meta, null, 2) + '\n');
    console.log(`\nUpdated icons.meta.json`);
  }
}

sync().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
