import { useState, useEffect, useCallback } from 'react';

export interface KorKonum {
  taraf: 'sag' | 'sol';
  bolge: 'taban' | 'orta' | 'apeks';
  konum?: 'lateral' | 'medial';
}

export interface KorSablonu {
  id: string; // 'standart-1' | 'standart-2' | 'standart-3' | 'standart-4' | 'standart-5' | 'ozel'
  ad: string;
  /** kor numarası (1-indexed) -> yerleşim */
  yerlesim: Record<number, KorKonum>;
}

export const HAZIR_SABLONLAR: KorSablonu[] = [
  {
    id: 'standart-1',
    ad: 'Şablon 1: Standart 12 Kor (Sağ 1-6, Sol 7-12 Taban->Apeks)',
    yerlesim: {
      1: { taraf: 'sag', bolge: 'taban', konum: 'lateral' },
      2: { taraf: 'sag', bolge: 'taban', konum: 'medial' },
      3: { taraf: 'sag', bolge: 'orta', konum: 'lateral' },
      4: { taraf: 'sag', bolge: 'orta', konum: 'medial' },
      5: { taraf: 'sag', bolge: 'apeks', konum: 'lateral' },
      6: { taraf: 'sag', bolge: 'apeks', konum: 'medial' },
      7: { taraf: 'sol', bolge: 'taban', konum: 'lateral' },
      8: { taraf: 'sol', bolge: 'taban', konum: 'medial' },
      9: { taraf: 'sol', bolge: 'orta', konum: 'lateral' },
      10: { taraf: 'sol', bolge: 'orta', konum: 'medial' },
      11: { taraf: 'sol', bolge: 'apeks', konum: 'lateral' },
      12: { taraf: 'sol', bolge: 'apeks', konum: 'medial' },
    },
  },
  {
    id: 'standart-2',
    ad: 'Şablon 2: Ters Sıralı (Apeks->Taban)',
    yerlesim: {
      1: { taraf: 'sag', bolge: 'apeks', konum: 'lateral' },
      2: { taraf: 'sag', bolge: 'apeks', konum: 'medial' },
      3: { taraf: 'sag', bolge: 'orta', konum: 'lateral' },
      4: { taraf: 'sag', bolge: 'orta', konum: 'medial' },
      5: { taraf: 'sag', bolge: 'taban', konum: 'lateral' },
      6: { taraf: 'sag', bolge: 'taban', konum: 'medial' },
      7: { taraf: 'sol', bolge: 'apeks', konum: 'lateral' },
      8: { taraf: 'sol', bolge: 'apeks', konum: 'medial' },
      9: { taraf: 'sol', bolge: 'orta', konum: 'lateral' },
      10: { taraf: 'sol', bolge: 'orta', konum: 'medial' },
      11: { taraf: 'sol', bolge: 'taban', konum: 'lateral' },
      12: { taraf: 'sol', bolge: 'taban', konum: 'medial' },
    },
  },
  {
    id: 'standart-3',
    ad: 'Şablon 3: Lateral Öncelikli (Tüm Lateraller -> Medialler)',
    yerlesim: {
      1: { taraf: 'sag', bolge: 'taban', konum: 'lateral' },
      2: { taraf: 'sag', bolge: 'orta', konum: 'lateral' },
      3: { taraf: 'sag', bolge: 'apeks', konum: 'lateral' },
      4: { taraf: 'sag', bolge: 'taban', konum: 'medial' },
      5: { taraf: 'sag', bolge: 'orta', konum: 'medial' },
      6: { taraf: 'sag', bolge: 'apeks', konum: 'medial' },
      7: { taraf: 'sol', bolge: 'taban', konum: 'lateral' },
      8: { taraf: 'sol', bolge: 'orta', konum: 'lateral' },
      9: { taraf: 'sol', bolge: 'apeks', konum: 'lateral' },
      10: { taraf: 'sol', bolge: 'taban', konum: 'medial' },
      11: { taraf: 'sol', bolge: 'orta', konum: 'medial' },
      12: { taraf: 'sol', bolge: 'apeks', konum: 'medial' },
    },
  },
  {
    id: 'standart-4',
    ad: 'Şablon 4: Çiftler Halinde (Sağ-Sol Taban->Apeks)',
    yerlesim: {
      1: { taraf: 'sag', bolge: 'taban', konum: 'lateral' },
      2: { taraf: 'sol', bolge: 'taban', konum: 'lateral' },
      3: { taraf: 'sag', bolge: 'taban', konum: 'medial' },
      4: { taraf: 'sol', bolge: 'taban', konum: 'medial' },
      5: { taraf: 'sag', bolge: 'orta', konum: 'lateral' },
      6: { taraf: 'sol', bolge: 'orta', konum: 'lateral' },
      7: { taraf: 'sag', bolge: 'orta', konum: 'medial' },
      8: { taraf: 'sol', bolge: 'orta', konum: 'medial' },
      9: { taraf: 'sag', bolge: 'apeks', konum: 'lateral' },
      10: { taraf: 'sol', bolge: 'apeks', konum: 'lateral' },
      11: { taraf: 'sag', bolge: 'apeks', konum: 'medial' },
      12: { taraf: 'sol', bolge: 'apeks', konum: 'medial' },
    },
  },
  {
    id: 'standart-5',
    ad: 'Şablon 5: Medial Öncelikli (Medial -> Lateral)',
    yerlesim: {
      1: { taraf: 'sag', bolge: 'taban', konum: 'medial' },
      2: { taraf: 'sag', bolge: 'taban', konum: 'lateral' },
      3: { taraf: 'sag', bolge: 'orta', konum: 'medial' },
      4: { taraf: 'sag', bolge: 'orta', konum: 'lateral' },
      5: { taraf: 'sag', bolge: 'apeks', konum: 'medial' },
      6: { taraf: 'sag', bolge: 'apeks', konum: 'lateral' },
      7: { taraf: 'sol', bolge: 'taban', konum: 'medial' },
      8: { taraf: 'sol', bolge: 'taban', konum: 'lateral' },
      9: { taraf: 'sol', bolge: 'orta', konum: 'medial' },
      10: { taraf: 'sol', bolge: 'orta', konum: 'lateral' },
      11: { taraf: 'sol', bolge: 'apeks', konum: 'medial' },
      12: { taraf: 'sol', bolge: 'apeks', konum: 'lateral' },
    },
  },
];

