/**
 * Deprem sayfasi sesli bildirim tercihi.
 * Varsayilan ACIK; yalnizca kullanici kapatirsa opt-out bilgisi saklanir.
 */
const KEY = 'metinciris-deprem-voice-disabled-v1';

export function isEarthquakeVoiceEnabled(disabledFlag: string | null): boolean {
  return disabledFlag !== '1';
}

export function readEarthquakeVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return isEarthquakeVoiceEnabled(window.localStorage.getItem(KEY));
  } catch {
    // Gizli mod veya kisitli depolamada varsayilan acik.
    return true;
  }
}

export function saveEarthquakeVoiceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, '1');
  } catch {
    // Depolama izni yoksa bu oturumda anahtar yine calisir.
  }
}
