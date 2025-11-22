import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, ExternalLink, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FacebookPost {
    id: number;
    title: string;
    body: string;
    created_at: string;
    html_url: string;
    labels: { name: string }[];
}

export function Facebook() {
    const [posts, setPosts] = useState<FacebookPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('https://api.github.com/repos/metinciris/metinciriscomtr/issues?labels=facebook&state=open')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPosts(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching Facebook posts:', err);
                setLoading(false);
            });
    }, []);

    return (
        <PageContainer>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#3B5998] to-[#8b9dc3] text-white p-12 mb-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <h1 className="text-white text-4xl font-bold">Facebook</h1>
                </div>
                <p className="text-white/90 max-w-3xl text-lg">
                    Sosyal paylaşımlarım, güncel duyurular ve topluluk etkileşimleri.
                </p>
                <a
                    href="https://fb.com/patoloji"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 bg-white text-[#3B5998] px-6 py-3 rounded-lg hover:bg-white/90 transition-colors font-medium"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook Sayfamı Ziyaret Et
                    <ExternalLink size={16} />
                </a>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-[#3B5998] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500">Henüz Facebook paylaşımı bulunmuyor.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 p-8"
                        >
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.labels.filter(l => l.name !== 'facebook').map((label, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium"
                                    >
                                        <Tag size={12} />
                                        {label.name}
                                    </span>
                                ))}
                            </div>

                            <h2 className="text-2xl font-bold mb-4 text-gray-900">{post.title}</h2>

                            <div className="text-gray-700 mb-6 prose prose-lg max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {post.body}
                                </ReactMarkdown>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Calendar size={16} />
                                    <span className="text-sm">{new Date(post.created_at).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <a
                                    href={post.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[#3B5998] hover:underline font-medium"
                                >
                                    GitHub'da Görüntüle <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
