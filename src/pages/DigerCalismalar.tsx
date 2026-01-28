import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { MetroTile } from '../components/MetroTile';
import { FileBarChart, Activity, FileText, AlertCircle, Microscope, Box, BookOpen, Calculator, TrendingUp, Trophy, Users, Search } from 'lucide-react';


interface DigerCalismalarProps {
    onNavigate?: (page: string) => void;
}

export function DigerCalismalar({ onNavigate }: DigerCalismalarProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const items = [
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
            title: "GİST Raporlama",
            subtitle: "Gastrointestinal Stromal Tümör",
            icon: <FileText size={40} />,
            color: "bg-[#9B59B6]",
            page: 'gist-raporlama',
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
    ];

    // Fallback if onNavigate is not provided (though it should be from App.tsx)
    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        } else {
            window.location.hash = page;
        }
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = [
        { id: 'patoloji', name: 'Patoloji & Eğitim' },
        { id: 'diger', name: 'Diğer Çalışmalar' }
    ];

    return (
        <PageContainer>
            <div className="mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Diğer Çalışmalar</h1>
                        <p className="text-gray-500 mt-1">Akademik ve idari çalışmalar arşivi</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Çalışmanızı bulun..."
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8E44AD]/30 focus:border-[#8E44AD] focus:bg-white transition-all text-base shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {categories.map(category => {
                const categoryItems = filteredItems.filter(item => item.category === category.id);
                if (categoryItems.length === 0) return null;

                return (
                    <div key={category.id} className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-[#8E44AD]/20 pb-2 inline-block">
                            {category.name}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categoryItems.map((item, idx) => (
                                <MetroTile
                                    key={idx}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    icon={item.icon}
                                    color={item.color || ''}
                                    style={item.style}
                                    size="medium"
                                    onClick={() => handleNavigate(item.page)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

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
