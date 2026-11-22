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
const RN_SRC = join(ROOT, 'packages', 'react-native', 'src');
const ICONS_DIR = join(RN_SRC, 'icons');

const ACCENT_FILL = 'var(--uiux-accent, currentColor)';

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

// SVG element (lowercase) -> react-native-svg component
const ELEMENT_TO_COMPONENT = {
  path: 'Path',
  g: 'G',
  circle: 'Circle',
  rect: 'Rect',
  ellipse: 'Ellipse',
  polygon: 'Polygon',
  polyline: 'Polyline',
  line: 'Line',
  defs: 'Defs',
  clippath: 'ClipPath',
  mask: 'Mask',
  lineargradient: 'LinearGradient',
  radialgradient: 'RadialGradient',
  stop: 'Stop',
  symbol: 'Symbol',
};

function toPascalCase(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function extractInnerSvg(svg) {
  const inner = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return inner.trim();
}

function convertAttrs(attrs, label) {
  // Match single- and double-quoted attributes, any letter case, so an
  // unrecognized attribute can never slip past the allowlist check.
  const attrPattern = /\b([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  const out = [];
  let match;
  while ((match = attrPattern.exec(attrs)) !== null) {
    const [, name, dq, sq] = match;
    const value = dq ?? sq;
    if (!ALLOWED_ATTRS.has(name)) {
      throw new Error(`${label}: unrecognized SVG attribute "${name}"`);
    }
    if (value === ACCENT_FILL) {
      out.push(`${toCamelCase(name)}={accent}`);
      continue;
    }
    // CSS variables only resolve in a browser
    if (value.includes('var(')) {
      throw new Error(`${label}: unsupported CSS variable in "${name}"`);
    }
    out.push(`${toCamelCase(name)}=${JSON.stringify(value)}`);
  }
  return out;
}

/** Converts inner SVG markup to react-native-svg JSX, recording used components. */
function convertToNativeJsx(inner, label, used) {
  return inner.replace(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g, (_, closing, tag, attrs, selfClosing) => {
    const component = ELEMENT_TO_COMPONENT[tag.toLowerCase()];
    if (!component) {
      throw new Error(`${label}: no react-native-svg component for <${tag}>`);
    }
    used.add(component);
    if (closing) return `</${component}>`;
    const props = convertAttrs(attrs, label);
    return `<${component}${props.length ? ' ' + props.join(' ') : ''}${selfClosing ? ' />' : '>'}`;
  });
}

function validateSvgContent(inner, style, iconName, weight) {
  if (style === 'duotone') {
    if (!inner.includes(ACCENT_FILL)) {
      throw new Error(
        `${iconName} (${style}-${weight}): duotone variant missing ${ACCENT_FILL}`
      );
    }
  }

  if (!inner.includes('currentColor')) {
    throw new Error(
      `${iconName} (${style}-${weight}): missing currentColor fill`
    );
  }
}

async function readSvgVariant(iconName, style, weight, used) {
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
  return convertToNativeJsx(inner, label, used);
}

async function generateIconFile(iconName) {
  // Name is interpolated into TS source and file paths; enforce charset.
  assertSafeIconName(iconName);
  const pascalName = toPascalCase(iconName);
  const componentName = `Icon${pascalName}`;
  const used = new Set();

  let variantEntries = '';
  for (const style of STYLES) {
    let weightEntries = '';
    for (const weight of WEIGHTS) {
      const jsx = await readSvgVariant(iconName, style, weight, used);
      const param = jsx.includes('{accent}') ? 'accent' : '';
      weightEntries += `      ${weight}: (${param}) => <>${jsx}</>,\n`;
    }
    variantEntries += `    ${style}: {\n${weightEntries}    },\n`;
  }

  const content = `// Auto-generated - DO NOT EDIT
import { ${[...used].sort().join(', ')} } from "react-native-svg";
import { createIcon } from "../createIcon";

export const ${componentName} = /*#__PURE__*/ createIcon("${iconName}", {
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
  await writeFile(join(RN_SRC, 'index.ts'), content);
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

export async function generateReactNative() {
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

  console.log(`  Generating ${iconNames.length} React Native components...`);

  if (!existsSync(ICONS_DIR)) await mkdir(ICONS_DIR, { recursive: true });
  await removeStaleIconFiles(iconNames);

  const icons = await Promise.all(iconNames.map(generateIconFile));

  await generateBarrel(icons);
  console.log(`  ${icons.length} React Native components generated`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateReactNative().catch(err => {
    console.error('React Native generation failed:', err.message);
    process.exit(1);
  });
}
