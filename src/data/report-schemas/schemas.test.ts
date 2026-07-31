import { describe, it, expect } from 'vitest';
import kolorektalSchema from './kolorektal-rezeksiyon.json';
import { ReportSchema } from './_schema';

describe('Report Schemas Validation', () => {
  const schemas: ReportSchema[] = [kolorektalSchema as unknown as ReportSchema];

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

        schema.bolumler.forEach((section) => {
          expect(sectionIds.has(section.id)).toBe(false);
          sectionIds.add(section.id);

          section.alanlar.forEach((field) => {
            expect(fieldIds.has(field.id)).toBe(false);
            fieldIds.add(field.id);
          });
        });
      });

      it('ensures visibility conditions reference existing field IDs', () => {
        const allFieldIds = new Set<string>();
        schema.bolumler.forEach((s) => s.alanlar.forEach((f) => allFieldIds.add(f.id)));

        schema.bolumler.forEach((section) => {
          if (section.gorunurKosul) {
            expect(allFieldIds.has(section.gorunurKosul.alan)).toBe(true);
          }
          section.alanlar.forEach((field) => {
            if (field.gorunurKosul) {
              expect(allFieldIds.has(field.gorunurKosul.alan)).toBe(true);
            }
          });
        });
      });

      it('ensures select/multiselect fields have options', () => {
        schema.bolumler.forEach((section) => {
          section.alanlar.forEach((field) => {
            if (field.tip === 'select' || field.tip === 'multiselect') {
              expect(Array.isArray(field.secenekler)).toBe(true);
              expect(field.secenekler!.length).toBeGreaterThan(0);
            }
          });
        });
      });
    });
  });
});
