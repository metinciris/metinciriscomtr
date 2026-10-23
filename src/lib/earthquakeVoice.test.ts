import { describe, expect, it } from 'vitest';
import { formatEarthquakeAnnouncement } from './earthquakeVoice';

describe('Deprem sesli bildirim metni', () => {
  it('konum ve ondalikli buyuklugu bir defa bildirir', () => {
    expect(formatEarthquakeAnnouncement('Bucak - BURDUR', 4.2)).toBe(
      'Deprem bildirimi. Bucak, BURDUR. Büyüklük 4,2.',
    );
  });

  it('tam sayi buyuklugu virgullu ve tek ondalik olarak okutur', () => {
    expect(formatEarthquakeAnnouncement('ISPARTA', 3)).toBe(
      'Deprem bildirimi. ISPARTA. Büyüklük 3,0.',
    );
  });

  it('bos konum ve gecersiz sayida guvenli metin kullanir', () => {
    expect(formatEarthquakeAnnouncement('  ', Number.NaN)).toBe(
      'Deprem bildirimi. Konumu bilinmeyen. Büyüklük bilinmiyor.',
    );
  });

  it('AFAD konumundaki parantezleri seslendirme icin temizler', () => {
    expect(formatEarthquakeAnnouncement('AKDENİZ (ANTALYA)', 3.6)).toBe(
      'Deprem bildirimi. AKDENİZ ANTALYA. Büyüklük 3,6.',
    );
  });
});
