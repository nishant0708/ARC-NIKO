import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Serves the built web app (web/dist) as a single-page app:
 * real files are sent as-is, any other GET returns index.html so screen URLs survive a reload.
 * Hashed files under /assets are cached for a year; index.html is never cached, so a deploy shows at once.
 */
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

export function staticFiles(root: string) {
  const base = path.resolve(root);
  const index = path.join(base, 'index.html');
  return (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' }).end();
      return;
    }
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const file = path.resolve(base, '.' + pathname);
    const inside = file === base || file.startsWith(base + path.sep);
    const isFile = inside && existsSync(file) && statSync(file).isFile();
    if (!isFile && pathname.startsWith('/assets/')) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }
    const target = isFile ? file : index;
    const headers: Record<string, string | number> = {
      'content-type': TYPES[path.extname(target)] ?? 'application/octet-stream',
      'content-length': statSync(target).size,
      'cache-control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    };
    res.writeHead(200, headers);
    if (req.method === 'HEAD') res.end();
    else createReadStream(target).pipe(res);
  };
}
