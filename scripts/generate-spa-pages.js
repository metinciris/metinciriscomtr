/**
 * Build-time static page generator.
 *
 * In addition to the existing SPA route copies, this script:
 * - downloads every open GitHub Issue carrying the Blog label;
 * - writes /blog/posts.json for the React page;
 * - writes crawlable /blog/, /blog/sayfa/N/ and /blog/<title-slug>/ HTML;
 * - gives every article its own metadata and BlogPosting JSON-LD;
 * - adds all blog URLs to sitemap.xml.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const indexPath = join(distDir, 'index.html');
const registryPath = join(rootDir, 'src', 'core', 'data', 'registry.ts');

const SITE_URL = (process.env.SITE_URL || 'https://metinciris.com.tr').replace(/\/+$/, '');
const POSTS_PER_PAGE = positiveInteger(process.env.BLOG_POSTS_PER_PAGE, 12);
const BLOG_LABEL = process.env.BLOG_LABEL || 'Blog';
const [workflowOwner, workflowRepo] = (process.env.GITHUB_REPOSITORY || '/').split('/');
const REPO_OWNER =
  process.env.BLOG_REPO_OWNER ||
  process.env.VITE_GITHUB_REPO_OWNER ||
  workflowOwner ||
  'metinciris';
const REPO_NAME =
  process.env.BLOG_REPO_NAME ||
  process.env.VITE_GITHUB_REPO_NAME ||
  workflowRepo ||
  'metinciriscomtr';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function ensureBuildExists() {
  if (!existsSync(indexPath)) {
    throw new Error('dist/index.html bulunamadı. Önce Vite build çalıştırılmalıdır.');
  }
  if (!existsSync(registryPath)) {
    throw new Error('src/core/data/registry.ts bulunamadı.');
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value = '') {
  return escapeHtml(value);
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeJsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function stripMarkdown(value = '') {
  return String(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/[*_~]+/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;

  const candidate = text.slice(0, maxLength + 1);
  const lastSpace = candidate.lastIndexOf(' ');
  return `${candidate.slice(0, lastSpace > maxLength * 0.55 ? lastSpace : maxLength).trim()}…`;
}

function makeExcerpt(value, maxLength = 260) {
  return truncateAtWord(stripMarkdown(value), maxLength);
}

function slugifyTitle(title, issueNumber) {
  const base = String(title || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ç]/g, 'c')
    .replace(/[ğ]/g, 'g')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ş]/g, 's')
    .replace(/[ü]/g, 'u')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' ve ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 90)
    .replace(/-+$/g, '');

  return `${base || 'blog-yazisi'}-${issueNumber}`;
}

function sanitizeRenderedHtml(value = '') {
  return String(value)
    .replace(
      /<(script|style|iframe|object|embed|form|textarea|select)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      '',
    )
    .replace(/<(input|button|meta|link|base)\b[^>]*\/?\s*>/gi, '')
    .replace(/\s(?:on\w+|srcdoc|style)\s*=\s*(["'])[\s\S]*?\1/gi, '')
    .replace(/\s(?:on\w+|srcdoc|style)\s*=\s*[^\s>]+/gi, '')
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, ' $1="#"')
    .replace(/\s(href|src)\s*=\s*(["'])\s*data:text\/html[\s\S]*?\2/gi, ' $1="#"');
}

function renderPlainBody(value = '') {
  return String(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function labelsFromIssue(issue) {
  return (issue.labels || [])
    .map((label) => (typeof label === 'string' ? label : label?.name || ''))
    .filter(Boolean);
}

function normalizeIssue(issue) {
  const body = issue.body || '';
  const bodyText = issue.body_text || stripMarkdown(body);
  const bodyHtml = sanitizeRenderedHtml(
    issue.body_html || renderPlainBody(bodyText || body),
  );
  const slug = slugifyTitle(issue.title, issue.number);

  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body,
    bodyText,
    bodyHtml,
    excerpt: makeExcerpt(bodyText || body),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    htmlUrl: issue.html_url,
    labels: labelsFromIssue(issue),
    author: issue.user?.login || 'metinciris',
    slug,
    path: `/blog/${slug}/`,
  };
}

async function fetchJson(url, options, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        const detail = remaining === '0' ? ' GitHub API kotası doldu.' : '';
        throw new Error(`GitHub API ${response.status}: ${response.statusText}.${detail}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 750));
      }
    }
  }

  throw lastError;
}

async function loadGitHubIssues() {
  const fixturePath = process.env.BLOG_ISSUES_FIXTURE;
  if (fixturePath) {
    const fixture = JSON.parse(readFileSync(resolve(fixturePath), 'utf8'));
    if (!Array.isArray(fixture)) {
      throw new Error('BLOG_ISSUES_FIXTURE bir JSON dizisi olmalıdır.');
    }
    return fixture;
  }

  const allIssues = [];
  const headers = {
    Accept: 'application/vnd.github.full+json',
    'X-GitHub-Api-Version': '2026-03-10',
    'User-Agent': `${REPO_OWNER}-${REPO_NAME}-blog-builder`,
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  for (let page = 1; page <= 50; page += 1) {
    const url = new URL(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`);
    url.searchParams.set('labels', BLOG_LABEL);
    url.searchParams.set('state', 'open');
    url.searchParams.set('sort', 'created');
    url.searchParams.set('direction', 'desc');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));

    const pageIssues = await fetchJson(url, { headers });
    if (!Array.isArray(pageIssues)) {
      throw new Error('GitHub Issues API beklenmeyen bir yanıt verdi.');
    }

    allIssues.push(...pageIssues.filter((issue) => !issue.pull_request));
    if (pageIssues.length < 100) break;
  }

  return allIssues;
}

function parseRegistry(content) {
  const pages = {};
  const entryRegex = /(\w+|'[\w-]+'|"[\w-]+"):\s*\{([\s\S]*?)\},/g;
  let match;

  // Keep compatibility with the repository's existing, flat PAGE_REGISTRY format.
  while ((match = entryRegex.exec(content)) !== null) {
    const id = match[1].replace(/['"]/g, '');
    const body = match[2];
    const readString = (key) => {
      const field = body.match(new RegExp(`${key}:\\s*(['"])([\\s\\S]*?)\\1`));
      return field ? field[2].replace(/\\(['"\\])/g, '$1') : '';
    };

    const slug = readString('slug');
    const title = readString('title');
    if (!title) continue;

    const priorityMatch = body.match(/priority:\s*([\d.]+)/);
    const noindexMatch = body.match(/noindex:\s*(true|false)/);

    pages[id] = {
      slug,
      title,
      description: readString('description'),
      navGroup: readString('navGroup'),
      lastmod: readString('lastmod') || new Date().toISOString().slice(0, 10),
      priority: priorityMatch ? Number.parseFloat(priorityMatch[1]) : 0.5,
      changefreq: readString('changefreq') || 'monthly',
      noindex: noindexMatch ? noindexMatch[1] === 'true' : false,
    };
  }

  return pages;
}

function loadPatolojiSozluguFaqs() {
  const filePath = join(rootDir, 'src', 'data', 'patolojiSozluguData.ts');
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf8');
  const faqs = [];
  const faqRegex = /\{\s*question:\s*(["'])([\s\S]*?)\1\s*,\s*answer:\s*(["'])([\s\S]*?)\3\s*\}/g;
  let match;
  while ((match = faqRegex.exec(content)) !== null) {
    faqs.push({
      question: match[2].trim(),
      answer: stripMarkdown(match[4].trim()),
    });
  }
  return faqs;
}

function removeTagByAttribute(html, tag, attribute, value) {
  const pattern = new RegExp(
    `<${tag}\\b(?=[^>]*\\b${escapeRegExp(attribute)}\\s*=\\s*["']${escapeRegExp(value)}["'])[^>]*>\\s*`,
    'gi',
  );
  return html.replace(pattern, '');
}

function stripManagedMetadata(html, { removeJsonLd = false } = {}) {
  let result = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/i, '');

  const metaPairs = [
    ['name', 'description'],
    ['name', 'robots'],
    ['name', 'twitter:card'],
    ['name', 'twitter:title'],
    ['name', 'twitter:description'],
    ['name', 'twitter:url'],
    ['property', 'og:title'],
    ['property', 'og:description'],
    ['property', 'og:url'],
    ['property', 'og:type'],
    ['property', 'article:published_time'],
    ['property', 'article:modified_time'],
    ['property', 'article:author'],
    ['property', 'article:tag'],
  ];

  metaPairs.forEach(([attribute, value]) => {
    result = removeTagByAttribute(result, 'meta', attribute, value);
  });

  ['canonical', 'prev', 'next'].forEach((rel) => {
    result = removeTagByAttribute(result, 'link', 'rel', rel);
  });
  result = removeTagByAttribute(result, 'link', 'hreflang', 'tr');
  result = removeTagByAttribute(result, 'link', 'hreflang', 'x-default');

  if (removeJsonLd) {
    result = result.replace(
      /<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>\s*/gi,
      '',
    );
  }

  return result;
}

