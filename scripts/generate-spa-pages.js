/**
 * generate-spa-pages.js
 * 
 * Bu script build sonrası çalışarak:
 * 1. Her sayfa için index.html kopyası oluşturur (SEO enjeksiyonu ile).
 * 2. sitemap.xml oluşturur.
 * 3. robots.txt oluşturur.
 * 
 * Kaynak: src/core/data/registry.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://metinciris.com.tr';
const distDir = join(__dirname, '..', 'dist');
const indexPath = join(distDir, 'index.html');
const registryPath = join(__dirname, '..', 'src', 'core', 'data', 'registry.ts');

if (!existsSync(indexPath)) {
    console.error('❌ dist/index.html bulunamadı! Önce "npm run build" çalıştırın.');
    process.exit(1);
}

const indexContent = readFileSync(indexPath, 'utf8');
const registryContent = readFileSync(registryPath, 'utf8');

// --- Registry Parser (Regex) ---
// Not: TS dosyasını parse etmek için basit ama etkili bir regex kullanalım
function parseRegistry(content) {
    const pages = {};
    const entryRegex = /(\w+|'[\w-]+'|"[\w-]+"):\s*\{([\s\S]*?)\},/g;
    let match;

    while ((match = entryRegex.exec(content)) !== null) {
        const id = match[1].replace(/['"]/g, '');
        const body = match[2];

        const slugMatch = body.match(/slug:\s*['"](.*?)['"]/);
        const titleMatch = body.match(/title:\s*['"](.*?)['"]/);
        const descMatch = body.match(/description:\s*['"](.*?)['"]/);
        const lastmodMatch = body.match(/lastmod:\s*['"](.*?)['"]/);
        const priorityMatch = body.match(/priority:\s*([\d.]+)/);
        const changefreqMatch = body.match(/changefreq:\s*['"](.*?)['"]/);
        const noindexMatch = body.match(/noindex:\s*(true|false)/);

        if (slugMatch && titleMatch) {
            pages[id] = {
                slug: slugMatch[1],
                title: titleMatch[1],
                description: descMatch ? descMatch[1] : '',
                lastmod: lastmodMatch ? lastmodMatch[1] : new Date().toISOString().split('T')[0],
                priority: priorityMatch ? parseFloat(priorityMatch[1]) : 0.5,
                changefreq: changefreqMatch ? changefreqMatch[1] : 'monthly',
                noindex: noindexMatch ? noindexMatch[1] === 'true' : false
            };
        }
    }
    return pages;
}

const registry = parseRegistry(registryContent);
const pageIds = Object.keys(registry);

console.log('🚀 SEO Dosyaları ve SPA Sayfaları Oluşturuluyor...\n');

// --- 1. SPA Sayfalarını Oluştur (SEO Enjeksiyonu) ---
let created = 0;
let metaInjected = 0;

for (const id of pageIds) {
    const meta = registry[id];
    if (!meta.slug && id !== 'home') continue;

    const isHome = id === 'home';
    const pageDir = isHome ? distDir : join(distDir, meta.slug);
    const pagePath = join(pageDir, 'index.html');

    if (!isHome && !existsSync(pageDir)) {
        mkdirSync(pageDir, { recursive: true });
    }

    let pageContent = indexContent;

    // SEO Meta Enjeksiyonu
    pageContent = pageContent.replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`);
    pageContent = pageContent.replace(/<meta name="description"[\s\S]*?\/>/, `<meta name="description" content="${meta.description}" />`);
    pageContent = pageContent.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${BASE_URL}/${meta.slug ? meta.slug + '/' : ''}" />`);

    // Open Graph
    pageContent = pageContent.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${meta.title}" />`);
    pageContent = pageContent.replace(/<meta property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${meta.description}" />`);
    pageContent = pageContent.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${BASE_URL}/${meta.slug ? meta.slug + '/' : ''}" />`);

    // Twitter
    pageContent = pageContent.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${meta.title}" />`);
    pageContent = pageContent.replace(/<meta name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${meta.description}" />`);

    // Hreflang
    pageContent = pageContent.replace(/<link rel="alternate" hreflang="tr" href=".*?" \/>/, `<link rel="alternate" hreflang="tr" href="${BASE_URL}/${meta.slug ? meta.slug + '/' : ''}" />`);
    pageContent = pageContent.replace(/<link rel="alternate" hreflang="x-default" href=".*?" \/>/, `<link rel="alternate" hreflang="x-default" href="${BASE_URL}/${meta.slug ? meta.slug + '/' : ''}" />`);

    // Noindex if set
    if (meta.noindex) {
        pageContent = pageContent.replace('</head>', '<meta name="robots" content="noindex, nofollow" />\n</head>');
    }

    writeFileSync(pagePath, pageContent, 'utf8');
    if (!isHome) created++;
    metaInjected++;
    console.log(`  ✓ ${isHome ? '(ana dizin)' : '/' + meta.slug}/index.html [META ✅]`);
}

// --- 2. Sitemap XML Oluştur ---
const sitemapLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
];

for (const id of pageIds) {
    const meta = registry[id];
    if (meta.noindex) continue;

    const url = `${BASE_URL}${meta.slug ? '/' + meta.slug : ''}/`;
    sitemapLines.push('  <url>');
    sitemapLines.push(`    <loc>${url}</loc>`);
    sitemapLines.push(`    <lastmod>${meta.lastmod}</lastmod>`);
    sitemapLines.push(`    <changefreq>${meta.changefreq}</changefreq>`);
    sitemapLines.push(`    <priority>${meta.priority.toFixed(1)}</priority>`);
    sitemapLines.push('  </url>');
}

sitemapLines.push('</urlset>');
writeFileSync(join(distDir, 'sitemap.xml'), sitemapLines.join('\n'), 'utf8');
console.log('\n📄 sitemap.xml oluşturuldu.');

// --- 3. Robots.txt Oluştur ---
const robotsContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
writeFileSync(join(distDir, 'robots.txt'), robotsContent, 'utf8');
console.log('🤖 robots.txt oluşturuldu.');

// --- 4. 404.html Oluştur (SPA fallback) ---
writeFileSync(join(distDir, '404.html'), indexContent, 'utf8');
console.log('🚧 404.html oluşturuldu (SPA fallback).');

// --- 5. SW Cache Sürümünü Güncelle ---
const swPath = join(distDir, 'sw.js');
if (existsSync(swPath)) {
    let swContent = readFileSync(swPath, 'utf8');
    const buildId = Date.now();
    swContent = swContent.replace('metinciris-assets-v1', `metinciris-assets-v${buildId}`);
    swContent = swContent.replace('metinciris-static-v1', `metinciris-static-v${buildId}`);
    writeFileSync(swPath, swContent, 'utf8');
    console.log(`🔄 sw.js cache sürümü güncellendi (v${buildId}).`);
}

console.log(`\n✅ İşlem tamamlandı! ${created} sayfa üretildi.`);
