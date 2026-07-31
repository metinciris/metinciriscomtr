// src/pages/ProstatIgneBiyopsi.tsx
import React from 'react';
import { SchemaReportEngine } from '../components/Reporting/SchemaReportEngine';
import prostatSchema from '../data/report-schemas/prostat-igne-biyopsi.json';
import { ReportSchema } from '../data/report-schemas/_schema';
import { SEO } from '../components/SEO';

export function ProstatIgneBiyopsi() {
  return (
    <>
      <SEO currentPage="prostat-igne-biyopsi" />
      <SchemaReportEngine schema={prostatSchema as unknown as ReportSchema} />
    </>
  );
}

export default ProstatIgneBiyopsi;
