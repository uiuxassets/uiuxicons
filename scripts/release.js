#!/usr/bin/env node

/**
 * Release helper: bumps the root and both package versions in lockstep,
 * records a changelog entry, commits, and creates the version tag.
 *
 * Usage: npm run release -- patch|minor|major
 *
 * Pushing the tag (the actual publish trigger) stays manual:
 *   git push origin main vX.Y.Z
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { readFile, writeFile, appendFile } from 'fs/promises';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PACKAGE_FILES = [
  'package.json',
  'packages/react/package.json',
  'packages/vue/package.json',
];

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString().trim();
}

function bump(version, kind) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

async function release() {
  const kind = process.argv[2];
  if (!['patch', 'minor', 'major'].includes(kind)) {
    console.error('Usage: npm run release -- patch|minor|major');
    process.exit(1);
  }

  if (run('git status --porcelain') !== '') {
    console.error('Working tree is not clean. Commit or stash changes first.');
    process.exit(1);
  }

  const pkgs = await Promise.all(
    PACKAGE_FILES.map(async (file) => ({
      file,
      json: JSON.parse(await readFile(join(ROOT, file), 'utf8')),
    }))
  );

  const versions = new Set(pkgs.map((p) => p.json.version));
  if (versions.size !== 1) {
    console.error(`Version drift detected: ${[...versions].join(', ')}`);
    process.exit(1);
  }

  const current = pkgs[0].json.version;
  const next = bump(current, kind);
  const tag = `v${next}`;

  console.log(`\nReleasing ${current} -> ${next}`);

  console.log('  Running checks and tests...');
  execSync('npm test', { cwd: ROOT, stdio: 'inherit' });

  for (const { file, json } of pkgs) {
    json.version = next;
    await writeFile(
      join(ROOT, file),
      JSON.stringify(json, null, 2) + '\n'
    );
  }
  // Keep the lockfile's workspace versions in sync
  execSync('npm install --package-lock-only', { cwd: ROOT, stdio: 'pipe' });

  const today = new Date().toISOString().slice(0, 10);
  const entryFile = join(ROOT, 'changelog', `${today}.txt`);
  const meta = JSON.parse(await readFile(join(ROOT, 'icons.meta.json'), 'utf8'));
  const line = `Released ${tag}: @uiuxicons/react and @uiuxicons/vue at ${next}, ${meta.icons.length} icons.\n`;
  if (existsSync(entryFile)) {
    await appendFile(entryFile, line);
  } else {
    await writeFile(entryFile, line);
  }

  execSync(`git add -A && git commit -m "Release ${tag}"`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execSync(`git tag ${tag}`, { cwd: ROOT, stdio: 'inherit' });

  console.log(`\nDone. Publish with:\n  git push origin main ${tag}\n`);
}

release().catch((err) => {
  console.error('Release failed:', err.message);
  process.exit(1);
});
