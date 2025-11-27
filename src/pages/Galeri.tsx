import React from 'react';
import { PageContainer } from '../components/PageContainer';

export function Galeri() {
  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Slide Galeri</h1>
          <p className="text-sm text-gray-600">
            Sanal mikroskop üzerinde gerçek vakalar. Galeri ayrı bir GitHub
            Pages projesinden yüklenmektedir.
          </p>
        </div>

        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <iframe
            src="https://metinciris.github.io/galeri/"
            title="Sanal Mikroskop Slide Galerisi"
            style={{
              width: '100%',
              minHeight: '80vh',
              border: 'none',
            }}
            loading="lazy"
          />
        </div>
      </PageContainer>
    </div>
  );
}
