#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { mkdir, rm, readdir, readFile, copyFile, rename } from 'fs/promises';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { optimizeAll } from './optimize.js';
import { generateMetadata } from './metadata.js';
import { createDownloads } from './zip.js';
import { generateSite } from './site.js';
import { generateReact } from './generate-react.js';
import { generateVue } from './generate-vue.js';
import { generateIconFonts } from './font.js';
import { assertSafeIconName } from './icon-names.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXPORTS = join(ROOT, 'exports');
const ASSETS = join(ROOT, 'assets');
const DIST = join(ROOT, 'dist');

async function getIconNames() {
  const dir = join(EXPORTS, 'line', 'regular');
  if (!existsSync(dir)) return [];
  const files = await readdir(dir);
  return files
    .filter(f => f.endsWith('.svg'))
    .map(f => assertSafeIconName(f.replace('.svg', '')))
    .sort();
}

async function build() {
  if (!existsSync(EXPORTS)) {
    throw new Error('exports/ directory not found');
  }

  const start = Date.now();
  const iconNames = await getIconNames();
  let pkg;
  try {
    pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse package.json: ${err.message}`);
  }

  console.log(`\nBuilding ${iconNames.length} icons...`);

  // Clean and create dist
  if (existsSync(DIST)) await rm(DIST, { recursive: true });
  await mkdir(DIST, { recursive: true });

  // Build steps
  await optimizeAll(EXPORTS, DIST);
  await generateIconFonts();
  await generateMetadata(ROOT, DIST, iconNames, pkg.version);
  await createDownloads(DIST);
  await generateReact();

  // Typecheck after codegen so freshly generated components are validated too
  console.log('  Typechecking @uiuxicons/react...');
  execSync('npx tsc --noEmit -p packages/react/tsconfig.json', { cwd: ROOT, stdio: 'inherit' });

  // Build React package
  console.log('  Building @uiuxicons/react...');
  execSync('npm run build -w @uiuxicons/react', { cwd: ROOT, stdio: 'inherit' });

  await generateVue();

  console.log('  Typechecking @uiuxicons/vue...');
  execSync('npx tsc --noEmit -p packages/vue/tsconfig.json', { cwd: ROOT, stdio: 'inherit' });

  // Build Vue package
  console.log('  Building @uiuxicons/vue...');
  execSync('npm run build -w @uiuxicons/vue', { cwd: ROOT, stdio: 'inherit' });

  // Copy assets
  if (existsSync(ASSETS)) {
    const assets = await readdir(ASSETS);
    for (const file of assets) {
      await copyFile(join(ASSETS, file), join(DIST, file));
    }
  }
  
  // Compile Tailwind CSS first, then fingerprint it so generated pages can
  // link a content-hashed filename (cache busting on every CSS change)
  console.log('  Compiling CSS...');
  execSync('npx tailwindcss -i styles/index.css -o dist/styles.css --minify', { cwd: ROOT, stdio: 'inherit' });
  const cssHash = createHash('sha256')
    .update(await readFile(join(DIST, 'styles.css')))
    .digest('hex')
    .slice(0, 10);
  const cssFile = `styles.${cssHash}.css`;
  await rename(join(DIST, 'styles.css'), join(DIST, cssFile));

  await generateSite({ cssFile });

  console.log(`Done in ${((Date.now() - start) / 1000).toFixed(2)}s\n`);
}

build().catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});
