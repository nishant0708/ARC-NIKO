import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Login for the deployed cockpit (HTTP Basic auth, checked by the Node server itself, so no nginx or root is needed).
 * Users live in a file, one per line: `name:scrypt:<salt>:<hash>` (base64). Add users with `npm run user:add`.
 * Failed logins are rate-limited per client address.
 */

export interface User {
  name: string;
  salt: Buffer;
  hash: Buffer;
}

const KEYLEN = 32;

export function hashPassword(password: string, salt = randomBytes(16)): { salt: Buffer; hash: Buffer } {
  return { salt, hash: scryptSync(password, salt, KEYLEN) };
}

export function userLine(name: string, password: string): string {
  if (!/^[A-Za-z0-9._@-]{2,64}$/.test(name)) throw new Error('Username: 2-64 characters, letters, digits and . _ @ - only.');
  if (password.length < 10) throw new Error('Password: at least 10 characters.');
  const { salt, hash } = hashPassword(password);
  return `${name}:scrypt:${salt.toString('base64')}:${hash.toString('base64')}`;
}

export function loadUsers(file: string): User[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [name, algo, salt, hash] = l.split(':');
      if (algo !== 'scrypt' || !salt || !hash) throw new Error(`Bad line in ${file} for user "${name}"`);
      return { name, salt: Buffer.from(salt, 'base64'), hash: Buffer.from(hash, 'base64') };
    });
}

export function checkPassword(users: User[], name: string, password: string): boolean {
  const user = users.find((u) => u.name === name);
  // hash even for unknown users, so response time does not reveal which names exist
  const { hash } = hashPassword(password, user?.salt ?? Buffer.alloc(16));
  return !!user && timingSafeEqual(hash, user.hash);
}

const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 10;

/** Returns a request guard: true = let the request through, false = a 401/429 was sent. */
export function basicAuth(users: User[], realm = 'ARC Cockpit') {
  const failures = new Map<string, { count: number; since: number }>();
  return (req: IncomingMessage, res: ServerResponse): boolean => {
    const ip = req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const f = failures.get(ip);
    if (f && now - f.since > WINDOW_MS) failures.delete(ip);
    if ((failures.get(ip)?.count ?? 0) >= MAX_FAILURES) {
      res.writeHead(429, { 'retry-after': String(WINDOW_MS / 1000), 'content-type': 'text/plain' }).end('Too many failed logins. Try again in 15 minutes.');
      return false;
    }
    const header = req.headers.authorization ?? '';
    if (header.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const i = decoded.indexOf(':');
      if (i > 0 && checkPassword(users, decoded.slice(0, i), decoded.slice(i + 1))) {
        failures.delete(ip);
        return true;
      }
      const cur = failures.get(ip) ?? { count: 0, since: now };
      failures.set(ip, { count: cur.count + 1, since: cur.since });
    }
    res.writeHead(401, { 'www-authenticate': `Basic realm="${realm}", charset="UTF-8"`, 'content-type': 'text/plain' }).end('Login required.');
    return false;
  };
}
