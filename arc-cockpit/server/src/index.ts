import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createSchema, createYoga } from 'graphql-yoga';
import { resolvers } from './controllers/resolvers.js';
import { repository } from './models/repository.js';

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
const repo = repository();
createServer(yoga).listen(port, () => {
  console.log(`ARC mock GraphQL server on http://localhost:${port}/graphql`);
  console.log(`Loaded ${repo.opportunities.length} opportunities, ${repo.goals.length} goal rows, as of ${repo.config.asOf}`);
});
