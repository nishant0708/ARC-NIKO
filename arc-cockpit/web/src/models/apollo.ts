import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

/**
 * Apollo Client. In development `/graphql` is proxied to the mock server.
 * Set VITE_GRAPHQL_URL to the Airgen ERP GraphQL endpoint to switch data sources.
 */
export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql' }),
  cache: new InMemoryCache({
    typePolicies: {
      Opportunity: { keyFields: ['guid'] },
      ExceptionItem: { keyFields: ['id'] },
      ExceptionRule: { keyFields: ['id'] },
      // View objects have no identity; keep them embedded in their parent query.
      Executive: { keyFields: false },
      Scope: { keyFields: false },
      Measure: { keyFields: false },
    },
  }),
  defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
});
