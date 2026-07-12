import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  Tag,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';

import { PageContainer } from '../components/PageContainer';
import { Input } from '../components/ui/input';
import './Blog.css';

const SITE_URL = 'https://metinciris.com.tr';
const DEFAULT_POSTS_PER_PAGE = 12;
const BLOG_DESCRIPTION =
  'Tıbbi patoloji, moleküler patoloji, güncel kılavuzlar ve bilimsel gelişmeler üzerine yazılar.';

type RouteState =
  | { type: 'list'; page: number }
  | { type: 'post'; slug: string };

interface BlogPost {
  id: number;
  number: number;
  title: string;
  body: string;
  bodyText: string;
  bodyHtml?: string;
  excerpt: string;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  labels: string[];
  author: string;
  slug: string;
  path: string;
}

interface BlogFeed {
  version: number;
  generatedAt: string;
  postsPerPage: number;
  posts: BlogPost[];
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  body_text?: string | null;
  body_html?: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  labels: Array<string | { name?: string }>;
  user: { login?: string } | null;
  pull_request?: unknown;
}

function parseRoute(pathname = window.location.pathname): RouteState {
  const parts = pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);

  if (parts[0] !== 'blog' || parts.length === 1) {
    return { type: 'list', page: 1 };
  }

  if (parts[1] === 'sayfa') {
    const parsedPage = Number.parseInt(parts[2] || '1', 10);
    return {
      type: 'list',
      page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    };
  }

  try {
    return { type: 'post', slug: decodeURIComponent(parts.slice(1).join('/')) };
  } catch {
    return { type: 'post', slug: parts.slice(1).join('/') };
  }
}

function slugifyTitle(title: string, issueNumber: number): string {
  const base = title
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

function stripMarkdown(value: string): string {
  return value
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
    .replace(/\s+/g, ' ')
    .trim();
}

function makeExcerpt(bodyText: string, maxLength = 260): string {
  const plain = stripMarkdown(bodyText);
  if (plain.length <= maxLength) return plain;

  const shortened = plain.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 120 ? lastSpace : maxLength).trim()}…`;
}

function normalizeIssue(issue: GitHubIssue): BlogPost {
  const body = issue.body || '';
  const bodyText = issue.body_text || stripMarkdown(body);
  const slug = slugifyTitle(issue.title, issue.number);
  const labels = issue.labels
    .map((label) => (typeof label === 'string' ? label : label.name || ''))
    .filter(Boolean);

  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body,
    bodyText,
    bodyHtml: issue.body_html || undefined,
    excerpt: makeExcerpt(bodyText),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    htmlUrl: issue.html_url,
    labels,
    author: issue.user?.login || 'metinciris',
    slug,
    path: `/blog/${slug}/`,
  };
}

function isBlogPost(value: unknown): value is BlogPost {
  if (!value || typeof value !== 'object') return false;
  const post = value as Partial<BlogPost>;
  return (
    typeof post.id === 'number' &&
    typeof post.number === 'number' &&
    typeof post.title === 'string' &&
    typeof post.body === 'string' &&
    typeof post.bodyText === 'string' &&
    typeof post.createdAt === 'string' &&
    typeof post.updatedAt === 'string' &&
    typeof post.slug === 'string' &&
    typeof post.path === 'string' &&
    Array.isArray(post.labels)
  );
}

function isBlogFeed(value: unknown): value is BlogFeed {
  if (!value || typeof value !== 'object') return false;
  const feed = value as Partial<BlogFeed>;
  return (
    Array.isArray(feed.posts) &&
    feed.posts.every(isBlogPost) &&
    typeof feed.postsPerPage === 'number'
  );
}

async function fetchGeneratedFeed(): Promise<BlogFeed> {
  const response = await fetch('/blog/posts.json', {
    headers: { Accept: 'application/json' },
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error(`Blog verisi alınamadı: ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isBlogFeed(payload)) {
    throw new Error('Blog verisi beklenen biçimde değil.');
  }

  return payload;
}

