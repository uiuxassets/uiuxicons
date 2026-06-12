import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { STYLES, WEIGHTS } from './optimize.js';

const WEIGHT_VALUE = { light: 300, regular: 400, bold: 700 };

/** Font family name for a given style (e.g. "UIUX Icons Line"). */
export function fontFamilyName(style) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `UIUX Icons ${cap(style)}`;
}

/**
 * Write dist/font/uiuxicons.css - @font-face, variant classes, per-icon ::before content.
 * Paths in url() are relative to this file (inside font/ next to line/, duotone/, solid/).
 */
export async function generateFontCss(distDir, codepoints) {
  const fontRoot = join(distDir, 'font');
  await mkdir(fontRoot, { recursive: true });

  const lines = [];
  lines.push('/* UI/UX Icons - auto-generated. Do not edit. */');
  lines.push('');

  for (const style of STYLES) {
    const ff = fontFamilyName(style);
    for (const weight of WEIGHTS) {
      lines.push('@font-face {');
      lines.push(`  font-family: "${ff}";`);
      lines.push(`  font-weight: ${WEIGHT_VALUE[weight]};`);
      lines.push(`  src: url("${style}/${weight}.woff2") format("woff2"),`);
      lines.push(`       url("${style}/${weight}.ttf") format("truetype");`);
      lines.push('  font-style: normal;');
      // swap avoids invisible icons while fonts load (FOIT)
      lines.push('  font-display: swap;');
      lines.push('}');
      lines.push('');
    }
  }

  lines.push('.uiuxicon {');
  lines.push('  display: inline-block;');
  lines.push('  line-height: 1;');
  lines.push('  font-size: inherit;');
  lines.push('  vertical-align: middle;');
  lines.push('  font-style: normal;');
  lines.push('  font-weight: 400;');
  lines.push('  -webkit-font-smoothing: antialiased;');
  lines.push('  -moz-osx-font-smoothing: grayscale;');
  lines.push('}');
  lines.push('');
  lines.push('.uiuxicon::before {');
  lines.push('  font-family: inherit;');
  lines.push('}');
  lines.push('');

  for (const style of STYLES) {
    const ff = fontFamilyName(style);
    lines.push(`.uiuxicon.uiux-${style} {`);
    lines.push(`  font-family: "${ff}", monospace;`);
    lines.push('}');
    lines.push('');
  }

  for (const weight of WEIGHTS) {
    lines.push(`.uiuxicon.uiux-${weight} {`);
    lines.push(`  font-weight: ${WEIGHT_VALUE[weight]};`);
    lines.push('}');
    lines.push('');
  }

  const sortedNames = Object.keys(codepoints).sort();
  for (const name of sortedNames) {
    const cp = codepoints[name];
    const hex = cp.toString(16);
    lines.push(`.uiuxicon.uiux-${name}::before {`);
    lines.push(`  content: "\\${hex}";`);
    lines.push('}');
    lines.push('');
  }

  await writeFile(join(fontRoot, 'uiuxicons.css'), lines.join('\n'));
  console.log('  dist/font/uiuxicons.css');
}
