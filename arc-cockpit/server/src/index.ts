import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createSchema, createYoga } from 'graphql-yoga';
import { resolvers } from './controllers/resolvers.js';
import { repository } from './models/repository.js';
import { initDataSource } from './models/dataSource.js';

try {
  process.loadEnvFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env'));
} catch {
  /* no .env file: use the shell environment */
}

const here = path.dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(path.join(here, 'views/schema.graphql'), 'utf8');

export const schema = createSchema({ typeDefs, resolvers });

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'], credentials: false },
  landingPage: false,
});

const port = Number(process.env.PORT ?? 4000);
// Loopback only by default: in production nginx is the only way in.
const host = process.env.HOST ?? '127.0.0.1';
initDataSource()
  .then(() => {
    const repo = repository();
    createServer(yoga).listen(port, host, () => {
      console.log(`ARC cockpit GraphQL server on http://${host}:${port}/graphql`);
      console.log(`Source: ${repo.source.label} · ${repo.opportunities.length} opportunities, ${repo.goals.length} goal rows, as of ${repo.config.asOf}`);
    });
  })
  .catch((e: Error) => {
    console.error(`Could not load data: ${e.message}`);
    console.error('Check AGENTIC_ERP_URL / AGENTIC_ERP_TOKEN in server/.env, or set DATA_SOURCE=file to use the PILOT export.');
    process.exit(1);
  });