async function fetchIssuesDirectly(): Promise<BlogFeed> {
  const repoOwner = import.meta.env.VITE_GITHUB_REPO_OWNER || 'metinciris';
  const repoName = import.meta.env.VITE_GITHUB_REPO_NAME || 'metinciriscomtr';
  const blogLabel = import.meta.env.VITE_BLOG_LABEL || 'Blog';
  const issues: GitHubIssue[] = [];

  for (let page = 1; page <= 20; page += 1) {
    const url = new URL(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues`,
    );
    url.searchParams.set('labels', blogLabel);
    url.searchParams.set('state', 'open');
    url.searchParams.set('sort', 'created');
    url.searchParams.set('direction', 'desc');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.full+json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API hatası: ${response.status}`);
    }

    const pageIssues: unknown = await response.json();
    if (!Array.isArray(pageIssues)) {
      throw new Error('GitHub API yanıtı beklenen biçimde değil.');
    }

    const typedIssues = pageIssues as GitHubIssue[];
    issues.push(...typedIssues.filter((issue) => !issue.pull_request));

    if (typedIssues.length < 100) break;
  }

  const posts = issues
    .map(normalizeIssue)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
        b.number - a.number,
    );

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    postsPerPage: DEFAULT_POSTS_PER_PAGE,
    posts,
  };
}

async function loadBlogFeed(): Promise<BlogFeed> {
  try {
    return await fetchGeneratedFeed();
  } catch (staticError) {
    console.warn('Statik blog verisi kullanılamadı; GitHub API deneniyor.', staticError);
    return fetchIssuesDirectly();
  }
}

function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(
  selector: string,
  attributes: Record<string, string>,
  href: string | null,
) {
  const existing = document.head.querySelector<HTMLLinkElement>(selector);
  if (!href) {
    existing?.remove();
    return;
  }

  const element = existing || document.createElement('link');
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  element.setAttribute('href', href);
  if (!existing) document.head.appendChild(element);
}

function updateStructuredData(data: Record<string, unknown>) {
  let script = document.head.querySelector<HTMLScriptElement>(
    '#blog-structured-data',
  );

  if (!script) {
    script =
      document.head.querySelector<HTMLScriptElement>(
        'script[type="application/ld+json"]',
      ) || document.createElement('script');
    script.id = 'blog-structured-data';
    script.type = 'application/ld+json';
    if (!script.parentNode) document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

function setPageSeo({
  title,
  description,
  canonicalPath,
  type = 'website',
  publishedAt,
  updatedAt,
  tags = [],
  previousPath,
  nextPath,
  noindex = false,
}: {
  title: string;
  description: string;
  canonicalPath: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  updatedAt?: string;
  tags?: string[];
  previousPath?: string | null;
  nextPath?: string | null;
  noindex?: boolean;
}) {
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  document.title = title;
  upsertMeta('meta[name="description"]', { name: 'description' }, description);
  upsertMeta(
    'meta[name="robots"]',
    { name: 'robots' },
    noindex
      ? 'noindex, follow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  );
  upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
  upsertMeta(
    'meta[property="og:description"]',
    { property: 'og:description' },
    description,
  );
  upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
  upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type);
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  upsertMeta(
    'meta[name="twitter:description"]',
    { name: 'twitter:description' },
    description,
  );
  upsertMeta('meta[name="twitter:url"]', { name: 'twitter:url' }, canonicalUrl);
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');

  upsertLink('link[rel="canonical"]', { rel: 'canonical' }, canonicalUrl);
  upsertLink(
    'link[rel="alternate"][hreflang="tr"]',
    { rel: 'alternate', hreflang: 'tr' },
    canonicalUrl,
  );
  upsertLink(
    'link[rel="alternate"][hreflang="x-default"]',
    { rel: 'alternate', hreflang: 'x-default' },
    canonicalUrl,
  );
  upsertLink(
    'link[rel="prev"]',
    { rel: 'prev' },
    previousPath ? `${SITE_URL}${previousPath}` : null,
  );
  upsertLink(
    'link[rel="next"]',
    { rel: 'next' },
    nextPath ? `${SITE_URL}${nextPath}` : null,
  );

  document.head
    .querySelectorAll('meta[data-blog-article-meta="true"]')
    .forEach((element) => element.remove());

  if (type === 'article') {
    const articleMeta = [
      ['article:published_time', publishedAt],
      ['article:modified_time', updatedAt],
      ['article:author', 'Prof. Dr. Metin Çiriş'],
      ...tags.map((tag) => ['article:tag', tag]),
    ].filter((entry): entry is [string, string] => Boolean(entry[1]));

    articleMeta.forEach(([property, content]) => {
      const element = document.createElement('meta');
      element.setAttribute('property', property);
      element.setAttribute('content', content);
      element.dataset.blogArticleMeta = 'true';
      document.head.appendChild(element);
    });
  }
}

function pagePath(page: number): string {
  return page <= 1 ? '/blog/' : `/blog/sayfa/${page}/`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const values = new Set<number>([
    1,
    totalPages,
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ]);

  const pages = [...values]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | string> = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (index > 0 && page - previous > 1) {
      items.push(`ellipsis-${previous}-${page}`);
    }
    items.push(page);
  });

  return items;
}

