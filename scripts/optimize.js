import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { optimize } from 'svgo';
import svgoConfig, { transformToCurrentColor } from '../svgo.config.js';

export const STYLES = ['line', 'duotone', 'solid'];
export const WEIGHTS = ['light', 'regular', 'bold'];

async function optimizeSvg(inputPath, outputPath, style) {
  const content = await readFile(inputPath, 'utf8');
  const result = optimize(content, { path: inputPath, ...svgoConfig });

  if (!result.data || typeof result.data !== 'string') {
    throw new Error(`SVGO produced empty output for ${inputPath}`);
  }

  const transformed = transformToCurrentColor(result.data, style);
  
  await mkdir(join(outputPath, '..'), { recursive: true });
  await writeFile(outputPath, transformed);
  
  return content.length - transformed.length;
}

async function processVariant(exportsDir, distDir, style, weight) {
  const inputDir = join(exportsDir, style, weight);
  const outputDir = join(distDir, 'uiuxicons', `${style}-${weight}`);
  
  if (!existsSync(inputDir)) return { count: 0, saved: 0 };
  if (!existsSync(outputDir)) await mkdir(outputDir, { recursive: true });
  
  const files = (await readdir(inputDir)).filter(f => f.endsWith('.svg'));
  let saved = 0;
  
  for (const file of files) {
    saved += await optimizeSvg(join(inputDir, file), join(outputDir, file), style);
  }
  
  return { count: files.length, saved };
}

export async function optimizeAll(exportsDir, distDir) {
  let totalSaved = 0;
  let totalIcons = 0;
  
  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const { count, saved } = await processVariant(exportsDir, distDir, style, weight);
      if (count > 0) {
        totalSaved += saved;
        totalIcons = Math.max(totalIcons, count);
        console.log(`  ${style}-${weight}: ${count} icons`);
      }
    }
  }
  
  console.log(`  Saved ${(totalSaved / 1024).toFixed(1)}KB`);
  return totalIcons;
}
