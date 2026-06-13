import { createWriteStream, existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ZipArchive } from 'archiver';
import { STYLES, WEIGHTS } from './optimize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const LICENSE_FILE = join(REPO_ROOT, 'LICENSE');
const README_FILE = join(REPO_ROOT, 'README.md');

export async function createDownloads(distDir) {
  const downloadsDir = join(distDir, 'downloads');
  if (!existsSync(downloadsDir)) await mkdir(downloadsDir, { recursive: true });

  const outputPath = join(downloadsDir, 'uiuxicons.zip');

  const size = await new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => resolve(archive.pointer()));
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);

    if (existsSync(LICENSE_FILE)) {
      archive.file(LICENSE_FILE, { name: 'LICENSE' });
    }
    if (existsSync(README_FILE)) {
      archive.file(README_FILE, { name: 'README.md' });
    }

    const fontCss = join(distDir, 'font', 'uiuxicons.css');
    if (existsSync(fontCss)) {
      archive.file(fontCss, { name: 'font/uiuxicons.css' });
    }
    const codepointsJson = join(distDir, 'font', 'codepoints.json');
    if (existsSync(codepointsJson)) {
      archive.file(codepointsJson, { name: 'font/codepoints.json' });
    }

    for (const style of STYLES) {
      for (const weight of WEIGHTS) {
        const svgDir = join(distDir, 'uiuxicons', `${style}-${weight}`);
        if (existsSync(svgDir)) {
          archive.directory(svgDir, `svg/${style}/${weight}`);
        }

        const fontDir = join(distDir, 'font', style);
        for (const ext of ['woff2', 'ttf']) {
          const fontFile = join(fontDir, `${weight}.${ext}`);
          if (existsSync(fontFile)) {
            archive.file(fontFile, { name: `font/${style}/${weight}.${ext}` });
          }
        }
      }
    }

    archive.finalize();
  });

  console.log(`  uiuxicons.zip (${(size / 1024).toFixed(1)}KB)`);
}
