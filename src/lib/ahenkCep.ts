// The model itself is fetched from Hugging Face; the Apache-2.0 browser runtime
// and Turkish normaliser live in public/ahenk-cep (with upstream LICENSE/NOTICE).
// Keep this adapter separate from the podcast UI so errors never break the page.

export type AhenkLoadStatus = {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  percent: number;
  detail: string;
};

export type AhenkAudio = { audio: Float32Array; sampleRate: number };

type WorkerReply = {
  type: string;
  stage?: string;
  loaded?: number;
  total?: number;
  id?: number;
  audio?: Float32Array;
  sampleRate?: number;
  message?: string;
  kind?: string;
  broken?: boolean;
};

type Pending = {
  resolve: (result: AhenkAudio) => void;
  reject: (reason: Error) => void;
};

const MODEL_BASE = 'https://huggingface.co/ozgurguler/ahenk-cep-tr/resolve/main/onnx/';
const MODEL_LOAD_TIMEOUT_MS = 120000;
const SYNTHESIS_TIMEOUT_MS = 120000;

export class AhenkCepClient {
  private worker: Worker | null = null;
  private loading: Promise<void> | null = null;
  private resolveLoad: (() => void) | null = null;
  private rejectLoad: ((reason: Error) => void) | null = null;
  private loadTimeout: number | null = null;
  private ready = false;
  private disposed = false;
  private percent = 0;
  private nextId = 0;
  private requests = new Map<number, Pending>();
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly onStatus: (status: AhenkLoadStatus) => void) {}

  private clearLoadTimeout() {
    if (this.loadTimeout !== null) {
      window.clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
  }

  private failed(reason: string) {
    const error = new Error(reason);
    this.clearLoadTimeout();
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.rejectLoad?.(error);
    this.rejectLoad = null;
    this.resolveLoad = null;
    this.loading = null;
    for (const task of this.requests.values()) task.reject(error);
    this.requests.clear();
    if (!this.disposed) {
      this.onStatus({ phase: 'error', percent: 0, detail: reason });
    }
  }

  private onMessage(reply: WorkerReply) {
    if (this.disposed) return;

    if (reply.type === 'status') {
      if (reply.stage === 'download' && reply.total) {
        const progress = Math.min(88, 5 + Math.round(83 * (reply.loaded || 0) / reply.total));
        if (progress !== this.percent) {
          this.percent = progress;
          this.onStatus({
            phase: 'loading',
            percent: progress,
            detail: 'Ahenk ses modeli yükleniyor',
          });
        }
      } else if (reply.stage === 'sessions') {
        this.percent = 92;
        this.onStatus({
          phase: 'loading',
          percent: 92,
          detail: 'Ses modeli hazırlanıyor',
        });
      }
      return;
    }

    if (reply.type === 'ready') {
      this.clearLoadTimeout();
      this.ready = true;
      this.resolveLoad?.();
      this.resolveLoad = null;
      this.rejectLoad = null;
      this.onStatus({ phase: 'ready', percent: 100, detail: 'Ahenk hazır' });
      return;
    }

    if (reply.type === 'audio' && reply.id !== undefined) {
      const task = this.requests.get(reply.id);
      if (!task) return;
      this.requests.delete(reply.id);
      if (reply.audio instanceof Float32Array && reply.sampleRate) {
        task.resolve({ audio: reply.audio, sampleRate: reply.sampleRate });
      } else {
        task.reject(new Error('Ses verisi geçersiz.'));
      }
      return;
    }

    if (reply.type === 'error') {
      const reason = reply.message || 'Ahenk ses motoru hata verdi.';
      if (reply.stage === 'init' || reply.broken) {
        this.failed(reason);
        return;
      }
      if (reply.id !== undefined) {
        const task = this.requests.get(reply.id);
        if (task) {
          this.requests.delete(reply.id);
          task.reject(new Error(reason));
        }
      }
    }
  }

  load(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error('Ses motoru kapatıldı.'));
    if (this.loading) return this.loading;

    this.percent = 1;
    this.onStatus({ phase: 'loading', percent: 1, detail: 'Ahenk başlatılıyor' });
    const loading = new Promise<void>((resolve, reject) => {
      this.resolveLoad = resolve;
      this.rejectLoad = reject;
    });
    this.loading = loading;

    try {
      const workerUrl = new URL('/ahenk-cep/js/worker.js', window.location.origin);
      const worker = new Worker(workerUrl, { type: 'module', name: 'ahenk-cep-podcast' });
      this.worker = worker;
      worker.onmessage = (event: MessageEvent<WorkerReply>) => this.onMessage(event.data);
      worker.onerror = () => this.failed('Ses motorunun tarayıcı bileşeni yüklenemedi.');
      this.loadTimeout = window.setTimeout(
        () => this.failed('Ahenk hazırlığı zaman aşımına uğradı.'),
        MODEL_LOAD_TIMEOUT_MS,
      );
      worker.postMessage({
        type: 'init',
        modelBase: MODEL_BASE,
        pyBase: new URL('/ahenk-cep/py/', window.location.origin).href,
        variant: 'f16',
        ep: 'wasm',
        maxThreads: 1, // No site-wide COOP/COEP or service worker.
      });
    } catch (error) {
      this.failed(error instanceof Error ? error.message : String(error));
    }
    return loading;
  }

  // Serialized requests protect the ONNX sessions from concurrent inference.
  // An aborted UI request is skipped before it reaches the worker; if already
  // running, its result is discarded by the caller without interrupting the model.
  speak(text: string, signal?: AbortSignal): Promise<AhenkAudio> {
    const run = async (): Promise<AhenkAudio> => {
      await this.load();
      if (signal?.aborted) throw new Error('Seslendirme iptal edildi.');
      if (!this.worker || !this.ready) throw new Error('Ahenk hazır değil.');

      const id = ++this.nextId;
      return new Promise<AhenkAudio>((resolve, reject) => {
        const timeout = window.setTimeout(
          () => this.failed('Ses üretimi zaman aşımına uğradı.'),
          SYNTHESIS_TIMEOUT_MS,
        );
        this.requests.set(id, {
          resolve: (result) => {
            window.clearTimeout(timeout);
            resolve(result);
          },
          reject: (error) => {
            window.clearTimeout(timeout);
            reject(error);
          },
        });
        this.worker?.postMessage({
          type: 'say',
          id,
          text,
          style: 'neutral',
          steps: 16,
          speed: 1.0,
          seed: 0,
        });
      });
    };
    const result = this.queue.then(run);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.failed('Ses motoru kapatıldı.');
  }
}
