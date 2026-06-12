#!/usr/bin/env node

import { readFile, writeFile, mkdir, readdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { STYLES, WEIGHTS } from './optimize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const REACT_SRC = join(ROOT, 'packages', 'react', 'src');
const ICONS_DIR = join(REACT_SRC, 'icons');

const ALLOWED_ATTRS = new Set([
  'fill', 'fill-opacity', 'fill-rule',
  'clip-rule', 'clip-path',
  'opacity', 'transform',
  'd', 'points',
  'cx', 'cy', 'r', 'rx', 'ry',
  'x', 'y', 'width', 'height',
  'id',
  'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-dasharray', 'stroke-dashoffset',
]);

const ATTR_TO_JSX = {
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'clip-path': 'clipPath',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-width': 'strokeWidth',
};

function toPascalCase(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function extractInnerSvg(svg) {
  const inner = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return inner.trim();
}

function convertAttrToJsx(attr) {
  return ATTR_TO_JSX[attr] || attr;
}

function convertElementToJsx(html) {
  const attrPattern = /\b([a-z-]+)="([^"]*)"/g;
  let match;
  const foundAttrs = [];

  let temp = html;
  while ((match = attrPattern.exec(temp)) !== null) {
    const [, attrName] = match;
    if (attrName === 'xmlns' || attrName === 'viewBox') continue;
    foundAttrs.push(attrName);
  }

  for (const attr of foundAttrs) {
    if (!ALLOWED_ATTRS.has(attr)) {
      throw new Error(`Unrecognized SVG attribute: "${attr}"`);
    }
  }

  let jsx = html;
  for (const [html_attr, jsx_attr] of Object.entries(ATTR_TO_JSX)) {
    jsx = jsx.replaceAll(`${html_attr}=`, `${jsx_attr}=`);
  }

  return jsx;
}

function validateSvgContent(inner, style, iconName, weight) {
  if (style === 'duotone') {
    if (!inner.includes('var(--uiux-accent, currentColor)')) {
      throw new Error(
        `${iconName} (${style}-${weight}): duotone variant missing var(--uiux-accent, currentColor)`
      );
    }
  }

  if (!inner.includes('currentColor')) {
    throw new Error(
      `${iconName} (${style}-${weight}): missing currentColor fill`
    );
  }
}

async function readSvgVariant(iconName, style, weight) {
  const filePath = join(DIST, 'uiuxicons', `${style}-${weight}`, `${iconName}.svg`);
  if (!existsSync(filePath)) {
    throw new Error(`Missing SVG: ${filePath}`);
  }
  const svg = await readFile(filePath, 'utf8');
  const inner = extractInnerSvg(svg);
  validateSvgContent(inner, style, iconName, weight);
  return convertElementToJsx(inner);
}

async function generateIconFile(iconName) {
  const pascalName = toPascalCase(iconName);
  const componentName = `Icon${pascalName}`;

  let variantEntries = '';
  for (const style of STYLES) {
    let weightEntries = '';
    for (const weight of WEIGHTS) {
      const jsx = await readSvgVariant(iconName, style, weight);
      weightEntries += `      ${weight}: <>${jsx}</>,\n`;
    }
    variantEntries += `    ${style}: {\n${weightEntries}    },\n`;
  }

  const content = `// Auto-generated - DO NOT EDIT
import { createIcon } from "../createIcon";

export const ${componentName} = createIcon("${iconName}", {
${variantEntries}});
`;

  await writeFile(join(ICONS_DIR, `${iconName}.tsx`), content);
  return { iconName, componentName };
}

async function generateBarrel(icons) {
  let content = '// Auto-generated - DO NOT EDIT\nexport type { IconProps, IconProviderProps, IconVariant, IconWeight } from "./types";\nexport { IconProvider } from "./IconProvider";\n\n';
  for (const { iconName, componentName } of icons) {
    content += `export { ${componentName} } from "./icons/${iconName}";\n`;
  }
  await writeFile(join(REACT_SRC, 'index.ts'), content);
}

async function removeStaleIconFiles(iconNames) {
  if (!existsSync(ICONS_DIR)) return;
  const keep = new Set(iconNames);
  const files = await readdir(ICONS_DIR);
  await Promise.all(
    files
      .filter((f) => f.endsWith('.tsx'))
      .filter((f) => !keep.has(f.slice(0, -4)))
      .map((f) => rm(join(ICONS_DIR, f))),
  );
}

export async function generateReact() {
  const metaPath = join(DIST, 'uiuxicons.json');
  if (!existsSync(metaPath)) {
    throw new Error('dist/uiuxicons.json not found. Run build first.');
  }

  let meta;
  try {
    meta = JSON.parse(await readFile(metaPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse dist/uiuxicons.json: ${err.message}`);
  }
  if (!Array.isArray(meta.icons)) {
    throw new Error('dist/uiuxicons.json must contain an "icons" array');
  }
  const iconNames = meta.icons.map((i) => i.name);

  console.log(`  Generating ${iconNames.length} React components...`);

  if (!existsSync(ICONS_DIR)) await mkdir(ICONS_DIR, { recursive: true });
  await removeStaleIconFiles(iconNames);

  const icons = await Promise.all(iconNames.map(generateIconFile));

  await generateBarrel(icons);
  console.log(`  ${icons.length} React components generated`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateReact().catch(err => {
    console.error('React generation failed:', err.message);
    process.exit(1);
  });
}