function injectMetadata(
  sourceHtml,
  {
    title,
    description,
    canonicalPath,
    type = 'website',
    noindex = false,
    publishedAt,
    updatedAt,
    tags = [],
    previousPath,
    nextPath,
    structuredData,
  },
) {
  let html = stripManagedMetadata(sourceHtml, {
    removeJsonLd: Boolean(structuredData),
  });
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const cleanDescription = truncateAtWord(description || '', 158);
  const lines = [
    '<!-- generated-page-meta:start -->',
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(cleanDescription)}">`,
    `<meta name="robots" content="${
      noindex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    }">`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`,
    `<link rel="alternate" hreflang="tr" href="${escapeHtml(canonicalUrl)}">`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(canonicalUrl)}">`,
    `<meta property="og:type" content="${escapeHtml(type)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(cleanDescription)}">`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(cleanDescription)}">`,
    `<meta name="twitter:url" content="${escapeHtml(canonicalUrl)}">`,
  ];

  if (previousPath) {
    lines.push(`<link rel="prev" href="${escapeHtml(`${SITE_URL}${previousPath}`)}">`);
  }
  if (nextPath) {
    lines.push(`<link rel="next" href="${escapeHtml(`${SITE_URL}${nextPath}`)}">`);
  }

  if (type === 'article') {
    if (publishedAt) {
      lines.push(
        `<meta property="article:published_time" content="${escapeHtml(publishedAt)}">`,
      );
    }
    if (updatedAt) {
      lines.push(
        `<meta property="article:modified_time" content="${escapeHtml(updatedAt)}">`,
      );
    }
    lines.push('<meta property="article:author" content="Prof. Dr. Metin Çiriş">');
    tags.forEach((tag) => {
      lines.push(`<meta property="article:tag" content="${escapeHtml(tag)}">`);
    });
  }

  if (structuredData) {
    lines.push(
      `<script id="blog-structured-data" type="application/ld+json">${safeJsonForHtml(
        structuredData,
      )}</script>`,
    );
  }

  lines.push('<!-- generated-page-meta:end -->');
  const block = `${lines.join('\n')}\n`;

  if (!/<\/head>/i.test(html)) {
    throw new Error('dist/index.html içinde </head> bulunamadı.');
  }
  return html.replace(/<\/head>/i, `${block}</head>`);
}

