import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { ReportGenerator } from '../components/endoskopi/ReportGenerator';
import { AutoStainMenu } from '../components/endoskopi/AutoStainMenu';
import { Biopsy, BiopsyLocation } from '../types';
import { Settings2 } from 'lucide-react';
import { ErrorBoundary } from '../components/ErrorBoundary';

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

export function Endoskopi() {
    const [biopsies, setBiopsies] = useState<Biopsy[]>([]);
    const [stainConfig, setStainConfig] = useState(defaultStainConfig);
    const [isStainMenuOpen, setIsStainMenuOpen] = useState(false);
    import React, { useState } from 'react';
    import { PageContainer } from '../components/PageContainer';
    import { ReportGenerator } from '../components/endoskopi/ReportGenerator';
    import { AutoStainMenu } from '../components/endoskopi/AutoStainMenu';
    import { Biopsy, BiopsyLocation } from '../types';
    import { Settings2 } from 'lucide-react';
    import { ErrorBoundary } from '../components/ErrorBoundary';

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

    export function Endoskopi() {
        const [biopsies, setBiopsies] = useState<Biopsy[]>([]);
        const [stainConfig, setStainConfig] = useState(defaultStainConfig);
        const [isStainMenuOpen, setIsStainMenuOpen] = useState(false);

        const handleReset = () => {
            setBiopsies([]);
        };

        return (
            <PageContainer>
                <ErrorBoundary>
                    <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white p-12 mb-8 rounded-xl shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-white mb-4 text-4xl font-bold">Endoskopi Raporlama</h1>
                                <p className="text-white/90 max-w-3xl text-lg">
                                    Sık rastlanılan gastrointestinal sistem endoskopi raporlama aracı.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsStainMenuOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <Settings2 size={20} />
                                    <span>Boya Ayarları</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="text-sm px-4 py-2 bg-red-500/20 border border-red-400/50 text-red-100 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                    Hepsini Sıfırla
                                </button>
                            </div>
                        </div>
                    </div>

                    <ReportGenerator
                        biopsies={biopsies}
                        setBiopsies={setBiopsies}
                        stainConfig={stainConfig}
                    />

                    <AutoStainMenu
                        isOpen={isStainMenuOpen}
                        onClose={() => setIsStainMenuOpen(false)}
                        stainConfig={stainConfig}
                        onStainConfigChange={setStainConfig}
                    />
                </ErrorBoundary>
            </PageContainer>
        );
    }
