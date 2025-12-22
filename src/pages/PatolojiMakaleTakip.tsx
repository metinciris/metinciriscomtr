import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { ExternalLink, Send, Globe, Calendar, BookOpen } from 'lucide-react';

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
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#3b82f6] text-white p-8 md:p-12 mb-10 rounded-3xl shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <BookOpen size={32} className="text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Patoloji Makale Takip</h1>
                    </div>
                    <p className="text-white/90 text-lg md:text-xl max-w-2xl leading-relaxed">
                        Patoloji odaklı PubMed literatür takibi
                    </p>
                    <p className="text-white/70 text-sm mt-3">
                        NCBI API kullanılarak günlük otomatik makale taraması yapılmaktadır.
                    </p>
                </div>
            </div>

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
        </PageContainer>
    );
}
