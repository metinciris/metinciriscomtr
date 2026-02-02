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

// Shared page listeyi src/data/pages.ts'den oku (TypeScript dosyasını basitçe parse ediyoruz)
const pagesFilePath = join(__dirname, '..', 'src', 'data', 'pages.ts');
const pagesFileContent = readFileSync(pagesFilePath, 'utf8');

// Array içeriğini ayıkla: [...] kısmını bulup içindeki stringleri al
const match = pagesFileContent.match(/export const validPages = \s*\[([\s\S]*?)\];/);
if (!match) {
    console.error('❌ src/data/pages.ts okunamadı veya formatı hatalı!');
    process.exit(1);
}

const validPages = match[1]
    .split(',')
    .map(p => p.trim().replace(/['"\s]/g, ''))
    .filter(p => p && p !== 'home'); // home için ayrı bir klasör gerekmez, index.html zaten orada

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
