import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { MetroTile } from '../components/MetroTile';
import { FileBarChart, Activity, FileText, AlertCircle } from 'lucide-react';

interface DigerCalismalarProps {
    onNavigate?: (page: string) => void;
}

export function DigerCalismalar({ onNavigate }: DigerCalismalarProps) {
    // Fallback if onNavigate is not provided (though it should be from App.tsx)
    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        } else {
            window.location.hash = page;
        }
    };

    return (
        <PageContainer>
            <div className="bg-gradient-to-r from-[#8E44AD] to-[#9B59B6] text-white p-12 mb-8 rounded-xl shadow-lg">
                <h1 className="text-white mb-4 text-4xl font-bold">Diğer Çalışmalar</h1>
                <p className="text-white/90 max-w-3xl text-lg">
                    Çeşitli akademik ve idari çalışmalarım.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetroTile
                    title="Sınav Analizi"
                    subtitle="Sınav sonuçları ve analizleri"
                    icon={<FileBarChart size={40} />}
                    color="bg-[#27AE60]"
                    size="medium"
                    onClick={() => handleNavigate('sinav-analizi')}
                />
                <MetroTile
                    title="Fetus Uzunlukları"
                    subtitle="Fetal otopsi ölçümleri"
                    icon={<Activity size={40} />}
                    color="bg-[#3498DB]"
                    size="medium"
                    onClick={() => handleNavigate('fetus-uzunluklari')}
                />
                <MetroTile
                    title="RCB Hesaplayıcı"
                    subtitle="Rezidüel Kanser Yükü"
                    icon={<FileBarChart size={40} />}
                    color="bg-[#E74C3C]"
                    size="medium"
                    onClick={() => handleNavigate('rcb-calculator')}
                />
                <MetroTile
                    title="GİST Raporlama"
                    subtitle="Gastrointestinal Stromal Tümör"
                    icon={<FileText size={40} />}
                    color="bg-[#9B59B6]"
                    size="medium"
                    onClick={() => handleNavigate('gist-raporlama')}
                />
                <MetroTile
                    title="Deprem"
                    subtitle="Son depremler (Kandilli)"
                    icon={<AlertCircle size={40} />}
                    color="bg-[#C0392B]"
                    size="medium"
                    onClick={() => handleNavigate('deprem')}
                />

            </div>
        </PageContainer>
    );
}
