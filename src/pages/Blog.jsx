import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch issues with label 'blog' from the repository
        fetch('https://api.github.com/repos/metinciris/metinciriscomtr/issues?labels=blog&state=open')
            .then(res => res.json())
            .then(data => {
                setPosts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching blog posts:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="container mx-auto px-6 py-20">
            <h1 className="text-4xl font-bold mb-12 text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Blog & Duyurular
                </span>
            </h1>

            {loading ? (
                <div className="flex justify-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center text-gray-400">
                    <p>Henüz blog yazısı bulunmuyor.</p>
                    <p className="text-sm mt-2">GitHub Issues üzerinden 'blog' etiketiyle yazı ekleyebilirsiniz.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
                    {posts.map(post => (
                        <article key={post.id} className="bg-dark-800 rounded-2xl p-8 border border-white/5 hover:border-primary/30 transition-all">
                            <h2 className="text-2xl font-bold mb-4 text-white">{post.title}</h2>
                            <div className="text-gray-400 prose prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {post.body}
                                </ReactMarkdown>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/5 flex justify-between text-sm text-gray-500">
                                <span>{new Date(post.created_at).toLocaleDateString('tr-TR')}</span>
                                <a href={post.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                                    GitHub'da Görüntüle →
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Blog;
