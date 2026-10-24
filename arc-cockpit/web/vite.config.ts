import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          apollo: ['@apollo/client', 'graphql'],
          charts: ['recharts'],
          radix: ['@radix-ui/react-select', '@radix-ui/react-dialog', '@radix-ui/react-icons'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // In development the mock server runs on :4000. Point VITE_GRAPHQL_URL at Airgen to switch.
    proxy: { '/graphql': 'http://127.0.0.1:4000' },
  },
});
