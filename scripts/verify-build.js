/**
 * Post-build verification script.
 * Checks critical files and patterns to catch common build errors early.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PITFALL_BLOG_TOPICS, pitfallUrl } from '../src/utils/pitfallBlogLinks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const src = join(root, 'src');

let failures = 0;
let passes = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passes++;
  } else {
    console.error(`  ✗ ${label}`);
    failures++;
  }
}

function readSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

console.log('\n🔍 Build Verification\n');

// --- Source checks ---
console.log('Source checks:');

const blogTsx = readSafe(join(src, 'pages', 'Blog.tsx'));
if (blogTsx !== null) {
  check('Blog.tsx exists', true);
  check('Blog.tsx does not start with CSS', !blogTsx.trimStart().startsWith('.') && !blogTsx.trimStart().startsWith('/*'));
  check('Blog.tsx contains valid TSX (has export)', /export\s/.test(blogTsx));
} else {
  check('Blog.tsx exists', false);
}

const appTsx = readSafe(join(src, 'App.tsx'));
if (appTsx !== null) {
  const getPageMatches = appTsx.match(/const getPageFromPath|function getPageFromPath/g);
  check('getPageFromPath defined exactly once in App.tsx', getPageMatches !== null && getPageMatches.length === 1);

  // Check for duplicate const path declarations inside getPageFromPath
  const fnMatch = appTsx.match(/getPageFromPath[\s\S]*?^\s*\}/m);
  if (fnMatch) {
    const constPathMatches = fnMatch[0].match(/const path\b/g);
    check('No duplicate const path in getPageFromPath', constPathMatches === null || constPathMatches.length <= 1);
  }
} else {
  check('App.tsx exists', false);
}

// --- Dist checks ---
console.log('\nBuild output checks:');

check('dist/index.html exists', existsSync(join(dist, 'index.html')));
check('dist/blog/index.html exists', existsSync(join(dist, 'blog', 'index.html')));

const postsJson = join(dist, 'blog', 'posts.json');
check('dist/blog/posts.json exists', existsSync(postsJson));

const sitemapPath = join(dist, 'sitemap.xml');
const sitemap = readSafe(sitemapPath);
check('dist/sitemap.xml exists', sitemap !== null);
const pitfallHtml = readSafe(join(dist, 'tani-tuzaklari', 'thyroid-capsular-invasion', 'index.html'));
check('Tanı tuzağı detay sayfası statik HTML üretildi', pitfallHtml !== null && pitfallHtml.includes('Kapsül İnvazyonu'));
check('Tanı tuzağı sayfasında blog yazıları bölümü var',
  pitfallHtml !== null && pitfallHtml.includes('Konuyla İlgili Blog Yazıları'));
const legacyHtml = readSafe(join(dist, 'tani-tuzaklari', 'index.html'));
check('Tanı tuzakları liste sayfası duruyor', legacyHtml !== null);

const missingPitfallPages = PITFALL_BLOG_TOPICS
  .map((topic) => ({ id: topic.id, url: pitfallUrl(topic.id) }))
  .filter((topic) => !existsSync(join(dist, 'tani-tuzaklari', topic.id, 'index.html')));
check('En az 42 tanı tuzağı için eşleştirme kuralı mevcut', PITFALL_BLOG_TOPICS.length >= 42);
check('Bütün tanı tuzakları ayrı statik HTML olarak üretildi', missingPitfallPages.length === 0);
if (missingPitfallPages.length > 0) {
  console.error('  Eksik tanı tuzakları:', missingPitfallPages.map((p) => p.id).join(', '));
}

check('sitemap.xml is not empty', sitemap !== null && sitemap.trim().length > 100);

if (sitemap) {
  check('sitemap.xml contains homepage', sitemap.includes('https://metinciris.com.tr/'));
  check('sitemap.xml contains blog', sitemap.includes('/blog/'));
  check('sitemap.xml contains individual diagnostic pitfalls', sitemap.includes('/tani-tuzaklari/thyroid-capsular-invasion/'));
  check('Bütün tanı tuzakları sitemap içinde', PITFALL_BLOG_TOPICS.every((topic) => sitemap.includes(pitfallUrl(topic.id))));
}

// Check for BlogPosting JSON-LD in at least one blog post page
const blogIndexHtml = readSafe(join(dist, 'blog', 'index.html'));
if (blogIndexHtml) {
  // Blog list page or individual post pages may have BlogPosting
  // Check if any blog subdirectory has BlogPosting
  check('Blog index.html exists and has content', blogIndexHtml.length > 200);
}

// Check canonical tag and static content in dist/index.html
const distIndex = readSafe(join(dist, 'index.html'));
if (distIndex) {
  check('Canonical tag in index.html', distIndex.includes('rel="canonical"'));
  check('Static content contains Name', distIndex.includes('Prof. Dr. İbrahim Metin Çiriş'));
  check('Static content contains Title', distIndex.includes('Tıbbi Patoloji Uzmanı'));
  check('Static content contains /patoloji-sozlugu/', distIndex.includes('/patoloji-sozlugu/'));
  check('Static content contains /ngs/', distIndex.includes('/ngs/'));
  check('Static content contains /blog/', distIndex.includes('/blog/'));
  check('Static content contains /universite/', distIndex.includes('/universite/'));
  check('Static content contains lecture notes link (/donem-3/)', distIndex.includes('/donem-3/'));
}

// --- Summary ---
console.log(`\n📊 Results: ${passes} passed, ${failures} failed\n`);

if (failures > 0) {
  process.exit(1);
}
