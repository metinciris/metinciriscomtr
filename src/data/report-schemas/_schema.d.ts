// src/data/report-schemas/_schema.d.ts

export type FieldType = 'select' | 'multiselect' | 'number' | 'text' | 'textarea' | 'boolean';
export type Operator = 'esittir' | 'esitDegil' | 'iceriyor' | 'buyuktur';

export interface FieldOption {
  deger: string;
  etiket: string;
  pT?: string;
  pN?: string;
  pM?: string;
}

export interface VisibilityCondition {
  alan: string;
  operator: Operator;
  deger: string | boolean | number;
}

export interface FieldDefinition {
  id: string;
  etiket: string;
  tip: FieldType;
  zorunlu?: boolean;
  birim?: string;
  ondalik?: number;
  min?: number;
  max?: number;
  satir?: number;
  yardim?: string;
  ornek?: string;
  evrelemeRolu?: 'pT' | 'pN' | 'pM' | null;
  raporSatiri?: string;
  gorunurKosul?: VisibilityCondition | null;
  secenekler?: FieldOption[];
}

export interface SectionDefinition {
  id: string;
  baslik: string;
  gorunurKosul?: VisibilityCondition | null;
  alanlar: FieldDefinition[];
}

export interface ReportSchema {
  id: string;
  baslik: string;
  kaynak?: string;
  evrelemeSistemi?: string;
  surum?: string;
  not?: string;
  bolumler: SectionDefinition[];
}
