// src/data/report-schemas/_schema.d.ts

export type FieldType = 'select' | 'multiselect' | 'number' | 'text' | 'textarea' | 'boolean' | 'tekrarliGrup';
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

export interface BaseFieldDefinition {
  id: string;
  etiket: string;
  gorunurKosul?: VisibilityCondition | null;
}

export interface NormalFieldDefinition extends BaseFieldDefinition {
  tip: Exclude<FieldType, 'tekrarliGrup'>;
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
  secenekler?: FieldOption[];
}

export interface TekrarliGrupAlan extends BaseFieldDefinition {
  tip: 'tekrarliGrup';
  sayiKaynagi: { alan: string } | { sabit: number };
  ogeEtiketi: string;
  altAlanlar: Alan[];
}

export type FieldDefinition = NormalFieldDefinition | TekrarliGrupAlan;
export type Alan = FieldDefinition;

export interface SectionDefinition {
  id: string;
  baslik: string;
  gorunurKosul?: VisibilityCondition | null;
  alanlar: Alan[];
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

