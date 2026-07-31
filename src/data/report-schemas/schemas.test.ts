import { describe, it, expect } from 'vitest';
import kolorektalSchema from './kolorektal-rezeksiyon.json';
import prostatSchema from './prostat-igne-biyopsi.json';
import { ReportSchema, Alan } from './_schema';
import { evaluateVisibility } from '../../core/reporting/render';

describe('Report Schemas Validation', () => {
  const schemas: ReportSchema[] = [
    kolorektalSchema as unknown as ReportSchema,
    prostatSchema as unknown as ReportSchema,
  ];


  schemas.forEach((schema) => {
    describe(`Schema: ${schema.id}`, () => {
      it('has valid root properties', () => {
        expect(schema.id).toBeTypeOf('string');
        expect(schema.baslik).toBeTypeOf('string');
        expect(Array.isArray(schema.bolumler)).toBe(true);
        expect(schema.bolumler.length).toBeGreaterThan(0);
      });

      it('has unique section IDs and unique field IDs', () => {
        const sectionIds = new Set<string>();
        const fieldIds = new Set<string>();

        const checkFields = (fields: Alan[]) => {
          fields.forEach((field) => {
            expect(fieldIds.has(field.id)).toBe(false);
            fieldIds.add(field.id);
            if (field.tip === 'tekrarliGrup') {
              checkFields(field.altAlanlar);
            }
          });
        };

        schema.bolumler.forEach((section) => {
          expect(sectionIds.has(section.id)).toBe(false);
          sectionIds.add(section.id);
          checkFields(section.alanlar);
        });
      });

      it('ensures visibility conditions reference existing field IDs', () => {
        const allFieldIds = new Set<string>();
        const collectIds = (fields: Alan[]) => {
          fields.forEach((f) => {
            allFieldIds.add(f.id);
            if (f.tip === 'tekrarliGrup') {
              collectIds(f.altAlanlar);
            }
          });
        };
        schema.bolumler.forEach((s) => collectIds(s.alanlar));

        const checkVisibility = (fields: Alan[]) => {
          fields.forEach((field) => {
            if (field.gorunurKosul) {
              expect(allFieldIds.has(field.gorunurKosul.alan)).toBe(true);
            }
            if (field.tip === 'tekrarliGrup') {
              checkVisibility(field.altAlanlar);
            }
          });
        };

        schema.bolumler.forEach((section) => {
          if (section.gorunurKosul) {
            expect(allFieldIds.has(section.gorunurKosul.alan)).toBe(true);
          }
          checkVisibility(section.alanlar);
        });
      });

      it('ensures select/multiselect fields have options', () => {
        const checkOptions = (fields: Alan[]) => {
          fields.forEach((field) => {
            if (field.tip === 'select' || field.tip === 'multiselect') {
              expect(Array.isArray(field.secenekler)).toBe(true);
              expect(field.secenekler!.length).toBeGreaterThan(0);
            }
            if (field.tip === 'tekrarliGrup') {
              checkOptions(field.altAlanlar);
            }
          });
        };
        schema.bolumler.forEach((section) => {
          checkOptions(section.alanlar);
        });
      });

      it('ensures tekrarliGrup field references valid number field in sayiKaynagi.alan', () => {
        const fieldMap = new Map<string, Alan>();
        const mapFields = (fields: Alan[]) => {
          fields.forEach((f) => {
            fieldMap.set(f.id, f);
            if (f.tip === 'tekrarliGrup') {
              mapFields(f.altAlanlar);
            }
          });
        };
        schema.bolumler.forEach((s) => mapFields(s.alanlar));

        schema.bolumler.forEach((section) => {
          section.alanlar.forEach((field) => {
            if (field.tip === 'tekrarliGrup') {
              if ('alan' in field.sayiKaynagi) {
                const targetId = field.sayiKaynagi.alan;
                expect(fieldMap.has(targetId)).toBe(true);
                const targetField = fieldMap.get(targetId)!;
                expect(targetField.tip).toBe('number');
              } else if ('sabit' in field.sayiKaynagi) {
                expect(field.sayiKaynagi.sabit).toBeGreaterThan(0);
              }
            }
          });
        });
      });
      it('evaluates iceriyor operator correctly for visibility conditions (e.g. tani contains +)', () => {
        const cond = { alan: 'tani', operator: 'iceriyor' as const, deger: '+' };
        expect(evaluateVisibility(cond, { tani: '3+4' })).toBe(true);
        expect(evaluateVisibility(cond, { tani: '5+5' })).toBe(true);
        expect(evaluateVisibility(cond, { tani: 'benign' })).toBe(false);
        expect(evaluateVisibility(cond, { tani: 'asap' })).toBe(false);
      });
    });
  });
});

