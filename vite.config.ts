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
          // Grafik kütüphaneleri — sadece recharts kullanan sayfalarda yüklenir
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
            return 'vendor-charts';
          }
          // Medya / dosya işleme — avif-donusturucu ve benzeri sayfalarda
          if (
            id.includes('jszip') ||
            id.includes('heic2any') ||
            id.includes('@jsquash') ||
            id.includes('file-saver')
          ) {
            return 'vendor-media';
          }
          // Markdown / içerik işleme — blog ve makale sayfalarında
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('rehype') ||
            id.includes('dompurify') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('hast')
          ) {
            return 'vendor-content';
          }
          // Supabase — sadece blog/konsensus gibi backend bağlantılı sayfalarda
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // React çekirdeği — her sayfada gerekli
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react/')) {
            return 'vendor-react';
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