const AKTIF_STORAGE_KEY = 'kor-sablonu:aktif';
const OZEL_STORAGE_KEY = 'kor-sablonu:ozel';

export function useKorSablonu() {
  const [aktifSablonId, setAktifSablonId] = useState<string>('standart-1');
  const [ozelYerlesim, setOzelYerlesim] = useState<Record<number, KorKonum>>({});

  // LocalStorage'dan oku
  useEffect(() => {
    try {
      const kayitliSablon = localStorage.getItem(AKTIF_STORAGE_KEY);
      if (kayitliSablon) {
        setAktifSablonId(kayitliSablon);
      }
      const kayitliOzel = localStorage.getItem(OZEL_STORAGE_KEY);
      if (kayitliOzel) {
        setOzelYerlesim(JSON.parse(kayitliOzel));
      }
    } catch {
      // Hata durumunda varsayılana dön
    }
  }, []);

  const sablonSec = useCallback((id: string) => {
    setAktifSablonId(id);
    try {
      localStorage.setItem(AKTIF_STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const ozelYerlesimGuncelle = useCallback((yeniYerlesim: Record<number, KorKonum>) => {
    setOzelYerlesim(yeniYerlesim);
    try {
      localStorage.setItem(OZEL_STORAGE_KEY, JSON.stringify(yeniYerlesim));
    } catch {
      // ignore
    }
  }, []);

  const ozelSablon: KorSablonu = {
    id: 'ozel',
    ad: 'Özel Şablon',
    yerlesim: ozelYerlesim,
  };

  const tumSablonlar = [...HAZIR_SABLONLAR, ozelSablon];
  const aktifSablon = tumSablonlar.find((s) => s.id === aktifSablonId) || HAZIR_SABLONLAR[0];

  return {
    aktifSablonId,
    aktifSablon,
    tumSablonlar,
    sablonSec,
    ozelYerlesimGuncelle,
  };
}
