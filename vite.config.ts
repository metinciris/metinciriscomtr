import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@jsquash/avif'],
  },
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Grafik kütüphaneleri — ağır d3/recharts
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            // Medya / ağır dosya işleme kütüphaneleri
            if (
              id.includes('jszip') ||
              id.includes('heic2any') ||
              id.includes('@jsquash')
            ) {
              return 'vendor-media';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()'
    }
  },
});
