import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/admin-test/',
  resolve: { alias: { '@': root } },
  build: { outDir: 'dist', sourcemap: true },
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    proxy: { '/admin-test/api/v1': { target: 'http://127.0.0.1:3105', rewrite: path => path.replace(/^\/admin-test/, '') } },
  },
});