function injectRoot(sourceHtml, staticContent) {
  const emptyRoot = /<div\s+id=["']root["'][^>]*>([\s\S]*?)<\/div>/i;
  if (!emptyRoot.test(sourceHtml)) {
    throw new Error('dist/index.html içinde #root öğesi bulunamadı.');
  }
  return sourceHtml.replace(emptyRoot, `<div id="root">${staticContent}</div>`);
}

function writeRoute(routePath, html) {
  const clean = String(routePath || '').replace(/^\/+|\/+$/g, '');
  const outputDir = clean ? join(distDir, clean) : distDir;
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'index.html'), html, 'utf8');
}

function pagePath(page) {
  return page <= 1 ? '/blog/' : `/blog/sayfa/${page}/`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function visiblePageNumbers(currentPage, totalPages) {
  const values = new Set([
    1,
    totalPages,
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ]);
  return [...values]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

function renderStaticPagination(currentPage, totalPages) {
  if (totalPages <= 1) return '';

  const numbers = visiblePageNumbers(currentPage, totalPages);
  const items = [];

  if (currentPage > 1) {
    items.push(
      `<a href="${pagePath(currentPage - 1)}" class="inline-flex min-w-10 h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700">Önceki</a>`,
    );
  }

  numbers.forEach((page, index) => {
    const previous = numbers[index - 1];
    if (index > 0 && page - previous > 1) {
      items.push('<span class="px-1 text-gray-400" aria-hidden="true">…</span>');
    }
    const active = page === currentPage;
    items.push(
      `<a href="${pagePath(page)}"${
        active ? ' aria-current="page"' : ''
      } class="inline-flex min-w-10 h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium ${
        active
          ? 'border-[#27AE60] bg-[#27AE60] text-white'
          : 'border-gray-200 bg-white text-gray-700'
      }">${page}</a>`,
    );
  });

  if (currentPage < totalPages) {
    items.push(
      `<a href="${pagePath(currentPage + 1)}" class="inline-flex min-w-10 h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700">Sonraki</a>`,
    );
  }

  return `<nav class="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Blog sayfaları">${items.join(
    '\n',
  )}</nav>`;
}

function renderStaticList(posts, currentPage, totalPages) {
  const cards = posts
    .map((post) => {
      const visibleLabels = post.labels.filter(
        (label) => label.toLocaleLowerCase('tr-TR') !== 'blog',
      );
      const labels = visibleLabels.length
        ? `<div class="flex flex-wrap gap-2 mb-4">${visibleLabels
            .map(
              (label) =>
                `<span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">${escapeHtml(
                  label,
                )}</span>`,
            )
            .join('')}</div>`
        : '';

      return `<article class="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
  <div class="p-6 flex-1 flex flex-col">
    ${labels}
    <h2 class="text-xl font-bold mb-3 text-gray-900 line-clamp-2"><a href="${escapeHtml(
      post.path,
    )}" class="hover:text-[#27AE60] transition-colors">${escapeHtml(post.title)}</a></h2>
    <p class="text-gray-600 mb-4 line-clamp-6 text-sm leading-relaxed">${escapeHtml(
      post.excerpt || 'Yazının tamamını okumak için devam edin.',
    )}</p>
    <div class="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3 text-sm text-gray-500">
      <time datetime="${escapeHtml(post.createdAt)}">${escapeHtml(formatDate(post.createdAt))}</time>
      <a href="${escapeHtml(post.path)}" class="flex shrink-0 items-center gap-1 text-[#27AE60] font-medium" aria-label="${escapeHtml(
        `${post.title} yazısını oku`,
      )}">Devamını Oku →</a>
    </div>
  </div>
</article>`;
    })
    .join('\n');

  return `<main class="container mx-auto px-4 py-8 max-w-none">
  <div class="bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white p-8 md:p-12 mb-8 rounded-xl shadow-lg">
    <h1 class="text-white mb-4 text-4xl font-bold">Blog</h1>
    <p class="text-white/90 max-w-3xl text-lg">Blog yazıları bireysel yorum içermektedir. Tanı veya raporlama için kullanılmaz.</p>
  </div>
  <div class="mb-8">
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <label class="sr-only" for="static-blog-search">Blog yazılarında ara</label>
      <input id="static-blog-search" type="search" placeholder="Blog yazılarında ara..." class="w-full rounded-md border border-gray-200 px-4 py-2" disabled>
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</div>
  <div class="mt-6 text-center text-sm text-gray-500">Sayfa ${currentPage} / ${totalPages}</div>
  ${renderStaticPagination(currentPage, totalPages)}
</main>`;
}

