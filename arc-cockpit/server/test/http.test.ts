import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { basicAuth, checkPassword, loadUsers, userLine } from '../src/http/auth.js';
import { staticFiles } from '../src/http/staticFiles.js';

const dir = mkdtempSync(path.join(tmpdir(), 'arc-http-'));
writeFileSync(path.join(dir, 'users.txt'), `# logins\n${userLine('nishant', 'correct horse battery')}\n`);
const dist = path.join(dir, 'dist');
mkdirSync(path.join(dist, 'assets'), { recursive: true });
writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>ARC</title>');
writeFileSync(path.join(dist, 'assets', 'app-abc.js'), 'console.log(1)');
writeFileSync(path.join(dir, 'secret.txt'), 'nope');

let server: Server;
let base = '';
const auth = (u: string, p: string) => ({ authorization: `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}` });

beforeAll(async () => {
  const guard = basicAuth(loadUsers(path.join(dir, 'users.txt')));
  const web = staticFiles(dist);
  server = createServer((req, res) => (guard(req, res) ? web(req, res) : undefined));
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

describe('login and static web app', () => {
  it('hashes passwords and rejects weak ones', () => {
    const users = loadUsers(path.join(dir, 'users.txt'));
    expect(checkPassword(users, 'nishant', 'correct horse battery')).toBe(true);
    expect(checkPassword(users, 'nishant', 'wrong password')).toBe(false);
    expect(checkPassword(users, 'nobody', 'correct horse battery')).toBe(false);
    expect(() => userLine('x y', 'long enough password')).toThrow(/Username/);
    expect(() => userLine('nishant', 'short')).toThrow(/at least 10/);
  });

  it('asks for a login, then serves the app with SPA fallback and cache rules', async () => {
    expect((await fetch(`${base}/`)).status).toBe(401);
    expect((await fetch(`${base}/`, { headers: auth('nishant', 'bad password!') })).status).toBe(401);
    const ok = auth('nishant', 'correct horse battery');
    const screen = await fetch(`${base}/cm360?period=Q3`, { headers: ok });
    expect(screen.status).toBe(200);
    expect(await screen.text()).toContain('<title>ARC</title>');
    expect(screen.headers.get('cache-control')).toBe('no-cache');
    const asset = await fetch(`${base}/assets/app-abc.js`, { headers: ok });
    expect(asset.headers.get('cache-control')).toContain('immutable');
    expect(asset.headers.get('content-type')).toContain('javascript');
    expect((await fetch(`${base}/assets/missing.js`, { headers: ok })).status).toBe(404);
    // no escaping the web folder
    const escape = await fetch(`${base}/%2e%2e/secret.txt`, { headers: ok });
    expect(await escape.text()).not.toContain('nope');
  });

  it('locks out an address after 10 failed logins', async () => {
    for (let i = 0; i < 10; i++) await fetch(`${base}/`, { headers: auth('nishant', `guess-${i}-xxxxx`) });
    expect((await fetch(`${base}/`, { headers: auth('nishant', 'correct horse battery') })).status).toBe(429);
  });
});
