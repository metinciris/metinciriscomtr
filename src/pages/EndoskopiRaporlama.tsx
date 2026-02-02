import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { EndoskopiLayout } from '../components/EndoskopiRaporlama/EndoskopiLayout';
import { ReportGenerator } from '../components/EndoskopiRaporlama/ReportGenerator';
import { Biopsy, BiopsyLocation } from '../types/endoskopi';

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
        </PageContainer>
    );
}

export default EndoskopiRaporlama;
