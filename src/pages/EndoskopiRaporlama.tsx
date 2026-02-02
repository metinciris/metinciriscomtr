import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { EndoskopiLayout } from '../components/EndoskopiRaporlama/EndoskopiLayout';
import { ReportGenerator } from '../components/EndoskopiRaporlama/ReportGenerator';
import { Biopsy, BiopsyLocation } from '../types/endoskopi';
import { Microscope, FileText } from 'lucide-react';
import { RelatedPages } from '../components/RelatedPages';

const defaultStainConfig = {
    [BiopsyLocation.Ozefagus]: [
        { name: 'PAS+AB', description: 'Özefagus Goblet hücrelerini değerlendirmek için' }
    ],
    [BiopsyLocation.Mide]: [
        { name: 'PAS+AB', description: 'mide mukozasında intestinal metaplaziyi değerlendirmek için' },
        { name: 'Warthin Starry', description: 'Helikobakter Pilori değerlendirmek için' }
    ],
    [BiopsyLocation.Duodenum]: [
        { name: 'PAS', description: 'Duedonum mukozasında villus ve silyalı epiteli değerlendirmek için' }
    ],
    [BiopsyLocation.Ileum]: [],
    [BiopsyLocation.Kolon]: []
};

export function EndoskopiRaporlama() {
    const [biopsies, setBiopsies] = useState<Biopsy[]>([]);
    const [stainConfig, setStainConfig] = useState(defaultStainConfig);

    const handleReset = () => {
        setBiopsies([]);
    };

    return (
        <PageContainer>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Endoskopi Raporlama</h1>
                <p className="text-gray-600">Endoskopi biyopsileri için hızlı rapor oluşturma aracı.</p>
            </div>

            <EndoskopiLayout
                onReset={handleReset}
                stainConfig={stainConfig}
                onStainConfigChange={setStainConfig}
            >
                <ReportGenerator
                    biopsies={biopsies}
                    setBiopsies={setBiopsies}
                    stainConfig={stainConfig}
                />
            </EndoskopiLayout>

            <RelatedPages
                pages={[
                    {
                        title: "Sjögren Raporlama",
                        subtitle: "Minör tükrük bezi biyopsisi raporlama aracı",
                        page: "sjogren-raporlama",
                        color: "bg-indigo-600",
                        icon: Microscope
                    },
                    {
                        title: "GİST Raporlama",
                        subtitle: "Gastrointestinal Stromal Tümör raporlama aracı",
                        page: "gist-raporlama",
                        color: "bg-purple-600",
                        icon: FileText
                    },
                    {
                        title: "TİİAB Raporlama",
                        subtitle: "Tiroid İnce İğne Aspirasyon Biyopsisi raporlama aracı",
                        page: "tiiab-raporlama",
                        color: "bg-emerald-600",
                        icon: Microscope
                    }
                ]}
            />
        </PageContainer>
    );
}

export default EndoskopiRaporlama;