function renderStaticArticle(post, olderPost, newerPost) {
  const visibleLabels = post.labels.filter(
    (label) => label.toLocaleLowerCase('tr-TR') !== 'blog',
  );
  const labels = visibleLabels.length
    ? `<div class="flex flex-wrap gap-2 mb-5">${visibleLabels
        .map(
          (label) =>
            `<span class="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25">${escapeHtml(
              label,
            )}</span>`,
        )
        .join('')}</div>`
    : '';
  const wordCount = post.bodyText.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const older = olderPost
    ? `<a href="${escapeHtml(
        olderPost.path,
      )}" class="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[#27AE60] hover:shadow-md">
        <span aria-hidden="true">←</span><span><span class="block text-xs font-medium uppercase tracking-wide text-gray-500">Önceki yazı</span><span class="mt-1 block font-semibold text-gray-900">${escapeHtml(
          olderPost.title,
        )}</span></span></a>`
    : '<span></span>';
  const newer = newerPost
    ? `<a href="${escapeHtml(
        newerPost.path,
      )}" class="group flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-5 text-right transition-all hover:border-[#27AE60] hover:shadow-md">
        <span><span class="block text-xs font-medium uppercase tracking-wide text-gray-500">Sonraki yazı</span><span class="mt-1 block font-semibold text-gray-900">${escapeHtml(
          newerPost.title,
        )}</span></span><span aria-hidden="true">→</span></a>`
    : '';

  return `<main class="container mx-auto px-4 py-8 max-w-none">
  <nav class="mb-5" aria-label="İçerik yolu"><ol class="flex flex-wrap items-center gap-2 text-sm text-gray-500">
    <li><a href="/">Ana Sayfa</a></li><li aria-hidden="true">/</li><li><a href="/blog/">Blog</a></li><li aria-hidden="true">/</li><li aria-current="page">${escapeHtml(
      post.title,
    )}</li>
  </ol></nav>
  <header class="bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white p-8 md:p-12 mb-8 rounded-xl shadow-lg">
    ${labels}
    <h1 class="text-white text-3xl md:text-4xl font-bold leading-tight mb-5">${escapeHtml(
      post.title,
    )}</h1>
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
      <time datetime="${escapeHtml(post.createdAt)}">${escapeHtml(formatDate(post.createdAt))}</time>
      <span>Yaklaşık ${readingMinutes} dakika</span>
    </div>
  </header>
  <article class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-10">
    <div class="blog-content-markdown max-w-none">${post.bodyHtml}</div>
  </article>
  <p class="mt-5 text-sm text-gray-500">Bu yazı bireysel yorum ve eğitim amaçlıdır; tanı veya raporlama amacıyla kullanılamaz.</p>
  <nav class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Blog yazıları arasında gezinme">${older}${newer}</nav>
  <div class="mt-8 flex justify-center"><a href="/blog/" class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm">← Tüm blog yazıları</a></div>
</main>`;
}

