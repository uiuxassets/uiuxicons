import { existsSync } from 'fs';
import { readdir, readFile, mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateFonts, FontAssetType } from 'fantasticon';
import { STYLES, WEIGHTS } from './optimize.js';
import { generateFontCss } from './font-css.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const CODEPOINTS_PATH = join(ROOT, 'icons.codepoints.json');

/**
 * Loads persisted codepoints from icons.codepoints.json, assigns new
 * codepoints for any icons not yet in the map, removes entries for deleted
 * icons, and writes back if anything changed.
 */
export async function buildCodepointMap(referenceDir) {
  const files = (await readdir(referenceDir))
    .filter(f => f.endsWith('.svg'))
    .map(f => f.replace('.svg', ''))
    .sort();
  const iconSet = new Set(files);

  let persisted = {};
  if (existsSync(CODEPOINTS_PATH)) {
    persisted = JSON.parse(await readFile(CODEPOINTS_PATH, 'utf8'));
  }

  const codepoints = {};
  let changed = false;

  for (const [name, code] of Object.entries(persisted)) {
    if (iconSet.has(name)) {
      codepoints[name] = code;
    } else {
      changed = true;
    }
  }

  const maxExisting = Object.values(codepoints).length
    ? Math.max(...Object.values(codepoints))
    : 0xE000;
  let nextCode = maxExisting + 1;

  for (const name of files) {
    if (!(name in codepoints)) {
      codepoints[name] = nextCode++;
      changed = true;
    }
  }

  if (changed) {
    const sorted = Object.fromEntries(
      Object.entries(codepoints).sort(([a], [b]) => a.localeCompare(b)),
    );
    await writeFile(CODEPOINTS_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
    console.log('  Updated icons.codepoints.json');
  }

  return codepoints;
}

export async function generateIconFonts() {
  const referenceDir = join(DIST, 'uiuxicons', 'line-regular');
  if (!existsSync(referenceDir)) {
    console.warn('  Skipping fonts: optimized SVGs not found');
    return;
  }

  const codepoints = await buildCodepointMap(referenceDir);

  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const inputDir = join(DIST, 'uiuxicons', `${style}-${weight}`);
      const outputDir = join(DIST, 'font', style);

      if (!existsSync(inputDir)) continue;
      if (!existsSync(outputDir)) await mkdir(outputDir, { recursive: true });

      const fontName = `uiuxicons-${style}-${weight}`;

      await generateFonts({
        inputDir,
        outputDir,
        name: weight,
        fontTypes: [FontAssetType.WOFF2, FontAssetType.TTF],
        assetTypes: [],
        codepoints,
        fontHeight: 1000,
        normalize: true,
      });

      console.log(`  ${fontName} (.woff2, .ttf)`);
    }
  }

  const fontOut = join(DIST, 'font');
  await mkdir(fontOut, { recursive: true });
  await writeFile(
    join(fontOut, 'codepoints.json'),
    JSON.stringify(codepoints, null, 2) + '\n',
    'utf8'
  );
  console.log('  dist/font/codepoints.json');

  await generateFontCss(DIST, codepoints);
}
