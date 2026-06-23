import process from 'node:process';

import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';

export default defineConfig(async (config) => {
  const env = loadEnv(config?.mode ?? 'development', process.cwd());

  return {
    application: {},
    vite: {
      base: config?.mode === 'production' ? '/' : env.VITE_BASE || '/',
      build: {
        assetsDir: 'assets',
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            target: env.VITE_API_PROXY_TARGET || 'http://localhost:3001',
            ws: true,
          },
          '/uploads': {
            changeOrigin: true,
            target: env.VITE_UPLOADS_PROXY_TARGET || 'http://localhost:3001',
          },
        },
      },
    },
  };
});
