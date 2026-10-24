/**
 * Adds or replaces a cockpit login.
 *   npm run user:add --workspace server -- <username>
 * Asks for the password (hidden); or pipe it in: printf '%s' "$PW" | npm run user:add ...
 * Writes to USERS_FILE (default server/users.txt, readable only by you). Restart the server to apply.
 */
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { userLine } from '../http/auth.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
try {
  process.loadEnvFile(path.join(serverDir, '.env'));
} catch {
  /* no .env */
}
const file = path.resolve(serverDir, process.env.USERS_FILE ?? 'users.txt');

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) {
    let data = '';
    for await (const chunk of process.stdin) data += chunk;
    return data.replace(/\r?\n$/, '');
  }
  const ask = (prompt: string) =>
    new Promise<string>((resolve) => {
      process.stdout.write(prompt);
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      let value = '';
      const onData = (buf: Buffer) => {
        for (const ch of buf.toString('utf8')) {
          if (ch === '\r' || ch === '\n') {
            stdin.setRawMode(false);
            stdin.pause();
            stdin.off('data', onData);
            process.stdout.write('\n');
            return resolve(value);
          }
          if (ch === '\u0003') process.exit(130);
          value = ch === '\u007f' ? value.slice(0, -1) : value + ch;
        }
      };
      stdin.on('data', onData);
    });
  const first = await ask('Password (min 10 characters): ');
  const second = await ask('Repeat password: ');
  if (first !== second) throw new Error('Passwords do not match.');
  return first;
}

async function main() {
  const name = process.argv[2];
  if (!name) throw new Error('Usage: npm run user:add --workspace server -- <username>');
  const line = userLine(name, await readPassword());
  const others = existsSync(file)
    ? readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith(`${name}:`))
    : ['# ARC cockpit logins. Manage with: npm run user:add --workspace server -- <username>'];
  writeFileSync(file, [...others, line].join('\n') + '\n', { mode: 0o600 });
  chmodSync(file, 0o600);
  console.log(`Saved login "${name}" to ${file}. Restart the server to apply.`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
