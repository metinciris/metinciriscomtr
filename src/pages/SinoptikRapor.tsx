// src/pages/SinoptikRapor.tsx
import React from 'react';
import { SchemaReportEngine } from '../components/Reporting/SchemaReportEngine';
import kolorektalSchema from '../data/report-schemas/kolorektal-rezeksiyon.json';
import { ReportSchema } from '../data/report-schemas/_schema';
import { SEO } from '../components/SEO';

export function SinoptikRapor() {
  return (
    <>
      <SEO currentPage="sinoptik-rapor" />
      <SchemaReportEngine schema={kolorektalSchema as unknown as ReportSchema} />
    </>
  );
}

export default SinoptikRapor;
