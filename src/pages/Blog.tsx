import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, Clock, Tag, Search, ExternalLink } from 'lucide-react';
import { Input } from '../components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  useEffect(() => {
    fetch('https://api.github.com/repos/metinciris/metinciriscomtr/issues?labels=blog&state=open')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error('GitHub API response is not an array:', data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching blog posts:', err);
        setLoading(false);
      });
  }, []);

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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#27AE60] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">Henüz blog yazısı bulunmuyor veya aramanızla eşleşen sonuç yok.</p>
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

                <div className="text-gray-600 mb-4 line-clamp-3 text-sm prose prose-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {post.body.split('\n').slice(0, 3).join('\n')}
                  </ReactMarkdown>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(post.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <a
                    href={post.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#27AE60] hover:underline font-medium"
                  >
                    Devamını Oku <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
