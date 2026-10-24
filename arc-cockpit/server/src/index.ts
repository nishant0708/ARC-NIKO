import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createSchema, createYoga } from 'graphql-yoga';
import { resolvers } from './controllers/resolvers.js';
import { repository } from './models/repository.js';
import { initDataSource } from './models/dataSource.js';
import { basicAuth, loadUsers } from './http/auth.js';
import { staticFiles } from './http/staticFiles.js';

try {
  process.loadEnvFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env'));
} catch {
  /* no .env file: use the shell environment */
}

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, '..');
const typeDefs = readFileSync(path.join(here, 'views/schema.graphql'), 'utf8');

export const schema = createSchema({ typeDefs, resolvers });

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'], credentials: false },
  landingPage: false,
});

const port = Number(process.env.PORT ?? 4000);
// Loopback by default. Listening on a public address (HOST=0.0.0.0) requires at least one login.
const host = process.env.HOST ?? '127.0.0.1';
const loopback = ['127.0.0.1', '::1', 'localhost'].includes(host);
const usersFile = path.resolve(serverDir, process.env.USERS_FILE ?? 'users.txt');
const users = loadUsers(usersFile);
if (!loopback && !users.length) {
  console.error(`Refusing to listen on ${host} without a login: add one with \`npm run user:add --workspace server -- <username>\` (writes ${usersFile}).`);
  process.exit(1);
}
const guard = users.length ? basicAuth(users) : null;

// The built web app is served by this same server when it exists (production); in development Vite serves it.
const webDist = path.resolve(serverDir, process.env.WEB_DIST ?? '../web/dist');
const web = existsSync(path.join(webDist, 'index.html')) ? staticFiles(webDist) : null;

const server = createServer((req, res) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'same-origin');
  const url = req.url ?? '/';
  if (url === '/health') return yoga(req, res);
  if (guard && !guard(req, res)) return;
  if (url.startsWith('/graphql') || !web) return yoga(req, res);
  return web(req, res);
});

initDataSource()
  .then(() => {
    const repo = repository();
    server.listen(port, host, () => {
      console.log(`ARC cockpit on http://${host}:${port}  (GraphQL at /graphql${web ? ', web app from ' + webDist : ''})`);
      console.log(users.length ? `Login required: ${users.length} user(s) in ${usersFile}` : 'No login (loopback only)');
      console.log(`Source: ${repo.source.label} · ${repo.opportunities.length} opportunities, ${repo.goals.length} goal rows, as of ${repo.config.asOf}`);
    });
  })
  .catch((e: Error) => {
    console.error(`Could not load data: ${e.message}`);
    console.error('Check AGENTIC_ERP_URL / AGENTIC_ERP_TOKEN in server/.env, or set DATA_SOURCE=file to use the PILOT export.');
    process.exit(1);
  });
