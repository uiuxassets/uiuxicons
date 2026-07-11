import { rm, cp, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CORE = join(ROOT, 'packages', 'core');

/**
 * Populate the @uiuxicons/core assets package from the built dist/ tree.
 * The package contents (svg/, font/, JSON) are generated, gitignored, and
 * refreshed on every build so npm always publishes the current icon set.
 */
export async function populateCorePackage(distDir) {
  const svgSrc = join(distDir, 'uiuxicons');
  const fontSrc = join(distDir, 'font');
  const metaSrc = join(distDir, 'uiuxicons.json');
  for (const [path, label] of [
    [svgSrc, 'dist/uiuxicons'],
    [fontSrc, 'dist/font'],
    [metaSrc, 'dist/uiuxicons.json'],
  ]) {
    if (!existsSync(path)) {
      throw new Error(`Cannot populate @uiuxicons/core: ${label} not found`);
    }
  }

  const svgDest = join(CORE, 'svg');
  const fontDest = join(CORE, 'font');

  await rm(svgDest, { recursive: true, force: true });
  await rm(fontDest, { recursive: true, force: true });

  await cp(svgSrc, svgDest, { recursive: true });
  await cp(fontSrc, fontDest, { recursive: true });
  await copyFile(metaSrc, join(CORE, 'uiuxicons.json'));
  // Root-level copy of the codepoint map for easy import
  await copyFile(join(fontSrc, 'codepoints.json'), join(CORE, 'codepoints.json'));

  console.log('  @uiuxicons/core assets populated');
}
