import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.', // Explicitly set project root
  build: {
    rollupOptions: {
      input: 'src/main.tsx',
    },
    sourcemap: true,
    target: 'esnext'
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  }
});
