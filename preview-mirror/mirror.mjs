import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE = 'https://fired-heater-atlas-master-3d-zcsqh4.v2.appdeploy.ai/';
const ORIGIN = new URL(SOURCE).origin;
const OUT = path.resolve('preview-mirror/dist');

const headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
  accept: '*/*',
  referer: SOURCE,
};

const seen = new Set();
const queue = [SOURCE];

function localPath(url) {
  const u = new URL(url);
  let pathname = decodeURIComponent(u.pathname);
  if (pathname === '/' || pathname.endsWith('/')) pathname += 'index.html';
  return pathname.replace(/^\/+/, '');
}

function sameOriginUrl(value, base) {
  if (!value || value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('mailto:') || value.startsWith('#')) return null;
  try {
    const u = new URL(value, base);
    if (u.origin !== ORIGIN) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function discover(text, base) {
  const found = new Set();
  const patterns = [
    /(?:src|href)=["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    /["'`](\/assets\/[^"'`\s)]+)["'`]/gi,
    /["'`](\.\/assets\/[^"'`\s)]+)["'`]/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const url = sameOriginUrl(match[1], base);
      if (url) found.add(url);
    }
  }
  return [...found];
}

function rewriteForPages(text) {
  // The repository is hosted below /process-equipment-atlas/ on GitHub Pages.
  // Relative paths keep the mirror portable and also work in local previews.
  return text
    .replace(/(["'(])\/assets\//g, '$1./assets/')
    .replace(/(["'(])\/resources\//g, '$1./resources/')
    .replace(/href=["']\/favicon\.svg["']/gi, '');
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

while (queue.length) {
  const current = queue.shift();
  const key = new URL(current).pathname + new URL(current).search;
  if (seen.has(key)) continue;
  seen.add(key);

  let response;
  try {
    response = await fetch(current, { redirect: 'follow', headers });
  } catch (error) {
    console.warn(`SKIP network error ${current}: ${error.message}`);
    continue;
  }

  if (!response.ok) {
    // AppDeploy currently returns 403 for favicon.svg to non-browser build fetches.
    // A cosmetic asset must never abort the whole preview mirror.
    console.warn(`SKIP ${response.status} ${current}`);
    continue;
  }

  const contentType = response.headers.get('content-type') || '';
  const bytes = Buffer.from(await response.arrayBuffer());
  const relative = localPath(current);
  const destination = path.join(OUT, relative);
  await mkdir(path.dirname(destination), { recursive: true });

  const isText = contentType.includes('text/') || contentType.includes('javascript') || contentType.includes('json') || /\.(?:html?|js|mjs|css|json|svg)$/i.test(relative);
  if (isText) {
    const original = bytes.toString('utf8');
    for (const next of discover(original, current)) {
      const nextKey = new URL(next).pathname + new URL(next).search;
      if (!seen.has(nextKey)) queue.push(next);
    }
    await writeFile(destination, rewriteForPages(original), 'utf8');
  } else {
    await writeFile(destination, bytes);
  }

  console.log(`mirrored ${new URL(current).pathname} -> ${relative} (${bytes.length} bytes)`);
}

const indexFile = path.join(OUT, 'index.html');
try {
  const html = await readFile(indexFile, 'utf8');
  const banner = '<!-- GitHub migration preview mirrored from read-only AppDeploy v42 baseline. -->';
  await writeFile(indexFile, `${banner}\n${html}`, 'utf8');
} catch {
  throw new Error('Mirror did not produce index.html');
}

console.log(`Mirror complete: ${seen.size} URLs considered.`);
