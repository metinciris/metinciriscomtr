import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { MetroTile } from '../components/MetroTile';
import { FileBarChart, Activity, FileText, AlertCircle, Microscope, Box, BookOpen, Calculator, TrendingUp, Trophy, Users, Search, Briefcase, Calendar, Image, Globe, Timer } from 'lucide-react';


interface DigerCalismalarProps {
    onNavigate?: (page: string) => void;
}

export function DigerCalismalar({ onNavigate }: DigerCalismalarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const items = [
        // Raporlama Araçları
        {
            title: "Sjögren Raporlama",
            subtitle: "Minör tükrük bezi biyopsisi",
            icon: <Microscope size={40} />,
            color: "bg-indigo-600",
            page: 'sjogren-raporlama',
            category: 'raporlama'
        },
        {
            title: "GİST Raporlama",
            subtitle: "Gastrointestinal Stromal Tümör",
            icon: <FileText size={40} />,
            color: "bg-[#9B59B6]",
            page: 'gist-raporlama',
            category: 'raporlama'
        },
        {
            title: "TİİAB Raporlama",
            subtitle: "Tiroid İnce İğne Aspirasyon Biyopsisi",
            icon: <Microscope size={40} />,
            color: "bg-emerald-600",
            page: 'tiiab-raporlama',
            category: 'raporlama'
        },
        {
            title: "Endoskopi Raporlama",
            subtitle: "Gastrointestinal sistem biyopsileri",
            icon: <FileText size={40} />,
            color: "bg-[#2980B9]",
            page: 'endoskopi-raporlama',
            category: 'raporlama'
        },
        // Patoloji & Eğitim Araçları
        {
            title: "Sınav Analizi",
            subtitle: "Sınav sonuçları ve analizleri",
            icon: <FileBarChart size={40} />,
            color: "bg-[#27AE60]",
            page: 'sinav-analizi',
            category: 'patoloji'
        },
        {
            title: "Fetus Uzunlukları",
            subtitle: "Fetal otopsi ölçümleri",
            icon: <Activity size={40} />,
            color: "bg-[#3498DB]",
            page: 'fetus-uzunluklari',
            category: 'patoloji'
        },
        {
            title: "RCB Hesaplayıcı",
            subtitle: "Rezidüel Kanser Yükü",
            icon: <FileBarChart size={40} />,
            color: "bg-[#E74C3C]",
            page: 'rcb-calculator',
            category: 'patoloji'
        },
        {
            title: "Deprem",
            subtitle: "Son depremler (Kandilli)",
            icon: <AlertCircle size={40} />,
            style: { backgroundColor: '#C0392B' },
            page: 'deprem',
            category: 'diger'
        },
        {
            title: "SVS Mikroskopi",
            subtitle: "Sanal slayt görüntüleyici",
            icon: <Microscope size={40} />,
            style: { backgroundColor: '#0f3460' },
            page: 'svs-reader',
            category: 'patoloji'
        },
        {
            title: "Tanı Tuzakları",
            subtitle: "Patoloji pitfall'ları",
            icon: <AlertCircle size={40} />,
            color: "bg-[#8E44AD]",
            page: 'tani-tuzaklari',
            category: 'patoloji'
        },
        {
            title: "Blog",
            subtitle: "Vaka yazıları & notlar",
            icon: <FileText size={40} />,
            color: "bg-[#8E44AD]",
            page: 'blog',
            category: 'patoloji'
        },
        {
            title: "3D Prizma",
            subtitle: "Resmi 3D kutuya kaplama",
            icon: <Box size={40} />,
            style: { backgroundColor: '#667eea' },
            page: 'prizma-3d',
            category: 'diger'
        },
        {
            title: "Lenf Nodu Sayacı",
            subtitle: "Klavye & Dokunmatik",
            icon: <Calculator size={40} />,
            style: { backgroundColor: '#8E44AD' },
            page: 'lenf-nodu',
            category: 'patoloji'
        },
        {
            title: "Patoloji Sözlüğü",
            subtitle: "Terimler ve Sık Sorulan Sorular",
            icon: <BookOpen size={40} />,
            color: "bg-[#8E44AD]",
            page: 'patoloji-sozlugu',
            category: 'patoloji'
        },
        {
            title: "Makale Takip",
            subtitle: "Patoloji PubMed literatür",
            icon: <BookOpen size={40} />,
            style: { backgroundColor: '#0088cc' },
            page: 'makale-takip',
            category: 'patoloji'
        },
        {
            title: "Finans",
            subtitle: "Canlı piyasa verileri",
            icon: <TrendingUp size={40} />,
            style: { backgroundColor: '#2C3E50' },
            page: 'finans',
            category: 'diger'
        },
        {
            title: "PubMed Trend",
            subtitle: "Yayın trend analizi",
            icon: <TrendingUp size={40} />,
            style: { backgroundColor: '#7c3aed' },
            page: 'pubmed-trend',
            category: 'patoloji'
        },
        {
            title: "Online Test Analizi",
            subtitle: "Tarayıcı tabanlı sınav analizi",
            icon: <Activity size={40} />,
            style: { backgroundColor: '#1e293b' },
            page: 'online-test-analiz',
            category: 'patoloji'
        },
        {
            title: "Euro Maçlar",
            subtitle: "Türk takımları fikstürü",
            icon: <Trophy size={40} />,
            style: { backgroundColor: '#e67e22' },
            page: 'euro-maclar',
            category: 'diger'
        },
        {
            title: "Konsensus Takip",
            subtitle: "Patoloji toplantı takvimi",
            icon: <Users size={40} />,
            style: { backgroundColor: '#2563eb' },
            page: 'konsensus',
            category: 'patoloji'
        },
        {
            title: "PubMed Makale Takip",
            subtitle: "Günlük patoloji dergi makaleleri",
            icon: <Calendar size={40} />,
            style: { backgroundColor: '#3b82f6' },
            page: 'pubmed-makale-takip',
            category: 'patoloji'
        },
        {
            title: "Makale Arşivi",
            subtitle: "Eski yayınlar & notlar",
            icon: <BookOpen size={40} />,
            style: { backgroundColor: '#16a085' },
            page: 'makale',
            category: 'patoloji'
        },
        {
            title: "AVIF Dönüştürücü",
            subtitle: "Resimleri AVIF formatına dönüştür",
            icon: <Image size={40} />,
            style: { backgroundColor: '#059669' },
            page: 'avif-donusturucu',
            category: 'diger'
        },
        {
            title: "Dünya Saatleri",
            subtitle: "Zaman dilimi ve toplantı planlayıcı",
            icon: <Globe size={40} />,
            style: { backgroundColor: '#1e3a5f' },
            page: 'dunya-saatleri',
            category: 'diger'
        },
        {
            title: "VKİ Hesaplama",
            subtitle: "Vücut Kitle İndeksi",
            icon: <Calculator size={40} />,
            style: { backgroundColor: '#16a085' },
            page: 'vki-hesaplama',
            category: 'diger'
        },
        {
            title: "Geri Sayım",
            subtitle: "TUS, DUS, YDS ve ders saati",
            icon: <Timer size={40} />,
            style: { backgroundColor: '#7c3aed' },
            page: 'geri-sayim',
            category: 'diger'
        },
        {
            title: "Mitoz Dönüştürücü",
            subtitle: "HPF'den mm² alana dönüşüm",
            icon: <Microscope size={40} />,
            style: { backgroundColor: '#059669' },
            page: 'mitoz-donusturucu',
            category: 'patoloji'
        },
    ];

    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        } else {
            window.location.hash = page;
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [
        { id: 'all', name: 'Tümü' },
        { id: 'raporlama', name: 'Raporlama Araçları' },
        { id: 'patoloji', name: 'Patoloji & Eğitim' },
        { id: 'diger', name: 'Diğer Çalışmalar' }
    ];

    return (
        <PageContainer>
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 text-white p-10 md:p-14 mb-10">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase">Patoloji & Yazılım</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                        Diğer Çalışmalar
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl font-medium">
                        Raporlama araçları, patoloji eğitim materyalleri ve yazılım projeleri.
                    </p>
                </div>
            </div>

            <div className="mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${selectedCategory === cat.id
                                    ? 'bg-[#8E44AD] text-white shadow-lg shadow-[#8E44AD]/30 scale-105'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100 hover:border-[#8E44AD]/30'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Sayfada ara..."
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8E44AD]/30 focus:border-[#8E44AD] transition-all text-base shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, idx) => (
                    <MetroTile
                        key={idx}
                        title={item.title}
                        subtitle={item.subtitle}
                        icon={item.icon}
                        color={item.color || ''}
                        textColor={(item as any).textColor}
                        style={item.style}
                        size="medium"
                        onClick={() => handleNavigate(item.page)}
                    />
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Search size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-600">Aramanızla eşleşen sonuç bulunamadı.</h3>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="mt-4 text-[#8E44AD] font-semibold hover:underline"
                    >
                        Tüm çalışmaları temizle
                    </button>
                </div>
            )}
        </PageContainer>
    );
}
