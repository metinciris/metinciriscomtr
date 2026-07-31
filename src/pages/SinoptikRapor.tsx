// src/pages/SinoptikRapor.tsx
import React from 'react';
import { SchemaReportEngine } from '../components/Reporting/SchemaReportEngine';
import kolorektalSchema from '../data/report-schemas/kolorektal-rezeksiyon.json';
import { ReportSchema } from '../data/report-schemas/_schema';
import { SEO } from '../components/SEO';

export function SinoptikRapor() {
  return (
    <>
      <SEO
        title="Sinoptik Patoloji Raporu | Prof Dr Metin Çiriş"
        description="CAP ve AJCC standartlarına uygun şema tabanlı sinoptik patoloji raporlama motoru."
        keywords="sinoptik rapor, patoloji raporlama, kolorektal karsinom, CAP protokolü, AJCC evreleme"
      />
      <SchemaReportEngine schema={kolorektalSchema as unknown as ReportSchema} />
    </>
  );
}

export default SinoptikRapor;
