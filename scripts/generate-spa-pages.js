/**
 * generate-spa-pages.js
 * 
 * Bu script build sonrası çalışarak her sayfa için 
 * index.html kopyası oluşturur. Bu sayede GitHub Pages
 * doğrudan 200 status code döner (404 redirect yerine).
 * 
 * SEO için çok önemli!
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tüm geçerli sayfalar - App.tsx'teki validPages ile senkronize tutulmalı
const validPages = [
    'iletisim', 'ziyaret-mesaji', 'biyopsi-sonucu', 'baktigim-biyopsiler',
    'nobetci-eczane', 'hastane-yemek', 'ders-notlari', 'ders-programi', 'ogrenci-yemek',
    'donem-3', 'galeri', 'portfolyo', 'sinav-analizi', 'yayinlar', 'podcast',
    'blog', 'github', 'facebook', 'linkedin', 'diger-calismalar', 'fetus-uzunluklari',
    'rcb-calculator', 'gist-raporlama', 'makale', 'deprem', 'svs-reader',
    'tani-tuzaklari', 'ayin-vakasi', 'prizma-3d', 'makale-takip', 'lenf-nodu',
    'finans', 'pubmed-trend', 'online-test-analiz', 'euro-maclar', 'konsensus',
    'pubmed-makale-takip', 'avif-donusturucu', 'sjogren-raporlama'
];

const distDir = join(__dirname, '..', 'dist');
const indexPath = join(distDir, 'index.html');

console.log('🚀 SPA sayfaları oluşturuluyor...\n');

// dist/index.html var mı kontrol et
if (!existsSync(indexPath)) {
    console.error('❌ dist/index.html bulunamadı! Önce "npm run build" çalıştırın.');
    process.exit(1);
}

// index.html içeriğini oku
const indexContent = readFileSync(indexPath, 'utf8');

let created = 0;

// Her sayfa için klasör ve index.html oluştur
for (const page of validPages) {
    const pageDir = join(distDir, page);
    const pagePath = join(pageDir, 'index.html');

    // Klasör yoksa oluştur
    if (!existsSync(pageDir)) {
        mkdirSync(pageDir, { recursive: true });
    }

    // index.html kopyala
    writeFileSync(pagePath, indexContent, 'utf8');
    created++;
    console.log(`  ✓ /${page}/index.html`);
}

console.log(`\n✅ ${created} sayfa başarıyla oluşturuldu!`);
console.log('📦 GitHub Pages artık tüm sayfalara 200 status code ile yanıt verecek.\n');
