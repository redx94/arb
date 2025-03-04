import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          utils: ['ethers', 'zustand']
        }
      }
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
