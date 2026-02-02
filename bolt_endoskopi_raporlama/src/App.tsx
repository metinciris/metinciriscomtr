import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ReportGenerator } from './components/ReportGenerator';
import { Biopsy, BiopsyLocation } from './types';

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

function App() {
  const [biopsies, setBiopsies] = useState<Biopsy[]>([]);
  const [stainConfig, setStainConfig] = useState(defaultStainConfig);

  const handleReset = () => {
    setBiopsies([]);
  };

  return (
    <Layout 
      onReset={handleReset}
      stainConfig={stainConfig}
      onStainConfigChange={setStainConfig}
    >
      <ReportGenerator 
        biopsies={biopsies} 
        setBiopsies={setBiopsies}
        stainConfig={stainConfig}
      />
    </Layout>
  );
}

export default App;