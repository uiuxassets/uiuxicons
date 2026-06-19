#!/usr/bin/env node

import { readFile, writeFile, mkdir, readdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { STYLES, WEIGHTS } from './optimize.js';
import { assertSafeIconName } from './icon-names.js';
import { assertSvgSafe, assertAllowedSvgElements } from './svg-safety.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const VUE_SRC = join(ROOT, 'packages', 'vue', 'src');
const ICONS_DIR = join(VUE_SRC, 'icons');

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

function toPascalCase(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function extractInnerSvg(svg) {
  const inner = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return inner.trim();
}

function validateAttrs(html) {
  const attrPattern = /\b([a-z-]+)="([^"]*)"/g;
  let match;
  let temp = html;
  while ((match = attrPattern.exec(temp)) !== null) {
    const [, attrName] = match;
    if (attrName === 'xmlns' || attrName === 'viewBox') continue;
    if (!ALLOWED_ATTRS.has(attrName)) {
      throw new Error(`Unrecognized SVG attribute: "${attrName}"`);
    }
  }
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
  const label = `${style}-${weight}/${iconName}.svg`;
  assertSvgSafe(svg, label);
  const inner = extractInnerSvg(svg);
  assertAllowedSvgElements(inner, label);
  validateSvgContent(inner, style, iconName, weight);
  validateAttrs(inner);
  return inner;
}

function escapeTemplateLiteral(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

async function generateIconFile(iconName) {
  // Name is interpolated into TS source and file paths; enforce charset.
  assertSafeIconName(iconName);
  const pascalName = toPascalCase(iconName);
  const componentName = `Icon${pascalName}`;

  let variantEntries = '';
  for (const style of STYLES) {
    let weightEntries = '';
    for (const weight of WEIGHTS) {
      const html = await readSvgVariant(iconName, style, weight);
      weightEntries += `      ${weight}: \`${escapeTemplateLiteral(html)}\`,\n`;
    }
    variantEntries += `    ${style}: {\n${weightEntries}    },\n`;
  }

  const content = `// Auto-generated - DO NOT EDIT
import { createIcon } from "../createIcon";

export const ${componentName} = /*#__PURE__*/ createIcon("${iconName}", {
${variantEntries}});
`;

  await writeFile(join(ICONS_DIR, `${iconName}.ts`), content);
  return { iconName, componentName };
}

async function generateBarrel(icons) {
  let content = '// Auto-generated - DO NOT EDIT\nexport type { IconProps, IconProviderProps, IconVariant, IconWeight } from "./types";\nexport { IconProvider } from "./IconProvider";\n\n';
  for (const { iconName, componentName } of icons) {
    content += `export { ${componentName} } from "./icons/${iconName}";\n`;
  }
  await writeFile(join(VUE_SRC, 'index.ts'), content);
}

async function removeStaleIconFiles(iconNames) {
  if (!existsSync(ICONS_DIR)) return;
  const keep = new Set(iconNames);
  const files = await readdir(ICONS_DIR);
  await Promise.all(
    files
      .filter((f) => f.endsWith('.ts'))
      .filter((f) => !keep.has(f.slice(0, -3)))
      .map((f) => rm(join(ICONS_DIR, f))),
  );
}

export async function generateVue() {
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

  console.log(`  Generating ${iconNames.length} Vue components...`);

  if (!existsSync(ICONS_DIR)) await mkdir(ICONS_DIR, { recursive: true });
  await removeStaleIconFiles(iconNames);

  const icons = await Promise.all(iconNames.map(generateIconFile));

  await generateBarrel(icons);
  console.log(`  ${icons.length} Vue components generated`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateVue().catch(err => {
    console.error('Vue generation failed:', err.message);
    process.exit(1);
  });
}
