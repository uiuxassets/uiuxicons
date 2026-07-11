#!/usr/bin/env node

import { createServer } from 'http';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { dirname, join, normalize, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function contentType(filePath) {
  return CONTENT_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function statFile(path) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

/**
 * Resolve a request pathname to a file on disk, mirroring GitHub Pages:
 * directory -> index.html, and extensionless URLs -> "<name>.html" (e.g. /docs).
 * Returns an absolute path inside DIST, or null when nothing matches.
 */
async function resolveFile(pathname) {
  // Decode and strip to a relative path; normalize collapses ".." segments.
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  rel = normalize(rel).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  const base = join(DIST, rel);

  // Path-traversal guard: resolved path must stay inside DIST.
  if (base !== DIST && !base.startsWith(DIST + '/')) return null;

  // Trailing slash (or root) -> directory index.
  if (pathname.endsWith('/')) {
    const indexPath = join(base, 'index.html');
    return (await statFile(indexPath))?.isFile() ? indexPath : null;
  }

  const direct = await statFile(base);
  if (direct?.isFile()) return base;

  // Clean-URL mapping: /docs -> docs.html
  const htmlPath = `${base}.html`;
  if ((await statFile(htmlPath))?.isFile()) return htmlPath;

  // Directory without trailing slash -> its index.html
  if (direct?.isDirectory()) {
    const indexPath = join(base, 'index.html');
    if ((await statFile(indexPath))?.isFile()) return indexPath;
  }

  return null;
}

function send(res, status, filePath) {
  res.writeHead(status, { 'Content-Type': contentType(filePath) });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const filePath = await resolveFile(pathname);

  if (filePath) {
    send(res, 200, filePath);
    return;
  }

  const notFound = join(DIST, '404.html');
  if ((await statFile(notFound))?.isFile()) {
    send(res, 404, notFound);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

async function start() {
  if (!(await statFile(DIST))?.isDirectory()) {
    console.error('dist/ not found - run `npm run build` first.');
    process.exit(1);
  }
  const port = Number(process.env.PORT) || 3000;
  // Localhost-only by default so the preview is never exposed to the LAN.
  // Override with HOST=0.0.0.0 when testing from another device.
  const host = process.env.HOST || '127.0.0.1';
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use (another preview server may still be running).\n` +
          `Stop it, or pick another port: PORT=3001 npm run preview`
      );
      process.exit(1);
    }
    throw err;
  });
  server.listen(port, host, () => {
    console.log(`Preview running at http://localhost:${port}`);
  });
}

start();
