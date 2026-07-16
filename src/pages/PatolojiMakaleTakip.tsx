import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { ExternalLink, Send, Globe, Calendar, BookOpen, GraduationCap, Users, FileText } from 'lucide-react';
import { RelatedPages } from '../components/RelatedPages';

interface TelegramChannel {
    name: string;
    description: string;
    details?: string;
    url: string;
    emoji?: string;
}

interface WebApp {
    name: string;
    description: string;
    url: string;
}

const telegramChannels: TelegramChannel[] = [
    {
        name: 'Patolojim',
        description: 'Önde gelen patoloji dergilerinden günlük makale takibi.',
        url: 'https://t.me/patolojim',
        emoji: '🔬'
    },
    {
        name: 'Meme Patolojisi',
        description: 'Am J Surg Pathol, Mod Pathol, Histopathology, Hum Pathol, Virchows Arch + 35 patoloji dergisi ve Breast Cancer Res, Cancer, Int J Cancer gibi meme kanserine odaklı dergilerden günlük makale takibi. Sadece patoloji odaklı.',
        url: 'https://t.me/memepatoloji',
        emoji: '🎀'
    },
    {
        name: 'Kemik ve Yumuşak Doku Patolojisi',
        description: 'Kemik ve yumuşak doku patolojisi odaklı günlük makale taraması.',
        url: 'https://t.me/kemikpat',
        emoji: '🦴'
    },
    {
        name: 'Endokrin Patoloji',
        description: 'Endokrin patoloji alanında günlük makale takibi. NCBI API kullanılmaktadır.',
        url: 'https://t.me/endokrinpatoloji',
        emoji: '🦋'
    },
    {
        name: 'Üropatoloji',
        description: 'Am J Surg Pathol, Mod Pathol, Hum Pathol, Eur Urol, J Urol, Nat Rev Urol ve 12 üroloji/patoloji dergisinden günlük makale takibi.',
        url: 'https://t.me/uropat',
        emoji: '🩺'
    },
    {
        name: 'Jinekopatoloji',
        description: 'Jinekopatoloji alanında günlük makale takibi.',
        url: 'https://t.me/jinekomakale',
        emoji: '🌸'
    },
    {
        name: 'Konsensüs Takip',
        description: 'Patoloji konsensus toplantılarını 15 dakika önce bildirim olarak gönderir. konsensus.bolt.host sitesinden bildirim göndermektedir.',
        url: 'https://t.me/konsensustakip',
        emoji: '📅'
    }
];

const webApps: WebApp[] = [
    {
        name: 'Patoloji Dergi Takip',
        description: 'Dünyaca ünlü 15 patoloji dergisi ve Türk Patoloji Dergisi\'ni takip eder. Her dergiye tıklayarak son makaleleri sıralayabilirsiniz.',
        url: 'https://patoloji.netlify.app/'
    },
    {
        name: 'PubMed Patoloji Takvim',
        description: 'Takvime göre PubMed\'e düşen patoloji makaleleri. Bugünden geriye giderek günlük makalelere hızlı erişim. PWA ile cep telefonundan takip edilebilir.',
        url: 'https://pubmed-patoloji-derg-wctr.bolt.host/'
    },
    {
        name: 'Patoloji Konsensus',
        description: 'Patoloji konsensus toplantılarını takip etmek için oluşturulmuş uygulama. Toplantı zamanlarını ve detaylarını görüntüleyin.',
        url: 'https://konsensus.bolt.host/'
    }
];

