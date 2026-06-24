import React, { useState, useEffect, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, Clock, Tag, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';
import './Blog.css';

const formatMarkdown = (text: string) => {
  if (!text) return '';
  return text.replace(/\r\n/g, '\n').replace(/\n/g, '  \n');
};

// Rate Limiting Logic
class RateLimiter {
  private timestamps: number[] = [];
  private readonly limit: number;
  private readonly interval: number;

  constructor(limit: number, interval: number) {
    this.limit = limit;
    this.interval = interval;
  }

  check(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.interval);
    if (this.timestamps.length >= this.limit) return false;
    this.timestamps.push(now);
    return true;
  }
}

const rateLimiter = new RateLimiter(
  parseInt(import.meta.env.VITE_API_RATE_LIMIT || '60'),
  60 * 60 * 1000 // 1 hour
);

interface BlogPost {
  id: number;
  title: string;
  body: string;
  created_at: string;
  html_url: string;
  labels: { name: string }[];
  user: { login: string };
}

export function Blog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});

  const bottomRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (id: number) => {
    setExpandedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (!rateLimiter.check()) {
      console.warn('Rate limit exceeded');
      setLoading(false);
      return;
    }

    setLoading(true);
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    const repoOwner = import.meta.env.VITE_GITHUB_REPO_OWNER || 'metinciris';
    const repoName = import.meta.env.VITE_GITHUB_REPO_NAME || 'metinciriscomtr';

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token && token.startsWith('gh')) {
      headers['Authorization'] = `token ${token}`;
    }

    const perPage = 12;
    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues?labels=blog&state=open&per_page=${perPage}&page=${page}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          if (data.length < perPage) {
            setHasMore(false);
          }
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = data.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        } else {
          console.error('GitHub API response is not an array:', data);
          setHasMore(false);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching blog posts:', err);
        setLoading(false);
        setHasMore(false);
      });
  }, [page]);

  useEffect(() => {
    if (loading || !hasMore || searchTerm) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentBottom = bottomRef.current;
    if (currentBottom) {
      observer.observe(currentBottom);
    }

    return () => {
      if (currentBottom) {
        observer.unobserve(currentBottom);
      }
    };
  }, [loading, hasMore, searchTerm]);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.body.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white p-12 mb-8 rounded-xl shadow-lg">
        <h1 className="text-white mb-4 text-4xl font-bold">Blog</h1>
        <p className="text-white/90 max-w-3xl text-lg">
          Serbest yazılar ve patologların işini kolaylaştıracak vibe coding web sayfaları.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Blog yazılarında ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(DOMPurify.sanitize(e.target.value))}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {page === 1 && loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : posts.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">Henüz blog yazısı bulunmuyor.</p>
        </div>
      ) : (
        <>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 mb-6">
              <p className="text-gray-500">Aramanızla eşleşen sonuç bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.labels.filter(l => l.name !== 'blog').map((label, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium"
                        >
                          <Tag size={10} />
                          {label.name}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-xl font-bold mb-3 text-gray-900 line-clamp-2">{post.title}</h3>

                    {expandedPosts[post.id] ? (
                      <div className="text-gray-600 mb-4 text-sm blog-content-markdown max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {formatMarkdown(DOMPurify.sanitize(post.body))}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-gray-600 mb-4 line-clamp-6 text-sm blog-content-markdown max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {formatMarkdown(DOMPurify.sanitize(post.body).split('\n').slice(0, 6).join('\n'))}
                        </ReactMarkdown>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(post.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <button
                        onClick={() => toggleExpand(post.id)}
                        className="flex items-center gap-1 text-[#27AE60] hover:underline font-medium cursor-pointer focus:outline-none"
                      >
                        {expandedPosts[post.id] ? (
                          <>Daha Az Göster <ChevronUp size={14} /></>
                        ) : (
                          <>Devamını Oku <ChevronDown size={14} /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading & Infinite Scroll Trigger */}
          <div className="mt-8 flex flex-col items-center justify-center min-h-[60px]">
            {loading && (
              <div className="flex justify-center items-center gap-2 py-4">
                <div className="w-6 h-6 border-3 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500 text-sm">Daha eski yazılar yükleniyor...</span>
              </div>
            )}
            
            {!loading && hasMore && (
              searchTerm ? (
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-medium text-sm flex items-center gap-2 cursor-pointer"
                >
                  Daha Eski Yazıları Yükle ve Ara <ChevronDown size={16} />
                </button>
              ) : (
                <div ref={bottomRef} className="h-10 w-full" />
              )
            )}
            
            {!hasMore && posts.length > 0 && (
              <p className="text-gray-400 text-sm py-4">Tüm yazılar yüklendi.</p>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
