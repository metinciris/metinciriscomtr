import { describe, expect, it } from 'vitest';
import { isEarthquakeVoiceEnabled, readEarthquakeVoiceEnabled } from './earthquakeVoicePreference';

describe('Deprem sesli bildirim tercihi', () => {
  it('ilk ziyaret icin varsayilan olarak aciktir', () => {
    expect(isEarthquakeVoiceEnabled(null)).toBe(true);
  });

  it('kullanicinin kapatma tercihini uygular', () => {
    expect(isEarthquakeVoiceEnabled('1')).toBe(false);
  });

  it('diger degerler bildirimi kapatmaz', () => {
    expect(isEarthquakeVoiceEnabled('0')).toBe(true);
    expect(isEarthquakeVoiceEnabled('')).toBe(true);
  });

  it('tarayici olmayan ortamda varsayilan acik kalir', () => {
    if (typeof window === 'undefined') {
      expect(readEarthquakeVoiceEnabled()).toBe(true);
    }
  });
});
