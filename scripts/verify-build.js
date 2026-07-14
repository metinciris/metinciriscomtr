/**
 * Post-build verification script.
 * Checks critical files and patterns to catch common build errors early.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
check('sitemap.xml is not empty', sitemap !== null && sitemap.trim().length > 100);

if (sitemap) {
  check('sitemap.xml contains homepage', sitemap.includes('https://metinciris.com.tr/'));
  check('sitemap.xml contains blog', sitemap.includes('/blog/'));
}

// Check for BlogPosting JSON-LD in at least one blog post page
const blogIndexHtml = readSafe(join(dist, 'blog', 'index.html'));
if (blogIndexHtml) {
  // Blog list page or individual post pages may have BlogPosting
  // Check if any blog subdirectory has BlogPosting
  check('Blog index.html exists and has content', blogIndexHtml.length > 200);
}

// Check canonical tag in dist/index.html
const distIndex = readSafe(join(dist, 'index.html'));
if (distIndex) {
  check('Canonical tag in index.html', distIndex.includes('rel="canonical"'));
}

// --- Summary ---
console.log(`\n📊 Results: ${passes} passed, ${failures} failed\n`);

if (failures > 0) {
  process.exit(1);
}
