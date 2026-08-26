/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Deliberately 'build', not Vite's default 'dist'. The Cloudflare Pages
    // project is configured to publish `build/`, and keeping that unchanged
    // means this migration needs no infrastructure change at all.
    outDir: 'build',
    sourcemap: true,
    chunkSizeWarningLimit: 1500, // three.js is large and that is expected
  },
  server: {
    port: 3000,
    host: true, // bind on the LAN so the site can be opened on a real phone
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
});