export function PatolojiMakaleTakip() {
    return (
        <PageContainer>
            {/* Hero Banner */}
            {/* Hero Banner */}
            <div
                className="relative overflow-hidden p-8 md:p-12 mb-10 rounded-3xl shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
                    color: '#ffffff'
                }}
            >
                {/* Decorative elements */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '256px',
                    height: '256px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    transform: 'translate(50%, -50%)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '192px',
                    height: '192px',
                    background: 'rgba(168, 85, 247, 0.2)', // purple-500/20
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    transform: 'translate(-50%, 50%)'
                }}></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '16px',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <BookOpen size={32} style={{ color: '#ffffff' }} />
                        </div>
                        <h1 style={{
                            fontSize: '2.25rem', // text-3xl/4xl approx
                            fontWeight: 'bold',
                            color: '#ffffff',
                            margin: 0
                        }}>Patoloji Makale Takip</h1>
                    </div>
                    <p style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '1.25rem', // text-xl
                        maxWidth: '42rem',
                        lineHeight: '1.625',
                        margin: 0
                    }}>
                        Patoloji odaklı PubMed literatür takibi
                    </p>
                    <p style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.875rem', // text-sm
                        marginTop: '12px'
                    }}>
                        NCBI API kullanılarak günlük otomatik makale taraması yapılmaktadır.
                    </p>
                </div>
            </div>

            {/* RSS Section */}
            <section className="mb-12">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 shadow-sm border border-orange-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="p-1.5 bg-orange-500 rounded-lg text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>
                            </span>
                            <h3 className="text-xl font-bold text-orange-900">Patoloji Blog RSS Seçkisi</h3>
                        </div>
                        <p className="text-orange-800/80">Blog sayfamızda yayınlanan patoloji vaka özetleri, literatür incelemeleri ve akademik yazıları RSS kaynağı ile feed okuyucunuzdan (Feedly, Inoreader vb.) takip edebilirsiniz.</p>
                    </div>
                    <a 
                        href="/patoloji-radari/rss.xml" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shrink-0 whitespace-nowrap shadow-md shadow-orange-500/20"
                    >
                        <span>RSS'e Abone Ol</span>
                    </a>
                </div>
            </section>

            {/* Telegram Channels Section */}
            <section className="mb-12">
                <div className="flex flex-col gap-2 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#0088cc] rounded-xl">
                            <Send size={24} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Telegram Kanallarımız</h2>
                    </div>
                    <p className="text-slate-600 text-sm md:text-base ml-1 leading-relaxed">
                        PubMed&apos;e düştüğü gün öğle saatinde bildirim. Başlık, dergi, yazarlar ve PubMed bağlantısı API ile sağlanır.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {telegramChannels.map((channel) => (
                        <a
                            key={channel.name}
                            href={channel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl hover:border-[#0088cc]/30 transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0088cc]/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{channel.emoji}</span>
                                        <h3 className="font-semibold text-slate-800 group-hover:text-[#0088cc] transition-colors">
                                            {channel.name}
                                        </h3>
                                    </div>
                                    <ExternalLink size={16} className="text-slate-400 group-hover:text-[#0088cc] transition-colors" />
                                </div>

                                <p className="text-slate-600 text-sm mb-2">{channel.description}</p>

                                {channel.details && (
                                    <p className="text-slate-500 text-xs leading-relaxed bg-slate-50 rounded-lg p-3 mt-3">
                                        {channel.details}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 mt-4 text-[#0088cc] text-sm font-medium">
                                    <Send size={14} />
                                    <span>Kanala Git</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            {/* Web Applications Section */}
            <section className="mt-16">
                <div className="flex items-center gap-3 mb-6">
                    <div style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)', padding: '10px', borderRadius: '12px' }}>
                        <Globe size={24} style={{ color: '#ffffff' }} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Web Uygulamalarımız</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {webApps.map((app) => (
                        <a
                            key={app.name}
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #0d9488 50%, #0891b2 100%)',
                                textDecoration: 'none'
                            }}
                        >
                            {/* Decorative elements */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '128px',
                                height: '128px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                filter: 'blur(40px)',
                                transform: 'translate(50%, -50%)'
                            }}></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div style={{
                                            padding: '8px',
                                            background: 'rgba(255,255,255,0.2)',
                                            borderRadius: '8px'
                                        }}>
                                            <Globe size={20} style={{ color: '#ffffff' }} />
                                        </div>
                                        <h3 style={{
                                            fontWeight: 'bold',
                                            fontSize: '1.125rem',
                                            color: '#ffffff',
                                            margin: 0
                                        }}>{app.name}</h3>
                                    </div>
                                    <ExternalLink size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                                </div>

                                <p style={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.6',
                                    margin: 0
                                }}>{app.description}</p>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '16px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    width: 'fit-content'
                                }}>
                                    <span style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: '500' }}>Uygulamayı Aç</span>
                                    <ExternalLink size={14} style={{ color: '#ffffff' }} />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            {/* Footer Info */}
            <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-5 py-2.5 text-slate-600 text-sm">
                    <Calendar size={16} />
                    <span>Tüm kanallar günlük olarak güncellenmektedir</span>
                </div>
            </div>

            <RelatedPages
                pages={[
                    {
                        title: "Yayınlar",
                        subtitle: "Bilimsel yayınlar ve makaleler",
                        page: "yayinlar",
                        color: "bg-rose-600",
                        icon: FileText
                    },
                    {
                        title: "Portfolyo",
                        subtitle: "Akademik özgeçmiş ve çalışma alanları",
                        page: "portfolyo",
                        color: "bg-purple-600",
                        icon: GraduationCap
                    },
                    {
                        title: "Konsensus",
                        subtitle: "Patoloji konsensus toplantı takibi",
                        page: "konsensus",
                        color: "bg-blue-600",
                        icon: Users
                    }
                ]}
            />
        </PageContainer>
    );
}
