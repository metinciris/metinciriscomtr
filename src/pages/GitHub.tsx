import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, ExternalLink, Tag, Github as GithubIcon, Code, BookOpen, Users, Microscope } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GitHubPost {
    id: number;
    title: string;
    body: string;
    created_at: string;
    html_url: string;
    labels: { name: string }[];
}

export function GitHub() {
    const [posts, setPosts] = useState<GitHubPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('https://api.github.com/repos/metinciris/metinciriscomtr/issues?labels=github&state=open')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPosts(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching GitHub posts:', err);
                setLoading(false);
            });
    }, []);

    return (
        <PageContainer>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#333333] to-[#24292e] text-white p-12 mb-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <GithubIcon size={48} />
                    <h1 className="text-white text-4xl font-bold">GitHub Açık Kaynak Paylaşımları</h1>
                </div>
                <p className="text-white/90 max-w-3xl text-lg mb-6">
                    Dr. Metin Çiriş — Patoloji Uzmanı olarak teşhis odaklı çalışmalar yürütüyor;
                    aynı zamanda moleküler patoloji, sanal mikroskopi ve vaka paylaşımı alanlarında
                    içerik üretmeyi amaçlıyorum.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a
                        href="https://github.com/metinciris"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-[#333333] px-6 py-3 rounded-lg hover:bg-white/90 transition-colors font-medium"
                    >
                        <GithubIcon size={20} />
                        GitHub Profilimi Ziyaret Et
                        <ExternalLink size={16} />
                    </a>
                    <a
                        href="https://github.com/metinciris?tab=repositories"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/30 px-6 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium"
                    >
                        <Code size={20} />
                        90+ Depo
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>

            {/* Tanıtım Bölümü */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Platform Hakkında</h2>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <p className="text-gray-700 mb-4 leading-relaxed">
                        Bu GitHub sayfası, klinik ve akademik ilgi alanlarımı yansıtan açık kaynak paylaşımlarımı
                        topladığım bir platformdur. Özellikle aşağıdaki başlıklar altında çeşitli projeler ve
                        örnekler bulabilirsiniz:
                    </p>
                </div>

                {/* Proje Kategorileri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Moleküler İncelemeler */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                                <Microscope size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Moleküler İncelemeler</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Genetik değişkenliklerin analizi, mutasyon raporlaması ve ilgili kod altyapıları.
                        </p>
                        <a
                            href="https://github.com/metinciris/mutasyonyaz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[#00A6D6] hover:underline font-medium"
                        >
                            <Code size={16} />
                            mutasyonyaz projesi
                            <ExternalLink size={14} />
                        </a>
                        <p className="text-sm text-gray-500 mt-2">
                            Moleküler patolojide kullanılabilecek HTML tabanlı raporlama örneği
                        </p>
                    </div>

                    {/* Sanal Mikroskopi */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#27AE60] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Sanal Mikroskopi ve Vaka Paylaşımları</h3>
                        </div>
                        <p className="text-gray-600">
                            Patolojik görüntülerin sanal ortamda paylaşımı, dijital patoloji çalışmaları için
                            hazırlıklar ve örnek vaka setleri. Bu sayede hem eğitim hem de araştırma amaçlı
                            kullanım mümkün kılınmaktadır.
                        </p>
                    </div>

                    {/* Akademik Araçlar */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#E74C3C] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Akademik Süreç Araçları</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Patolojiyle doğrudan ilişkili olmasa da, akademik süreçleri, yayın takip sistemlerini
                            ve veri işlemlerini kolaylaştıran çeşitli araçlar.
                        </p>
                        <a
                            href="https://github.com/metinciris/Pubmed-Email-Notifier"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[#E74C3C] hover:underline font-medium"
                        >
                            <Code size={16} />
                            Pubmed-Email-Notifier
                            <ExternalLink size={14} />
                        </a>
                        <p className="text-sm text-gray-500 mt-2">
                            Belirli yayınları izlemek isteyen kullanıcılar için otomatik bildirim sistemi
                        </p>
                    </div>

                    {/* Platform İstatistikleri */}
                    <div className="bg-gradient-to-br from-[#8E44AD] to-[#9B59B6] p-6 rounded-xl shadow-sm text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white/20 w-12 h-12 flex items-center justify-center rounded-lg">
                                <GithubIcon size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Platforma Genel Bakış</h3>
                        </div>
                        <p className="text-white/90 mb-4">
                            GitHub profilimde toplam <strong>90'dan fazla depo (repository)</strong> yer almakta;
                            bu içeriklerin bir kısmı hâlihazırda klinik uygulamalara, bir kısmı da eğitim-araştırma
                            dünyasına yönelik olarak tasarlanmıştır.
                        </p>
                        <a
                            href="https://github.com/metinciris?tab=repositories"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-[#8E44AD] px-4 py-2 rounded-lg hover:bg-white/90 transition-colors font-medium text-sm"
                        >
                            Tüm Depoları Görüntüle
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </div>

                {/* Açık Kaynak Felsefesi */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 rounded-xl border border-gray-200">
                    <h3 className="text-xl font-bold mb-4">Açık Kaynak Yaklaşımı</h3>
                    <p className="text-gray-700 leading-relaxed">
                        Bu sayfa aracılığıyla hem meslektaşlarımın hem de patolojiye ilgi duyan araştırmacı ve
                        öğrencilerin özgürce erişebileceği içerikler oluşturmayı hedefliyorum. Açık kaynak yaklaşımıyla,
                        katkılarınızı ve geri bildirimlerinizi memnuniyetle karşılarım.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-6">
                        <a
                            href="https://github.com/metinciris"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[#333333] hover:underline font-medium"
                        >
                            <GithubIcon size={18} />
                            GitHub: github.com/metinciris
                        </a>
                        <a
                            href="https://metinciris.com.tr"
                            className="inline-flex items-center gap-2 text-[#00A6D6] hover:underline font-medium"
                        >
                            <ExternalLink size={18} />
                            İletişim: metinciris.com.tr
                        </a>
                    </div>
                </div>
            </div>

            {/* GitHub Issues Paylaşımları */}
            <div className="mb-4">
                <h2 className="text-2xl font-bold mb-6">Son Paylaşımlar</h2>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-[#333333] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500">Henüz GitHub paylaşımı bulunmuyor.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 p-8"
                        >
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.labels.filter(l => l.name !== 'github').map((label, index) => (
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
                                    className="flex items-center gap-2 text-[#333333] hover:underline font-medium"
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
