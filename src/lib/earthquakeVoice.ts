/**
 * Deprem sayfasinda bir depremi bir kere seslendirir.
 * Ahenk Cep tarayicida hazir oldugunda onu kullanir; model yuklenirken
 * veya hata verdiginde cihazdaki Turkce SpeechSynthesis sesine gecer.
 * Sunucuya deprem metni gonderilmez.
 */
import { AhenkCepClient, type AhenkAudio, type AhenkLoadStatus } from './ahenkCep';

export function formatEarthquakeAnnouncement(title: string, magnitude: number): string {
  const location = String(title || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[-–—/]+/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(?:,\s*){2,}/g, ', ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .slice(0, 130) || 'Konumu bilinmeyen';
  const size = Number.isFinite(magnitude)
    ? magnitude.toFixed(1).replace('.', ',')
    : 'bilinmiyor';
  return 'Deprem bildirimi. ' + location + '. Büyüklük ' + size + '.';
}

export class EarthquakeVoice {
  private client: AhenkCepClient | null = null;
  private context: AudioContext | null = null;
  private activeAbort: AbortController | null = null;
  private enabled = false;
  private ready = false;

  constructor(private readonly onStatus: (status: AhenkLoadStatus) => void) {}

  // Bildirim anahtarina tiklandigi anda WebAudio'yu etkinlestirmek,
  // mobil ve masaustu tarayicilarin autoplay kisitlari icin gereklidir.
  activate(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.primeAudio();

    const client = new AhenkCepClient((status) => {
      if (!this.enabled || this.client !== client) return;
      this.ready = status.phase === 'ready';
      this.onStatus(status);
    });
    this.client = client;
    void client.load().catch((error) => {
      if (this.enabled) console.warn('Deprem Ahenk modeli yuklenemedi:', error);
    });
  }

  deactivate(): void {
    this.enabled = false;
    this.ready = false;
    this.activeAbort?.abort();
    this.activeAbort = null;
    try { window.speechSynthesis?.cancel(); } catch { /* tarayici destegi yok */ }
    this.client?.dispose();
    this.client = null;
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') {
      void context.close().catch(() => { /* sayfa kapanmis olabilir */ });
    }
    this.onStatus({ phase: 'idle', percent: 0, detail: '' });
  }

  private primeAudio(): void {
    try {
      const AudioCtor = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      this.context = new AudioCtor();
      if (this.context.state === 'suspended') {
        void this.context.resume().catch(() => { /* tarayici TTS yedegi kullanilir */ });
      }
    } catch (error) {
      console.warn('Deprem WebAudio baslatilamadi:', error);
    }
  }

  async announce(text: string): Promise<void> {
    if (!this.enabled || !text.trim()) return;
    const controller = new AbortController();
    this.activeAbort = controller;

    try {
      if (this.ready && this.client && this.context) {
        try {
          const voice = await this.client.speak(text, controller.signal);
          if (controller.signal.aborted || !this.enabled) return;
          await this.playAhenk(voice, controller.signal);
          return;
        } catch (error) {
          if (controller.signal.aborted || !this.enabled) return;
          console.warn('Deprem Ahenk sesi calinamadi, tarayici sesi deneniyor:', error);
        }
      }

      try {
        await this.speakWithBrowser(text, controller.signal);
      } catch (error) {
        if (controller.signal.aborted || !this.enabled) return;
        console.warn('Deprem tarayici sesi calinamadi:', error);
        this.playSingleFallbackTone();
      }
    } finally {
      if (this.activeAbort === controller) this.activeAbort = null;
    }
  }

  private async playAhenk(voice: AhenkAudio, signal: AbortSignal): Promise<void> {
    const context = this.context;
    if (!context || !voice.audio.length || signal.aborted) {
      throw new Error('Ahenk ses verisi hazir degil.');
    }
    if (context.state === 'suspended') await context.resume();
    if (context.state !== 'running' || signal.aborted) {
      throw new Error('Tarayici ses oynatmaya izin vermiyor.');
    }

    const buffer = context.createBuffer(1, voice.audio.length, voice.sampleRate);
    buffer.getChannelData(0).set(voice.audio);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', onAbort);
        source.onended = null;
        source.disconnect();
        if (error) reject(error);
        else resolve();
      };
      const onAbort = () => {
        try { source.stop(); } catch { /* henuz baslamamis olabilir */ }
        finish(new Error('Seslendirme iptal edildi.'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
      source.onended = () => finish();
      if (signal.aborted) {
        onAbort();
      } else {
        try { source.start(); } catch (error) {
          finish(error instanceof Error ? error : new Error('Ahenk oynatilamadi.'));
        }
      }
    });
  }

  private async speakWithBrowser(text: string, signal: AbortSignal): Promise<void> {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      throw new Error('Tarayici seslendirme motoru yok.');
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.96;
    utterance.volume = 1;
    const turkishVoice = synth.getVoices().find((voice) =>
      voice.lang.toLowerCase().startsWith('tr'));
    if (turkishVoice) utterance.voice = turkishVoice;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let timer = 0;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        utterance.onend = null;
        utterance.onerror = null;
        if (error) reject(error);
        else resolve();
      };
      const onAbort = () => {
        synth.cancel();
        finish(new Error('Seslendirme iptal edildi.'));
      };
      utterance.onend = () => finish();
      utterance.onerror = () => finish(new Error('Tarayici seslendirmesi basarisiz.'));
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) {
        onAbort();
        return;
      }
      timer = window.setTimeout(() => {
        synth.cancel();
        finish(new Error('Tarayici sesi zaman asimina ugradi.'));
      }, 20000);
      try {
        synth.cancel();
        synth.speak(utterance); // Deprem basina yalnizca bir utterance.
      } catch (error) {
        finish(error instanceof Error ? error : new Error('Ses baslatilamadi.'));
      }
    });
  }

  // Her iki TTS yolu da basarisizsa eski tekrarli bip yerine tek kisa ton.
  private playSingleFallbackTone(): void {
    const context = this.context;
    if (!context || context.state !== 'running') return;
    try {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start();
      osc.stop(context.currentTime + 0.28);
    } catch { /* ses donanimi kullanilamiyor */ }
  }
}
