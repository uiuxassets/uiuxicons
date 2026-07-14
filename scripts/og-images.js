/**
 * Per-icon Open Graph images (dist/og/icon-{name}.png, 1200x630).
 *
 * Same approach Lucide uses: an SVG template (assets/og/og-icon-template.svg)
 * with placeholders, filled per icon and rasterized. Rendering uses
 * @resvg/resvg-js with the bundled Inter font files only (no system fonts),
 * so the output is identical on every build machine.
 */

import { readFile, mkdir } from 'fs/promises';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Resvg } from '@resvg/resvg-js';
import { ROOT, DIST, escapeXml } from './site/common.js';

const OG_ASSETS = join(ROOT, 'assets', 'og');
const OG_WIDTH = 1200;
const TILE = { x: 80, y: 150, size: 360 };
const ICON_SIZE = 216;
const RENDER_CONCURRENCY = 8;

/** Position a 24x24 currentColor icon SVG inside the template canvas. */
function placeIconSvg(svg, size, x, y, color) {
  return svg
    .replace('<svg ', `<svg width="${size}" height="${size}" x="${x}" y="${y}" `)
    .replace(/currentColor/g, color);
}

function tagsLine(tags, maxChars = 44) {
  let line = '';
  for (const tag of tags) {
    const next = line ? `${line} \u00b7 ${tag}` : tag;
    if (next.length > maxChars) break;
    line = next;
  }
  return line || tags[0] || '';
}

export async function generateOgImages(icons) {
  const template = await readFile(join(OG_ASSETS, 'og-icon-template.svg'), 'utf8');
  const fontOptions = {
    loadSystemFonts: false,
    fontFiles: [join(OG_ASSETS, 'Inter-Bold.ttf'), join(OG_ASSETS, 'Inter-Medium.ttf')],
    defaultFontFamily: 'Inter',
  };
  await mkdir(join(DIST, 'og'), { recursive: true });

  const logoSvg = icons.find((i) => i.name === 'ui-ux')?.svgs['solid-regular'];
  if (!logoSvg) throw new Error('og-images: ui-ux logo icon not found');
  const logoPlaced = placeIconSvg(logoSvg, 40, 80, 52, '#ffffff');

  async function renderOne(icon) {
    const iconSvg = icon.svgs['line-regular'];
    if (!iconSvg) throw new Error(`og-images: missing line-regular SVG for ${icon.name}`);
    const display = icon.name
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    const iconOffset = TILE.x + (TILE.size - ICON_SIZE) / 2;
    const iconOffsetY = TILE.y + (TILE.size - ICON_SIZE) / 2;
    const svg = template
      .replaceAll('{{logoSVG}}', logoPlaced)
      .replaceAll('{{iconSVG}}', placeIconSvg(iconSvg, ICON_SIZE, iconOffset, iconOffsetY, '#ffffff'))
      .replaceAll('{{title}}', escapeXml(display))
      .replaceAll('{{titleSize}}', display.length > 16 ? '44' : '60')
      .replaceAll('{{tags}}', escapeXml(tagsLine(icon.tags)));
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: OG_WIDTH },
      font: fontOptions,
    })
      .render()
      .asPng();
    await writeFile(join(DIST, 'og', `icon-${icon.name}.png`), png);
  }

  for (let i = 0; i < icons.length; i += RENDER_CONCURRENCY) {
    await Promise.all(icons.slice(i, i + RENDER_CONCURRENCY).map(renderOne));
  }
  console.log(`  Generated ${icons.length} OG images (og/icon-{name}.png)`);
}