function blogListStructuredData(posts, canonicalPath) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Patoloji Blog',
    description:
      'Tıbbi patoloji, moleküler patoloji, güncel kılavuzlar ve bilimsel gelişmeler üzerine yazılar.',
    url: `${SITE_URL}${canonicalPath}`,
    inLanguage: 'tr-TR',
    publisher: {
      '@type': 'Person',
      name: 'Prof. Dr. Metin Çiriş',
      url: SITE_URL,
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}${post.path}`,
      datePublished: post.createdAt,
      dateModified: post.updatedAt,
    })),
  };
}

function blogPostStructuredData(post) {
  const visibleLabels = post.labels.filter(
    (label) => label.toLocaleLowerCase('tr-TR') !== 'blog',
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: truncateAtWord(post.excerpt || post.bodyText, 158),
    url: `${SITE_URL}${post.path}`,
    mainEntityOfPage: `${SITE_URL}${post.path}`,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: 'tr-TR',
    author: {
      '@type': 'Person',
      name: 'Prof. Dr. Metin Çiriş',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: 'Prof. Dr. Metin Çiriş',
      url: SITE_URL,
    },
    keywords: visibleLabels.join(', '),
    isPartOf: {
      '@type': 'Blog',
      name: 'Patoloji Blog',
      url: `${SITE_URL}/blog/`,
    },
  };
}

function addSitemapEntry(entries, path, lastmod, changefreq, priority) {
  const url = `${SITE_URL}${path}`;
  entries.set(url, {
    url,
    lastmod: String(lastmod || new Date().toISOString()).slice(0, 10),
    changefreq,
    priority,
  });
}

function writeSitemap(entries) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  [...entries.values()].forEach((entry) => {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(entry.url)}</loc>`);
    lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
    lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
    lines.push(`    <priority>${Number(entry.priority).toFixed(1)}</priority>`);
    lines.push('  </url>');
  });
  lines.push('</urlset>');

  writeFileSync(join(distDir, 'sitemap.xml'), `${lines.join('\n')}\n`, 'utf8');
}

