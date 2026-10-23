import type { CodegenConfig } from '@graphql-codegen/cli';

// Generates typed documents from the server schema. When moving to Airgen, point `schema` at its endpoint.
const config: CodegenConfig = {
  schema: '../server/src/views/schema.graphql',
  documents: ['src/models/**/*.ts', '!src/models/gql/**/*'],
  generates: {
    './src/models/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      config: { enumsAsTypes: true, scalars: {} },
    },
  },
  ignoreNoDocuments: true,
};
export default config;
