import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { STYLES, WEIGHTS } from './optimize.js';
import { inferCategory, generateTags, isValidMetaCategory } from './categories.js';
import { parseExportSvgFilename } from './icon-names.js';

async function loadCustomMeta(rootDir) {
  const metaPath = join(rootDir, 'icons.meta.json');
  if (!existsSync(metaPath)) return {};

  let content;
  try {
    content = await readFile(metaPath, 'utf8');
  } catch (err) {
    throw new Error(`Cannot read icons.meta.json: ${err.message}`);
  }
  if (!content.trim()) return {};

  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    throw new Error(`icons.meta.json is not valid JSON: ${err.message}`);
  }
  if (!Array.isArray(data.icons)) {
    throw new Error('icons.meta.json must contain an "icons" array');
  }

  const map = {};
  for (const icon of data.icons) {
    if (icon.name) map[icon.name] = icon;
  }
  return map;
}

function hasCustomMetaEntry(customMeta, stem) {
  if (customMeta[stem]) return true;
  const { logicalName } = parseExportSvgFilename(`${stem}.svg`);
  return logicalName !== stem && Boolean(customMeta[logicalName]);
}

function customForStem(customMeta, stem) {
  const direct = customMeta[stem];
  if (direct) return direct;
  const { logicalName } = parseExportSvgFilename(`${stem}.svg`);
  if (logicalName !== stem) return customMeta[logicalName] || {};
  return {};
}

function tagsForIcon(custom, logicalName) {
  if (Array.isArray(custom.tags) && custom.tags.length > 0) return custom.tags;
  return generateTags(logicalName);
}

export async function generateMetadata(rootDir, distDir, iconNames, version = '0.1.0') {
  const customMeta = await loadCustomMeta(rootDir);
  
  // Check for missing metadata entries
  const missing = iconNames.filter((stem) => !hasCustomMetaEntry(customMeta, stem));
  if (missing.length > 0) {
    console.log(`  Warning: ${missing.length} icons missing from icons.meta.json`);
    console.log(`  Run 'npm run sync' to add them\n`);
  }
  
  // Generate all variant combinations
  const allVariants = [];
  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      allVariants.push(`${style}-${weight}`);
    }
  }
  
  const icons = iconNames.map((stem) => {
    const custom = customForStem(customMeta, stem);
    const { logicalName } = parseExportSvgFilename(`${stem}.svg`);
    const variants = allVariants.filter((v) =>
      existsSync(join(distDir, 'uiuxicons', v, `${stem}.svg`)),
    );
    let category = inferCategory(logicalName);
    if (custom.category) {
      if (isValidMetaCategory(custom.category)) {
        category = custom.category;
      } else {
        console.warn(`  Warning: invalid category "${custom.category}" for ${stem}, using "${category}"`);
      }
    }

    return {
      name: stem,
      category,
      tags: tagsForIcon(custom, logicalName),
      variants,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const categories = [...new Set(icons.map(i => i.category))].sort();

  const metadata = {
    name: 'UI/UX Icons',
    version,
    total: icons.length,
    styles: STYLES,
    weights: WEIGHTS,
    categories,
    icons
  };

  await writeFile(join(distDir, 'uiuxicons.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log(`  ${icons.length} icons, ${categories.length} categories`);
}