function updateServiceWorkerVersion() {
  const swPath = join(distDir, 'sw.js');
  if (!existsSync(swPath)) return;

  let swContent = readFileSync(swPath, 'utf8');
  const buildId = Date.now();
  swContent = swContent.replace(/metinciris-shell-v[^'"`]+/g, `metinciris-shell-v${buildId}`);
  writeFileSync(swPath, swContent, 'utf8');
}

async function main() {
  ensureBuildExists();
  const rawIndexContent = readFileSync(indexPath, 'utf8');
  const registry = parseRegistry(readFileSync(registryPath, 'utf8'));
  const sitemapEntries = new Map();

  console.log('SPA sayfaları ve statik SEO içerikleri üretiliyor...');

  // --- Inline Render-Blocking CSS ---
  let indexContent = rawIndexContent;
  try {
    const assetsDir = join(distDir, 'assets');
    if (existsSync(assetsDir)) {
      const cssFileName = readdirSync(assetsDir).find(f => f.startsWith('index-') && f.endsWith('.css'));
      if (cssFileName) {
        const cssContent = readFileSync(join(assetsDir, cssFileName), 'utf8');
        indexContent = indexContent.replace(
          /<link rel="stylesheet"[^>]*href=["'][^"']*assets\/index-[^"']+\.css["'][^>]*>/i,
          `<style>${cssContent}</style>`
        );
        console.log(`Critical CSS (${cssFileName}) inline olarak eklendi.`);
      }
    }
  } catch (err) {
    console.warn('CSS inline ekleme atlandı:', err.message);
  }

  // --- Inject Site-wide JSON-LD (Person + Organization + WebSite) ---
  const globalSiteGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': 'https://metinciris.com.tr/#kisi',
        name: 'İbrahim Metin Çiriş',
        alternateName: 'Metin Çiriş',
        honorificPrefix: 'Prof. Dr.',
        jobTitle: 'Tıbbi Patoloji Uzmanı',
        url: 'https://metinciris.com.tr/',
        image: 'https://metinciris.com.tr/img/metinciris.avif',
        worksFor: { '@id': 'https://metinciris.com.tr/#kurum' },
        affiliation: { '@id': 'https://metinciris.com.tr/#kurum' },
        sameAs: [
          'https://orcid.org/0000-0002-5619-4989',
          'https://scholar.google.com.tr/citations?user=QZkewskAAAAJ&hl=tr',
        ],
      },
      {
        '@type': 'CollegeOrUniversity',
        '@id': 'https://metinciris.com.tr/#kurum',
        name: 'Süleyman Demirel Üniversitesi Tıp Fakültesi Tıbbi Patoloji Anabilim Dalı',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Isparta',
          addressCountry: 'TR',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://metinciris.com.tr/#site',
        url: 'https://metinciris.com.tr/',
        name: 'Prof. Dr. İbrahim Metin Çiriş — Tıbbi Patoloji',
        inLanguage: 'tr',
        publisher: { '@id': 'https://metinciris.com.tr/#kisi' },
      },
    ],
  };

  const globalJsonLdTag = `<script type="application/ld+json">\n${safeJsonForHtml(globalSiteGraph)}\n</script>`;
  indexContent = indexContent.replace(/<\/head>/i, `${globalJsonLdTag}\n</head>`);

  for (const [id, meta] of Object.entries(registry)) {
    if (!meta.slug && id !== 'home') continue;
    const canonicalPath = meta.slug ? `/${meta.slug}/` : '/';
    const routePath = meta.slug || '';
    let html = injectMetadata(indexContent, {
      title: meta.title,
      description: meta.description,
      canonicalPath,
      noindex: meta.noindex,
    });

    if (id === 'patoloji-sozlugu' || meta.slug === 'patoloji-sozlugu') {
      const faqs = loadPatolojiSozluguFaqs();
      if (faqs.length > 0) {
        const faqStructuredData = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        };
        const faqTag = `<script type="application/ld+json">\n${safeJsonForHtml(faqStructuredData)}\n</script>`;
        html = html.replace(/<\/head>/i, `${faqTag}\n</head>`);
      }
    }

    writeRoute(routePath, html);

    if (!meta.noindex) {
      addSitemapEntry(
        sitemapEntries,
        canonicalPath,
        meta.lastmod,
        meta.changefreq,
        meta.priority,
      );
    }
  }

  const rawIssues = await loadGitHubIssues();
  const posts = rawIssues
    .filter((issue) => !issue.pull_request)
    .map(normalizeIssue)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        b.number - a.number,
    );

  if (posts.length === 0 && process.env.BLOG_ALLOW_EMPTY !== 'true') {
    throw new Error(
      `"${BLOG_LABEL}" etiketli açık blog issue'su bulunamadı. Boş blog dağıtımı engellendi.`,
    );
  }

  const feed = {
    version: 1,
    generatedAt: new Date().toISOString(),
    postsPerPage: POSTS_PER_PAGE,
    posts,
  };
  const blogDir = join(distDir, 'blog');
  mkdirSync(blogDir, { recursive: true });
  writeFileSync(join(blogDir, 'posts.json'), `${JSON.stringify(feed)}\n`, 'utf8');

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const newestUpdate = posts[0]?.updatedAt || new Date().toISOString();

  for (let page = 1; page <= totalPages; page += 1) {
    const start = (page - 1) * POSTS_PER_PAGE;
    const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);
    const canonicalPath = pagePath(page);
    const title =
      page === 1
        ? 'Patoloji Blog | Prof Dr Metin Çiriş'
        : `Patoloji Blog - Sayfa ${page} | Prof Dr Metin Çiriş`;
    const metadataHtml = injectMetadata(indexContent, {
      title,
      description:
        'Tıbbi patoloji, moleküler patoloji, güncel kılavuzlar ve bilimsel gelişmeler üzerine yazılar.',
      canonicalPath,
      previousPath: page > 1 ? pagePath(page - 1) : null,
      nextPath: page < totalPages ? pagePath(page + 1) : null,
      structuredData: blogListStructuredData(pagePosts, canonicalPath),
    });
    const pageHtml = injectRoot(
      metadataHtml,
      renderStaticList(pagePosts, page, totalPages),
    );
    writeRoute(page === 1 ? 'blog' : `blog/sayfa/${page}`, pageHtml);

    const pageLastmod = pagePosts.reduce(
      (latest, post) =>
        new Date(post.updatedAt).getTime() > new Date(latest).getTime()
          ? post.updatedAt
          : latest,
      pagePosts[0]?.updatedAt || newestUpdate,
    );
    addSitemapEntry(
      sitemapEntries,
      canonicalPath,
      pageLastmod,
      page === 1 ? 'daily' : 'weekly',
      page === 1 ? 0.8 : 0.5,
    );
  }

  posts.forEach((post, index) => {
    const newerPost = index > 0 ? posts[index - 1] : null;
    const olderPost = index < posts.length - 1 ? posts[index + 1] : null;
    const visibleLabels = post.labels.filter(
      (label) => label.toLocaleLowerCase('tr-TR') !== 'blog',
    );
    const description =
      truncateAtWord(post.excerpt || post.bodyText, 158) ||
      'Prof. Dr. Metin Çiriş patoloji blog yazısı.';
    const metadataHtml = injectMetadata(indexContent, {
      title: `${post.title} | Prof Dr Metin Çiriş`,
      description,
      canonicalPath: post.path,
      type: 'article',
      publishedAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: visibleLabels,
      previousPath: olderPost?.path || null,
      nextPath: newerPost?.path || null,
      structuredData: blogPostStructuredData(post),
    });
    const articleHtml = injectRoot(
      metadataHtml,
      renderStaticArticle(post, olderPost, newerPost),
    );
    writeRoute(post.path, articleHtml);
    addSitemapEntry(sitemapEntries, post.path, post.updatedAt, 'monthly', 0.7);
  });

  writeSitemap(sitemapEntries);
  writeFileSync(
    join(distDir, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    'utf8',
  );
  writeFileSync(join(distDir, '404.html'), indexContent, 'utf8');
  updateServiceWorkerVersion();

  // --- Search Index Generation ---
  const searchIndex = [];
  
  for (const [id, meta] of Object.entries(registry)) {
    if (meta.noindex) continue;
    let type = 'Sayfa';
    if (meta.slug && (meta.slug.includes('raporlama') || meta.slug.includes('hesaplama') || meta.slug.includes('sayaci'))) type = 'Araç';
    else if (meta.slug === 'patoloji-sozlugu') type = 'Sözlük';
    else if (meta.slug === 'ngs') type = 'Moleküler';
    else if (meta.slug === 'makale' || meta.slug === 'makale-takip') type = 'Radar';
    
    searchIndex.push({
      title: meta.title.replace(' | Prof Dr Metin Çiriş', '').replace(' | Prof. Dr. Metin Çiriş', '').trim(),
      description: meta.description,
      path: meta.slug ? `/${meta.slug}/` : '/',
      type: type
    });
  }

  posts.forEach(post => {
    searchIndex.push({
      title: post.title,
      description: post.excerpt,
      path: post.path,
      type: 'Blog'
    });
  });

  writeFileSync(join(distDir, 'search-index.json'), JSON.stringify(searchIndex), 'utf8');

  // --- RSS Generation (Patoloji Radarı) ---
  const rssLines = [
    '<?xml version="1.0" encoding="UTF-8" ?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>Patoloji Radarı | Prof. Dr. Metin Çiriş</title>`,
    `    <link>${SITE_URL}/makale-takip/</link>`,
    `    <description>Güncel patoloji literatürü, makale özetleri ve bilimsel haberler.</description>`,
    `    <language>tr-tr</language>`,
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${SITE_URL}/patoloji-radari/rss.xml" rel="self" type="application/rss+xml" />`
  ];
  
  posts.forEach(post => {
    rssLines.push('    <item>');
    rssLines.push(`      <title>${escapeXml(post.title)}</title>`);
    rssLines.push(`      <link>${SITE_URL}${post.path}</link>`);
    rssLines.push(`      <guid isPermaLink="true">${SITE_URL}${post.path}</guid>`);
    rssLines.push(`      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>`);
    rssLines.push(`      <description>${escapeXml(post.excerpt)}</description>`);
    rssLines.push('    </item>');
  });
  
  rssLines.push('  </channel>');
  rssLines.push('</rss>');

  const radarDir = join(distDir, 'patoloji-radari');
  mkdirSync(radarDir, { recursive: true });
  writeFileSync(join(radarDir, 'rss.xml'), `${rssLines.join('\n')}\n`, 'utf8');

  // --- LLMs.txt Generation for AI Agents (Grouped by Hubs) ---
  const llmsLines = [
    '# Prof. Dr. İbrahim Metin Çiriş — Tıbbi Patoloji & Dijital Patoloji',
    '',
    '> SDÜ Tıp Fakültesi Tıbbi Patoloji AD. Tanısal ve moleküler patoloji',
    '> araçları, sinoptik raporlama modülleri ve eğitim materyalleri.',
    '',
  ];

  const GROUPS = [
    { key: 'raporlama', title: '## Tanısal & Raporlama Araçları' },
    { key: 'akademik', title: '## Akademik & Araştırma Kaynakları' },
    { key: 'egitim', title: '## Eğitim Materyalleri' },
    { key: 'hastalar', title: '## Hasta Bilgilendirme' },
    { key: 'araclar', title: '## Yardımcı Araçlar' },
  ];

  const handledIds = new Set();

  GROUPS.forEach(group => {
    const groupItems = Object.entries(registry).filter(([id, meta]) => !meta.noindex && meta.slug && meta.navGroup === group.key);
    if (groupItems.length > 0) {
      llmsLines.push(group.title);
      groupItems.forEach(([id, meta]) => {
        handledIds.add(id);
        const titleClean = meta.title.split('|')[0].trim();
        llmsLines.push(`- [${titleClean}](${SITE_URL}/${meta.slug}/): ${meta.description}`);
      });
      llmsLines.push('');
    }
  });

  // Optional section for ungrouped pages (food menus, countdowns, etc.)
  const optionalItems = Object.entries(registry).filter(([id, meta]) => !meta.noindex && meta.slug && !handledIds.has(id));
  if (optionalItems.length > 0) {
    llmsLines.push('## Optional');
    optionalItems.forEach(([id, meta]) => {
      const titleClean = meta.title.split('|')[0].trim();
      llmsLines.push(`- [${titleClean}](${SITE_URL}/${meta.slug}/): ${meta.description}`);
    });
    llmsLines.push('');
  }

  writeFileSync(join(distDir, 'llms.txt'), `${llmsLines.join('\n')}\n`, 'utf8');

  console.log(
    `Tamamlandı: ${posts.length} blog yazısı, search-index.json, llms.txt, RSS ve sitemap üretildi.`,
  );
}

main().catch((error) => {
  console.error('\nBlog/SEO sayfa üretimi başarısız oldu:');
  console.error(error);
  process.exitCode = 1;
});