function Pagination({
  currentPage,
  totalPages,
  searchActive,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  searchActive: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const commonClass =
    'inline-flex min-w-10 h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors';

  const renderControl = (
    page: number,
    label: React.ReactNode,
    ariaLabel: string,
    disabled = false,
  ) => {
    const className = `${commonClass} ${
      disabled
        ? 'border-gray-100 bg-gray-50 text-gray-300 pointer-events-none'
        : 'border-gray-200 bg-white text-gray-700 hover:border-[#27AE60] hover:text-[#27AE60]'
    }`;

    if (searchActive) {
      return (
        <button
          type="button"
          className={className}
          disabled={disabled}
          aria-label={ariaLabel}
          onClick={() => onPageChange(page)}
        >
          {label}
        </button>
      );
    }

    return (
      <a
        className={className}
        href={pagePath(page)}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
      >
        {label}
      </a>
    );
  };

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label="Blog sayfaları"
    >
      {renderControl(
        Math.max(1, currentPage - 1),
        <ChevronLeft size={18} aria-hidden="true" />,
        'Önceki sayfa',
        currentPage === 1,
      )}

      {getVisiblePages(currentPage, totalPages).map((item) => {
        if (typeof item === 'string') {
          return (
            <span key={item} className="px-1 text-gray-400" aria-hidden="true">
              …
            </span>
          );
        }

        const active = item === currentPage;
        if (searchActive) {
          return (
            <button
              type="button"
              key={item}
              onClick={() => onPageChange(item)}
              aria-current={active ? 'page' : undefined}
              className={`${commonClass} ${
                active
                  ? 'border-[#27AE60] bg-[#27AE60] text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-[#27AE60] hover:text-[#27AE60]'
              }`}
            >
              {item}
            </button>
          );
        }

        return (
          <a
            key={item}
            href={pagePath(item)}
            aria-current={active ? 'page' : undefined}
            className={`${commonClass} ${
              active
                ? 'border-[#27AE60] bg-[#27AE60] text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-[#27AE60] hover:text-[#27AE60]'
            }`}
          >
            {item}
          </a>
        );
      })}

      {renderControl(
        Math.min(totalPages, currentPage + 1),
        <ChevronRight size={18} aria-hidden="true" />,
        'Sonraki sayfa',
        currentPage === totalPages,
      )}
    </nav>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-20" role="status" aria-live="polite">
      <div className="w-12 h-12 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin" />
      <span className="sr-only">Blog yazıları yükleniyor…</span>
    </div>
  );
}

