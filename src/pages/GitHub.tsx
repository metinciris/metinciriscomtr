import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
    Calendar,
    ExternalLink,
    Tag,
    Github as GithubIcon,
    Code,
    BookOpen,
    Users,
    Microscope,
    Star,
    GitFork
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface GitHubPost {
    id: number;
    title: string;
    body: string;
    created_at: string;
    html_url: string;
    labels: { name: string }[];
}

interface PinnedRepoApi {
    author: string;
    name: string;
    description: string;
    language: string | null;
    stars: number;
    forks: number;
}

interface GitHubRepoCard {
    id: string;
    name: string;
    html_url: string;
    description: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
}

export function GitHub() {
    const [posts, setPosts] = useState<GitHubPost[]>([]);
    const [loading, setLoading] = useState(true);

    const [repos, setRepos] = useState<GitHubRepoCard[]>([]);
    const [reposLoading, setReposLoading] = useState(true);

    useEffect(() => {
        // GitHub etiketli Issues (sayfada gömmek istediğin yazılar)
        fetch('https://api.github.com/repos/metinciris/metinciriscomtr/issues?labels=GitHub&state=open')
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

        // Pinned repolar (profilde iğnelenmiş olanlar)
        fetch('https://pinned.berrysauce.dev/get/metinciris')
            .then(res => res.json())
            .then((data: PinnedRepoApi[] | { detail?: string }) => {
                if (Array.isArray(data)) {
                    const mapped: GitHubRepoCard[] = data.map((repo) => ({
                        id: `${repo.author}/${repo.name}`,
                        name: repo.name,
                        html_url: `https://github.com/${repo.author}/${repo.name}`,
                        description: repo.description || '',
                        language: repo.language,
                        stargazers_count: repo.stars,
                        forks_count: repo.forks
                    }));
                    setRepos(mapped);
                } else {
                    console.error('Error from pinned API:', data);
                }
                setReposLoading(false);
            })
            .catch(err => {
                console.error('Error fetching pinned repos:', err);
                setReposLoading(false);
            });
    }, []);

    return (
        <PageContainer>
            {/* HEADER */}
            <div className="bg-[#24292e] text-white p-12 mb-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <GithubIcon size={48} />
                    <h1 className="text-white text-4xl font-bold">GitHub Açık Kaynak Paylaşımları</h1>
                </div>
                <p className="text-white text-lg mb-6 leading-relaxed max-w-3xl">
                    Dr. Metin Çiriş — Patoloji Uzmanı. Moleküler patoloji, sanal mikroskopi ve NGS alanlarında
                    geliştirdiğim açık kaynak araçlar burada yer alıyor.
                </p>
                <div className="flex flex-wrap gap-4">
                    <a
                        href="https://github.com/metinciris"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#00A6D6] text-white px-6 py-3 rounded-lg hover:bg-[#0095c0] transition-colors font-medium shadow-lg"
                    >
                        <GithubIcon size={20} />
                        GitHub Profilimi Ziyaret Et
                        <ExternalLink size={16} />
                    </a>
                    <a
                        href="https://github.com/metinciris?tab=repositories"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#27AE60] text-white px-6 py-3 rounded-lg hover:bg-[#229954] transition-colors font-medium shadow-lg"
                    >
                        <Code size={20} />
                        Tüm Depolar
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>

            {/* KISA TANITIM BLOĞU */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">GitHub İçeriklerinin Genel Çerçevesi</h2>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <p className="text-gray-700 mb-4 leading-relaxed">
                        Bu sayfada; sanal mikroskopi ve web paylaşım projelerim, patoloji rutini için
                        geliştirdiğim pratik araçlar ve NGS & moleküler patoloji analizlerine yönelik
                        uygulamalarımı özet olarak bulabilirsiniz. Detaylı anlatımlar ve örnekler için
                        ilgili GitHub depolarına bağlantılar eklenmiştir.
                    </p>
                </div>
            </div>

            {/* 3 ANA KÜME: SANAL MİKROSKOPİ / RUTİN ARAÇLAR / NGS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* SANAL MİKROSKOPİ & WEB PAYLAŞIM SİSTEMLERİ */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                            <Microscope size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Sanal Mikroskopi & Web Paylaşım</h3>
                            <p className="text-sm text-gray-500">
                                Dijital patoloji görüntülerini web üzerinden paylaşma ve eğitim amaçlı kullanma araçları.
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Patoloji slaytlarının SVS formatından web&apos;e uygun hale getirilmesi, galeri ve slayt
                        altyapılarının yönetimi için bir ekosistem. Özellikle asistan eğitimi, öğrenci dersleri ve
                        online vaka tartışmaları için uygundur.
                    </p>
                    <div className="space-y-2 mt-auto">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Öne çıkan projeler</p>
                        <ul className="space-y-1 text-sm">
                            <li>
                                <a
                                    href="https://github.com/metinciris/galeri"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#00A6D6] hover:underline"
                                >
                                    Galeri – Patoloji Görüntü Galeri Sistemi
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/slaytlar"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#00A6D6] hover:underline"
                                >
                                    Slaytlar – Eğitim Sunumları
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/svs_to_png"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#00A6D6] hover:underline"
                                >
                                    SVS to PNG – Format Dönüştürücü
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/svstoweb"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#00A6D6] hover:underline"
                                >
                                    SVS to Web – Web Görüntüleyici
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/senkronize"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#00A6D6] hover:underline"
                                >
                                    Senkronize – Web İçerik Senkronizasyonu
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* PATOLOJİ RUTİNİNİ KOLAYLAŞTIRAN ARAÇLAR */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#E74C3C] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Patoloji Rutin Araçları</h3>
                            <p className="text-sm text-gray-500">
                                Laboratuvar iş akışını hızlandıran, raporlamayı ve barkod süreçlerini düzenleyen araçlar.
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        İmmünohistokimya değerlendirmesinden barkod okumaya, etiket standardizasyonundan
                        endoskopi raporlamaya kadar patolojinin günlük pratiğini destekleyen küçük ama etkili
                        yardımcı uygulamalar.
                    </p>
                    <div className="space-y-2 mt-auto">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Öne çıkan projeler</p>
                        <ul className="space-y-1 text-sm">
                            <li>
                                <a
                                    href="https://github.com/metinciris/ki67"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#E74C3C] hover:underline"
                                >
                                    Ki-67 Analiz Aracı
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/fish"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#E74C3C] hover:underline"
                                >
                                    FISH Analiz & Raporlama
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/barkod"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#E74C3C] hover:underline"
                                >
                                    Barkod & DataMatrix Araçları
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/etikettofilename"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#E74C3C] hover:underline"
                                >
                                    Etiket → Dosya İsmi Dönüştürücü
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/endoskopi_raporlama"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#E74C3C] hover:underline"
                                >
                                    Endoskopi Raporlama Sistemi
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* NGS & MOLEKÜLER PATOLOJİ ARAÇLARI */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-[#8E44AD] w-12 h-12 flex items-center justify-center text-white rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">NGS & Moleküler Patoloji</h3>
                            <p className="text-sm text-gray-500">
                                VCF analizi, coverage raporları, TMB ve HTML raporlama araçları.
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        NGS verilerinin yorumlanması, kalite kontrolü ve klinik rapora dönüştürülmesi için
                        geliştirilmiş script ve uygulamalar. JSON, Excel ve PDF gibi formatlarla uyumlu,
                        laboratuvar otomasyonuna entegre edilebilir yapıdadır.
                    </p>
                    <div className="space-y-2 mt-auto">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Öne çıkan projeler</p>
                        <ul className="space-y-1 text-sm">
                            <li>
                                <a
                                    href="https://github.com/metinciris/VCF-Clinical-Assessment-Analyzer"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#8E44AD] hover:underline"
                                >
                                    VCF Clinical Assessment Analyzer
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/Coverage_report"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#8E44AD] hover:underline"
                                >
                                    Coverage Report
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/NGS-Contamination-Matrix-Tool"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#8E44AD] hover:underline"
                                >
                                    NGS Contamination Matrix Tool
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/mutasyonyaz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#8E44AD] hover:underline"
                                >
                                    mutasyonyaz – HTML Raporlama
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/metinciris/tmb"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[#8E44AD] hover:underline"
                                >
                                    TMB (Tumor Mutational Burden) Tool
                                    <ExternalLink size={14} />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* AÇIK KAYNAK YAKLAŞIMI BLOĞU */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 rounded-xl border border-gray-200 mb-10">
                <h3 className="text-xl font-bold mb-4">Açık Kaynak Yaklaşımı</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    Tüm bu projeler; yoğun çalışan patoloji laboratuvarlarında iş yükünü azaltmak, raporlamayı
                    standardize etmek ve dijital patolojiye geçişi hızlandırmak amacıyla geliştirildi. Kodların
                    büyük bölümü gerçek klinik ihtiyaca dayanan, günlük pratikte kullanılan araçlardan oluşmaktadır.
                </p>
                <p className="text-gray-700 leading-relaxed">
                    Geri bildirimler, pull request’ler ve yeni fikirler için GitHub üzerinden her zaman ulaşabilirsiniz.
                    Açık kaynak geliştirme sürecine katkı sağlamak isterseniz, ilgili depolarda &quot;Issues&quot; ve
                    &quot;Discussions&quot; bölümlerini kullanabilirsiniz.
                </p>
            </div>

            {/* SON PAYLAŞIMLAR (ISSUES) – BOŞSA HİÇ GÖSTERME */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-[#333333] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : posts.length > 0 ? (
                <>
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold mb-6">Son Paylaşımlar (Issues ile eklediklerim)</h2>
                    </div>
                    <div className="space-y-6 mb-10">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 p-8"
                            >
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {post.labels
                                        .filter(l => l.name !== 'GitHub' && l.name.toLowerCase() !== 'github')
                                        .map((label, index) => (
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
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                    >
                                        {post.body}
                                    </ReactMarkdown>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-top border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Calendar size={16} />
                                        <span className="text-sm">
                                            {new Date(post.created_at).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    <a
                                        href={post.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[#333333] hover:underline font-medium"
                                    >
                                        GitHub&apos;da Görüntüle <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : null}

            {/* PINNED REPOS BÖLÜMÜ */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">GitHub’da Öne Çıkan (Pinned) Depolar</h2>
                    <a
                        href="https://github.com/metinciris?tab=repositories"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[#333333] hover:underline font-medium"
                    >
                        Tüm depoları görüntüle
                        <ExternalLink size={14} />
                    </a>
                </div>

                {reposLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-[#333333] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : repos.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                        <p className="text-gray-500">
                            Şu anda listelenecek pinned depo bulunamadı veya servis geçici olarak yanıt vermiyor.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {repos.map(repo => (
                            <a
                                key={repo.id}
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <GithubIcon size={18} className="text-gray-700" />
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:underline break-words">
                                            {repo.name}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                                        {repo.description || 'Açıklama eklenmemiş.'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
                                    <div className="flex items-center gap-4">
                                        <span className="inline-flex items-center gap-1">
                                            <Star size={14} />
                                            {repo.stargazers_count}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <GitFork size={14} />
                                            {repo.forks_count}
                                        </span>
                                        {repo.language && (
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                                                {repo.language}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
