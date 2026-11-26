// src/pages/KolorektalRapor.tsx
import React from 'react';
import { SchemaReportEngine } from '../components/Reporting/SchemaReportEngine';
import kolorektalSchema from '../data/report-schemas/kolorektal-rezeksiyon.json';
import { ReportSchema } from '../data/report-schemas/_schema';
import { SEO } from '../components/SEO';

export function KolorektalRapor() {
  return (
    <>
      <SEO currentPage="kolorektal-rapor" />
      <SchemaReportEngine
        schema={kolorektalSchema as unknown as ReportSchema}
        sectionNotes={{
          lenf_nodlari: (
            <p className="text-sm leading-relaxed text-slate-700">
              <strong>Lenf nodu bulunmadı</strong> ile <strong>incelenen nodlarda metastaz yok</strong>{' '}
              aynı bulgu değildir. Bu araçta (AJCC 8), hiç nod bulunmamışsa depozit yokken pN atanmaz;
              tümör depoziti varsa pN1c gösterilir.{' '}
              <a
                className="font-medium text-sky-800 underline underline-offset-2"
                href="https://github.com/metinciris/metinciriscomtr/issues/1224"
              >
                ICCR (UICC TNM 9) taslağına ilişkin dört örnek
              </a>
            </p>
          ),
        }}
      />
    </>
  );
}

export default KolorektalRapor;
