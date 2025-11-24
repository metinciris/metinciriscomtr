import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
    Calendar,
    ExternalLink,
    Tag,
    Linkedin as LinkedinIcon,
    Microscope,
    Code,
    Users,
    BookOpen,
    Briefcase
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LinkedInPost {
    id: number;
    title: string;
    body: string;
    created_at: string;
    html_url: string;
    labels: { name: string }[];
}

export function LinkedIn() {
    const [posts, setPosts] = useState<LinkedInPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('https://api.github.com/repos/metinciris/metinciriscomtr/issues?labels=linkedin&state=open')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPosts(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching LinkedIn posts:', err);
                setLoading(false);
            });
    }, []);

    return (
        <PageContainer>
            {/* Header */}
            <div className="bg-[#0077B5] text-white p-12 mb-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <LinkedinIcon size={48} className="text-white" />
                    <h1 className="text-white text-4xl font-bold">LinkedIn Profesyonel Profil</h1>
                </div>
                <p className="text-white text-lg mb-6 leading-relaxed max-w-4xl">
                    🔬 Dr. Metin Çiriş | Patoloji Uzmanı<br />
                    Moleküler Patoloji • Dijital / Sanal Mikroskopi • Eğitim • Araştırma • Açık Kaynak Çözümler
                </p>
                <a
                    href="https://www.linkedin.com/in/patoloji/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2
                               bg-white/20 backdrop-blur-sm text-white
                               px-6 py-3 rounded-lg border border-white/30
                               hover:bg-white/30 transition-colors font-medium shadow-lg"
                >
                    <LinkedinIcon size={20} />
                    LinkedIn Profilimi Ziyaret Et
                    <ExternalLink size={16} />
                </a>
            </div>

            {/* Tanıtım Bölümü */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Profesyonel Profil</h2>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Patoloji alanında tanısal süreçleri geliştirmeye, moleküler veriyi klinik uygulamalarla
                        bütünleştirmeye ve dijital patoloji olanaklarını yaygınlaştırmaya odaklanan bir uzmanım.
                        Hem klinik deneyimimi hem de teknolojiye olan ilgimi bir araya getirerek; eğitim, araştırma
                        ve günlük patoloji pratiğine katkı sağlayacak araçlar üretmeyi amaçlıyorum.
                    </p>
                </div>

                {/* Çalışma Alanları */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Moleküler Patoloji */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#0077B5] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                                <Microscope size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Moleküler Patoloji Raporlama</h3>
                        </div>
                        <p className="text-gray-600">
                            Genetik değişkenliklerin analizi, mutasyon raporlaması ve klinik uygulamalarla
                            bütünleştirilmesi üzerine çalışmalar.
                        </p>
                    </div>

                    {/* Dijital Mikroskopi */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Dijital / Sanal Mikroskopi</h3>
                        </div>
                        <p className="text-gray-600">
                            Patolojik görüntülerin dijital ortamda paylaşımı ve vaka tabanlı eğitim materyalleri
                            geliştirme çalışmaları.
                        </p>
                    </div>

                    {/* Veri İşleme Araçları */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#27AE60] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                                <Code size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Patolojiye Yönelik Veri İşleme Araçları</h3>
                        </div>
                        <p className="text-gray-600">
                            Patoloji verilerinin analizi, raporlama ve yönetimi için geliştirilen yazılım araçları
                            ve otomasyonlar.
                        </p>
                    </div>

                    {/* Literatür Takip */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#E74C3C] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Literatür Takip Otomasyonları</h3>
                        </div>
                        <p className="text-gray-600">
                            Akademik yayınların sistematik takibi ve bildirim sistemleri ile güncel literatürün
                            takibi.
                        </p>
                    </div>
                </div>

                {/* GitHub Projelerim */}
                <div className="bg-[#24292e] text-white p-8 rounded-xl shadow-lg mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 w-12 h-12 flex items-center justify-center rounded-lg">
                            <Code size={24} />
                        </div>
                        <h3 className="text-xl font-bold">GitHub Açık Kaynak Projelerim</h3>
                    </div>
                    <p className="text-white/90 mb-4 leading-relaxed">
                        GitHub üzerinde yürüttüğüm açık kaynak projelerde moleküler patoloji raporlama,
                        dijital / sanal mikroskopi vaka paylaşımları, patolojiye yönelik veri işleme araçları
                        ve literatür takip otomasyonları gibi çalışmalara yer veriyorum.
                    </p>
                    <a
                        href="https://github.com/metinciris"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-[#333333] px-4 py-2 rounded-lg hover:bg-white/90 transition-colors font-medium text-sm"
                    >
                        GitHub Profilim
                        <ExternalLink size={14} />
                    </a>
                </div>

                {/* İşbirliği */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#0077B5] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                            <Briefcase size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Profesyonel İşbirliği</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Meslektaşlarımla bilgi paylaşımı, multidisipliner işbirlikleri ve dijital patoloji
                        ekosistemine katkı sunacak projelerde yer almaktan memnuniyet duyarım.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        📩 İş birliği, proje önerileri veya profesyonel iletişim için her zaman ulaşabilirsiniz.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-6">
                        <a
                            href="https://www.linkedin.com/in/patoloji/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[#0077B5] hover:underline font-medium"
                        >
                            <LinkedinIcon size={18} />
                            LinkedIn: linkedin.com/in/patoloji
                        </a>
                        <a
                            href="https://metinciris.com.tr"
                            className="inline-flex items-center gap-2 text-[#00A6D6] hover:underline font-medium"
                        >
                            <ExternalLink size={18} />
                            Web: metinciris.com.tr
                        </a>
                    </div>
                </div>
            </div>

            {/* LinkedIn Issues Paylaşımları */}
            <div className="mb-4">
                <h2 className="text-2xl font-bold mb-6">Profesyonel Paylaşımlar</h2>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-[#0077B5] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <p className="text-gray-500">Henüz LinkedIn paylaşımı bulunmuyor.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 p-8"
                        >
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.labels.filter(l => l.name !== 'linkedin').map((label, index) => (
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
                                    className="flex items-center gap-2 text-[#0077B5] hover:underline font-medium"
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