function BlogList({
  posts,
  postsPerPage,
  initialPage,
}: {
  posts: BlogPost[];
  postsPerPage: number;
  initialPage: number;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientPage, setClientPage] = useState(initialPage);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('tr-TR');
  const filteredPosts = useMemo(() => {
    if (!normalizedSearch) return posts;

    return posts.filter((post) => {
      const haystack = [post.title, post.bodyText, post.labels.join(' ')]
        .join(' ')
        .toLocaleLowerCase('tr-TR');
      return haystack.includes(normalizedSearch);
    });
  }, [normalizedSearch, posts]);

  useEffect(() => {
    setClientPage(normalizedSearch ? 1 : initialPage);
  }, [initialPage, normalizedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
  const currentPage = Math.min(Math.max(clientPage, 1), totalPages);
  const start = (currentPage - 1) * postsPerPage;
  const visiblePosts = useMemo(
    () => filteredPosts.slice(start, start + postsPerPage),
    [filteredPosts, postsPerPage, start],
  );
  const canonicalPath = pagePath(initialPage);

  useEffect(() => {
    const title =
      initialPage > 1
        ? `Patoloji Blog - Sayfa ${initialPage} | Prof Dr Metin Çiriş`
        : 'Patoloji Blog | Prof Dr Metin Çiriş';

    setPageSeo({
      title,
      description: BLOG_DESCRIPTION,
      canonicalPath,
      previousPath: initialPage > 1 ? pagePath(initialPage - 1) : null,
      nextPath: initialPage < Math.ceil(posts.length / postsPerPage)
        ? pagePath(initialPage + 1)
        : null,
    });

    updateStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Patoloji Blog',
      description: BLOG_DESCRIPTION,
      url: `${SITE_URL}${canonicalPath}`,
      inLanguage: 'tr-TR',
      publisher: {
        '@type': 'Person',
        name: 'Prof. Dr. Metin Çiriş',
        url: SITE_URL,
      },
      blogPost: visiblePosts.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: `${SITE_URL}${post.path}`,
        datePublished: post.createdAt,
        dateModified: post.updatedAt,
      })),
    });
  }, [canonicalPath, initialPage, posts.length, postsPerPage, visiblePosts]);

  const handlePageChange = (page: number) => {
    setClientPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white p-8 md:p-12 mb-8 rounded-xl shadow-lg">
        <h1 className="text-white mb-4 text-4xl font-bold">Blog</h1>
        <p className="text-white/90 max-w-3xl text-lg">
          Blog yazıları bireysel yorum içermektedir. Tanı veya raporlama için kullanılmaz.
        </p>
      </div>

      <div className="mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Blog yazılarında ara..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 w-full"
              aria-label="Blog yazılarında ara"
            />
          </div>
        </div>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">Aramanızla eşleşen sonuç bulunamadı.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePosts.map((post) => {
              const visibleLabels = post.labels.filter(
                (label) => label.toLocaleLowerCase('tr-TR') !== 'blog',
              );

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    {visibleLabels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {visibleLabels.map((label) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium"
                          >
                            <Tag size={10} aria-hidden="true" />
                            {label}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2 className="text-xl font-bold mb-3 text-gray-900 line-clamp-2">
                      <a
                        href={post.path}
                        className="hover:text-[#27AE60] transition-colors"
                      >
                        {post.title}
                      </a>
                    </h2>

                    <p className="text-gray-600 mb-4 line-clamp-6 text-sm leading-relaxed">
                      {post.excerpt || 'Yazının tamamını okumak için devam edin.'}
                    </p>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1 min-w-0">
                        <Calendar size={14} aria-hidden="true" />
                        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                      </div>
                      <a
                        href={post.path}
                        className="flex shrink-0 items-center gap-1 text-[#27AE60] hover:underline font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#27AE60] focus-visible:ring-offset-2 rounded"
                        aria-label={`${post.title} yazısını oku`}
                      >
                        Devamını Oku <ChevronRight size={14} aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            {filteredPosts.length} yazı · Sayfa {currentPage} / {totalPages}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            searchActive={Boolean(normalizedSearch)}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </>
  );
}

function BlogPostDetail({ post, posts }: { post: BlogPost; posts: BlogPost[] }) {
  const index = posts.findIndex((candidate) => candidate.id === post.id);
  const newerPost = index > 0 ? posts[index - 1] : null;
  const olderPost = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null;
  const wordCount = post.bodyText.trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const visibleLabels = useMemo(
    () =>
      post.labels.filter(
        (label) => label.toLocaleLowerCase('tr-TR') !== 'blog',
      ),
    [post.labels],
  );
  const sanitizedBody = useMemo(
    () => DOMPurify.sanitize(post.body.replace(/\r\n/g, '\n')),
    [post.body],
  );
  const description = post.excerpt || makeExcerpt(post.bodyText, 155) || BLOG_DESCRIPTION;

  useEffect(() => {
    setPageSeo({
      title: `${post.title} | Prof Dr Metin Çiriş`,
      description,
      canonicalPath: post.path,
      type: 'article',
      publishedAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: visibleLabels,
      previousPath: olderPost?.path || null,
      nextPath: newerPost?.path || null,
    });

    updateStructuredData({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
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
    });
  }, [description, newerPost?.path, olderPost?.path, post, visibleLabels]);

  return (
    <>
      <nav className="mb-5" aria-label="İçerik yolu">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <li>
            <a href="/" className="hover:text-[#27AE60]">
              Ana Sayfa
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a href="/blog/" className="hover:text-[#27AE60]">
              Blog
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-700 line-clamp-1" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>

      <header className="bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white p-8 md:p-12 mb-8 rounded-xl shadow-lg">
        {visibleLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {visibleLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25"
              >
                <Tag size={11} aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight mb-5">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={16} aria-hidden="true" />
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={16} aria-hidden="true" />
            Yaklaşık {readingMinutes} dakika
          </span>
        </div>
      </header>

      <article className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-10">
        <div className="blog-content-markdown max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {sanitizedBody}
          </ReactMarkdown>
        </div>
      </article>

      <p className="mt-5 text-sm text-gray-500">
        Bu yazı bireysel yorum ve eğitim amaçlıdır; tanı veya raporlama amacıyla kullanılamaz.
      </p>

      <nav
        className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        aria-label="Blog yazıları arasında gezinme"
      >
        {olderPost ? (
          <a
            href={olderPost.path}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-[#27AE60] hover:shadow-md"
          >
            <ArrowLeft
              className="shrink-0 text-[#27AE60] transition-transform group-hover:-translate-x-1"
              size={22}
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Önceki yazı
              </span>
              <span className="mt-1 block font-semibold text-gray-900 line-clamp-2">
                {olderPost.title}
              </span>
            </span>
          </a>
        ) : (
          <span />
        )}

        {newerPost && (
          <a
            href={newerPost.path}
            className="group flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-5 text-right transition-all hover:border-[#27AE60] hover:shadow-md"
          >
            <span className="min-w-0">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Sonraki yazı
              </span>
              <span className="mt-1 block font-semibold text-gray-900 line-clamp-2">
                {newerPost.title}
              </span>
            </span>
            <ArrowRight
              className="shrink-0 text-[#27AE60] transition-transform group-hover:translate-x-1"
              size={22}
              aria-hidden="true"
            />
          </a>
        )}
      </nav>

      <div className="mt-8 flex justify-center">
        <a
          href="/blog/"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-[#27AE60] hover:text-[#27AE60]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Tüm blog yazıları
        </a>
      </div>
    </>
  );
}

function BlogPostNotFound() {
  useEffect(() => {
    const requestedPath = window.location.pathname.endsWith('/')
      ? window.location.pathname
      : `${window.location.pathname}/`;

    setPageSeo({
      title: 'Blog yazısı bulunamadı | Prof Dr Metin Çiriş',
      description: 'Aradığınız blog yazısı bulunamadı.',
      canonicalPath: requestedPath,
      noindex: true,
    });
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Blog yazısı bulunamadı
      </h1>
      <p className="text-gray-600 mb-5">
        Bağlantı değişmiş veya yazı yayından kaldırılmış olabilir.
      </p>
      <a
        href="/blog/"
        className="inline-flex items-center gap-2 rounded-lg bg-[#27AE60] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#219653]"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Blog sayfasına dön
      </a>
    </div>
  );
}

export function Blog() {
  const [route, setRoute] = useState<RouteState>(() => parseRoute());
  const [feed, setFeed] = useState<BlogFeed | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadBlogFeed()
      .then((nextFeed) => {
        if (cancelled) return;
        setFeed(nextFeed);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        console.error('Blog yazıları yüklenemedi.', loadError);
        setError('Blog yazıları şu anda yüklenemedi. Lütfen sayfayı yenileyin.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!feed && !error) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (error || !feed) {
    return (
      <PageContainer>
        <div className="bg-white rounded-xl border border-red-100 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Blog yüklenemedi</h1>
          <p className="text-gray-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-[#27AE60] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#219653]"
          >
            Yeniden dene
          </button>
        </div>
      </PageContainer>
    );
  }

  if (route.type === 'post') {
    const post = feed.posts.find((candidate) => candidate.slug === route.slug);

    if (!post) {
      return (
        <PageContainer>
          <BlogPostNotFound />
        </PageContainer>
      );
    }

    return (
      <PageContainer>
        <BlogPostDetail post={post} posts={feed.posts} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BlogList
        posts={feed.posts}
        postsPerPage={feed.postsPerPage || DEFAULT_POSTS_PER_PAGE}
        initialPage={route.page}
      />
    </PageContainer>
  );
}
