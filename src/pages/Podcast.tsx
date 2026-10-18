import { useEffect, useState, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Play, Square, Volume2 } from 'lucide-react';
import '../styles/Podcast.css';
import { AhenkCepClient, type AhenkLoadStatus } from '../lib/ahenkCep';
import { prepareAhenkText } from '../lib/ahenkPronunciation';
import { getPodcastArticleScrollTop } from '../lib/podcastScroll';

interface PodcastProps {
  onNavigate: (page: string) => void; // App ile uyum için; bu sayfada kullanmıyoruz
}

interface Article {
  title: string;
  author?: string;
  date?: string;
  detailHtml?: string;
  link?: string;
  pmid?: string;
  journal: string;
}

interface JournalGroup {
  journal: string;
  articles: Article[];
}

const PODCAST_SHEET_ID = '148p3M41R52gVVjtLSF2Qh8rJvBPEWJ7SV4lgSBQYwLc';
const PODCAST_GID = '1109640564';
const PODCAST_RANGE = 'A1:F132';

// index.html'deki JOURNALROWS ile aynı: dergi başlık satırlarının indexleri (0-based)
const JOURNAL_ROWS = [0, 11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 121];

export default function Podcast({ }: PodcastProps) {
  const [journalGroups, setJournalGroups] = useState<JournalGroup[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('Hazır');
  const [volume, setVolume] = useState(1);
  const [voiceEngine, setVoiceEngine] = useState<'ahenk' | 'browser'>('ahenk');
  const [ahenkLoad, setAhenkLoad] = useState<AhenkLoadStatus>({
    phase: 'idle',
    percent: 0,
    detail: '',
  });
  const [loadingMessage, setLoadingMessage] = useState(
    "Google Sheets'ten veriler yükleniyor...",
  );

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const volumeRef = useRef(volume);
  const articlesRef = useRef<Article[]>([]);
  const engineRef = useRef<'ahenk' | 'browser'>('ahenk');
  const ahenkClientRef = useRef<AhenkCepClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const playbackTokenRef = useRef(0);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const preparedAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const readyClipsRef = useRef<Map<string, string>>(new Map());

  // volumeRef'i her zaman güncel tut
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Bugünün tarihi
  const today = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    // Browser voice remains available as an immediate fallback.
    synthRef.current = window.speechSynthesis;
    const browserSpeech = synthRef.current;
    loadVoices();
    browserSpeech?.addEventListener?.('voiceschanged', loadVoices);
    void fetchPodcastData();

    return () => {
      playbackTokenRef.current += 1;
      activeRequestRef.current?.abort();
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      browserSpeech?.cancel();
      preparedAudioRef.current?.pause();
      nextAudioRef.current?.pause();
      const source = audioSourceRef.current;
      if (source) {
        source.onended = null;
        try { source.stop(); } catch { /* already stopped */ }
      }
      ahenkClientRef.current?.dispose();
      void audioContextRef.current?.close();
      browserSpeech?.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, []);

  const loadVoices = () => {
    if (!synthRef.current) return;
    voicesRef.current = synthRef.current.getVoices();
    selectedVoiceRef.current =
      voicesRef.current.find(
        (v) =>
          (v.lang === 'tr-TR' || v.lang.startsWith('tr')) &&
          (v.name.toLowerCase().includes('turkish') ||
            v.name.toLowerCase().includes('trk')),
      ) || voicesRef.current[0] ||
      null;
  };

  const fetchPodcastData = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${PODCAST_SHEET_ID}/gviz/tq?tqx=out:json&gid=${PODCAST_GID}&range=${PODCAST_RANGE}&headers=0`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Veri alınamadı');

      const text = await res.text();
      const jsonText = text.substring(
        text.indexOf('{'),
        text.lastIndexOf('}') + 1,
      );
      const data = JSON.parse(jsonText);

      if (!data.table || !data.table.rows) {
        throw new Error('Tablo verisi yok');
      }

      const rows: any[] = data.table.rows;

      let currentJournal = '';
      let currentArticles: Article[] = [];
      const groups: JournalGroup[] = [];
      const flatArticles: Article[] = [];

      rows.forEach((row, idx) => {
        const c = row.c || [];
        const titleA = c[0]?.v?.toString().trim() || '';
        const author = c[1]?.v?.toString().trim() || '';
        const date = c[3]?.v?.toString().trim() || '';
        const detailE = c[4]?.v?.toString().trim() || '';
        const pmid = c[5]?.v ? c[5].v.toString().trim() : '';

        const isJournalRow = JOURNAL_ROWS.includes(idx);

        if (isJournalRow) {
          // Önceki dergiyi kaydet
          if (currentJournal && currentArticles.length) {
            groups.push({ journal: currentJournal, articles: [...currentArticles] });
            flatArticles.push(...currentArticles);
          }
          currentJournal = titleA;
          currentArticles = [];
        } else if (titleA && titleA.length > 10) {
          // Makale satırı
          let pubmedLink = '';
          const match = detailE.match(/href=['"]([^'"]+)['"]/);
          if (match && match[1]) {
            pubmedLink = match[1];
          } else if (pmid) {
            pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${pmid}`;
          }

          const article: Article = {
            title: titleA,
            author,
            date,
            detailHtml: detailE,
            link: pubmedLink,
            pmid,
            journal: currentJournal,
          };
          currentArticles.push(article);
        }
      });

      // Son dergi grubunu ekle
      if (currentJournal && currentArticles.length) {
        groups.push({ journal: currentJournal, articles: [...currentArticles] });
        flatArticles.push(...currentArticles);
      }

      articlesRef.current = flatArticles;
      // Published MP3s are optional; a missing or stale manifest never blocks articles.
      void fetch('/podcast-audio/manifest.json', { cache: 'no-cache' })
        .then(async (response) => {
          if (!response.ok) throw new Error('No prepared audio manifest');
          return response.json();
        })
        .then((manifest: { version?: number; entries?: Record<string, { title: string; journal: string; pmid: string; file: string }> }) => {
          if (manifest.version !== 1 || !manifest.entries) return;
          const clips = new Map<string, string>();
          for (const entry of Object.values(manifest.entries)) {
            if (!/^[a-f0-9]{24}[.]mp3$/.test(entry.file)) continue;
            clips.set(JSON.stringify([entry.journal, entry.title, entry.pmid]),
              '/podcast-audio/' + entry.file);
          }
          readyClipsRef.current = clips;
          preloadReadyClip(0);
        })
        .catch(() => { /* live Ahenk remains the fallback */ });
      setJournalGroups(groups);
      setArticles(flatArticles);
      setLoadingMessage('');
      setStatus('Hazır');
      setCurrentIndex(0);
    } catch (err) {
      console.error(err);
      setLoadingMessage('Veriler alınamadı.');
      setStatus('Hata');
    }
  };

  const clipUrl = (article: Article | undefined) =>
    article ? readyClipsRef.current.get(JSON.stringify([
      article.journal, article.title, article.pmid || '',
    ])) : undefined;

  const preloadReadyClip = (index: number) => {
    const url = clipUrl(articlesRef.current[index]);
    if (!url) return;
    if (nextAudioRef.current?.src.endsWith(url)) return;
    nextAudioRef.current?.pause();
    const next = new Audio(url);
    next.preload = 'auto';
    next.load();
    nextAudioRef.current = next;
  };

  const stopOutputs = () => {
    const prepared = preparedAudioRef.current;
    if (prepared) {
      prepared.onended = null;
      prepared.onerror = null;
      prepared.pause();
      preparedAudioRef.current = null;
    }
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    synthRef.current?.cancel();
    const source = audioSourceRef.current;
    if (source) {
      source.onended = null;
      audioSourceRef.current = null;
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
    }
  };

  // Called synchronously inside the click, before the asynchronous model load.
  // This unlocks Web Audio on browsers that require a user gesture (notably iOS).
  const primeAudio = () => {
    try {
      if (!audioContextRef.current) {
        const context = new AudioContext();
        const gain = context.createGain();
        gain.gain.value = volumeRef.current;
        gain.connect(context.destination);
        audioContextRef.current = context;
        audioGainRef.current = gain;
      }
      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        void context.resume().catch(() => { /* browser fallback handles this */ });
      }
    } catch (error) {
      console.warn('Web Audio kullanılamıyor:', error);
    }
  };

  const finishArticle = (index: number, token: number) => {
    if (token !== playbackTokenRef.current) return;
    if (index + 1 < articlesRef.current.length) {
      void startSpeech(index + 1);
    } else {
      setIsPlaying(false);
      setStatus('Hazır');
    }
  };

  const speakWithBrowser = (index: number, token: number) => {
    const article = articlesRef.current[index];
    const synth = synthRef.current;
    if (!article || !synth || token !== playbackTokenRef.current) {
      setIsPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(article.title);
    utteranceRef.current = utterance;
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
      utterance.lang = selectedVoiceRef.current.lang || 'tr-TR';
    } else {
      utterance.lang = 'tr-TR';
    }
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = volumeRef.current;
    utterance.onend = () => finishArticle(index, token);
    utterance.onerror = () => {
      if (token !== playbackTokenRef.current) return;
      setIsPlaying(false);
      setStatus('Tarayıcı seslendirme hatası');
    };
    synth.speak(utterance);
    setStatus('Tarayıcı sesiyle okunuyor...');
  };

  const startSpeech = async (index: number) => {
    const article = articlesRef.current[index];
    if (!article) return;

    activeRequestRef.current?.abort();
    stopOutputs();
    const request = new AbortController();
    activeRequestRef.current = request;
    const token = ++playbackTokenRef.current;

    setCurrentIndex(index);
    setIsPlaying(true);
    if (engineRef.current === 'browser') {
      speakWithBrowser(index, token);
      return;
    }

    // Prefer ready MP3: no model download or per-device inference.
    const url = clipUrl(article);
    if (url) {
      const media = nextAudioRef.current?.src.endsWith(url)
        ? nextAudioRef.current : new Audio(url);
      nextAudioRef.current = null;
      media.preload = 'auto';
      media.volume = volumeRef.current;
      preparedAudioRef.current = media;
      media.onended = () => {
        if (token !== playbackTokenRef.current) return;
        preparedAudioRef.current = null;
        finishArticle(index, token);
      };
      media.onerror = () => {
        if (token !== playbackTokenRef.current) return;
        media.onerror = null;
        preparedAudioRef.current = null;
        void startAhenkSpeech(index, token, request.signal);
      };
      try {
        await media.play();
        if (request.signal.aborted || token !== playbackTokenRef.current) return;
        setStatus('Hazır Ahenk sesi oynatılıyor...');
        preloadReadyClip(index + 1);
        return;
      } catch (error) {
        console.warn('Hazır MP3 çalınamadı; canlı Ahenk kullanılacak:', error);
        media.onerror = null;
        media.pause();
        preparedAudioRef.current = null;
        if (request.signal.aborted || token !== playbackTokenRef.current) return;
      }
    }
    void startAhenkSpeech(index, token, request.signal);
  };

  const startAhenkSpeech = async (index: number, token: number, signal: AbortSignal) => {
    const article = articlesRef.current[index];
    if (!article || signal.aborted || token !== playbackTokenRef.current) return;
    setStatus('Ahenk sesi hazırlanıyor...');
    try {
      if (!ahenkClientRef.current) {
        ahenkClientRef.current = new AhenkCepClient(setAhenkLoad);
      }
      const { audio, sampleRate } = await ahenkClientRef.current.speak(
        prepareAhenkText(article.title),
        signal,
      );
      if (signal.aborted || token !== playbackTokenRef.current) return;

      const context = audioContextRef.current;
      const gain = audioGainRef.current;
      if (!context || !gain || !audio.length) {
        throw new Error('Ses oynatıcısı başlatılamadı.');
      }
      if (context.state === 'suspended') await context.resume();
      if (signal.aborted || token !== playbackTokenRef.current) return;

      const buffer = context.createBuffer(1, audio.length, sampleRate);
      buffer.getChannelData(0).set(audio);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.onended = () => {
        if (audioSourceRef.current === source) audioSourceRef.current = null;
        source.disconnect();
        finishArticle(index, token);
      };
      audioSourceRef.current = source;
      source.start();
      setStatus('Ahenk ile okunuyor...');
    } catch (error) {
      if (signal.aborted || token !== playbackTokenRef.current) return;
      console.warn('Ahenk seslendirme başarısız; tarayıcı sesine geçiliyor:', error);
      setStatus('Ahenk açılamadı; tarayıcı sesi kullanılacak.');
      speakWithBrowser(index, token);
    }
  };

  const handlePlay = () => {
    if (!articlesRef.current.length) return;
    primeAudio();
    void startSpeech(currentIndex);
  };

  const handleStop = () => {
    activeRequestRef.current?.abort();
    playbackTokenRef.current += 1;
    stopOutputs();
    setIsPlaying(false);
    setStatus('Durduruldu');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    volumeRef.current = newVolume;
    if (audioGainRef.current) audioGainRef.current.gain.value = newVolume;
    if (preparedAudioRef.current) preparedAudioRef.current.volume = newVolume;
    if (utteranceRef.current) utteranceRef.current.volume = newVolume;
  };

  const handleVoiceEngineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleStop();
    const engine = e.target.value === 'browser' ? 'browser' : 'ahenk';
    engineRef.current = engine;
    setVoiceEngine(engine);
    setStatus('Hazır');
  };

  const handleCardClick = (index: number) => {
    primeAudio();
    void startSpeech(index);
  };

  // Mobilde büyük sabit menü ve oynatıcı varken otomatik kaydırma,
  // okunmakta olan başlığı menünün altına gizliyordu. Mobilde ekrana dokunmayalım:
  // başlık, menünün altına konumlandırılan oynatıcıda hep görünür.
  // Masaüstünde seçilen kartı hem menünün hem oynatıcının ALTINDA göster.
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) return;

    const el = document.querySelector<HTMLElement>(
      `[data-article-index="${currentIndex}"]`,
    );
    if (!el) return;

    const headerHeight =
      document.querySelector<HTMLElement>('header[role="banner"]')
        ?.getBoundingClientRect().height ?? 64;
    const playerHeight = playerRef.current?.getBoundingClientRect().height ?? 0;

    window.scrollTo({
      top: getPodcastArticleScrollTop({
        scrollY: window.scrollY,
        articleViewportTop: el.getBoundingClientRect().top,
        headerHeight,
        playerHeight,
      }),
      behavior: 'smooth',
    });
  }, [currentIndex]);

  const currentArticle = articles[currentIndex];
  const currentTitle =
    currentArticle?.title ||
    'Makale başlıklarını Türkçe dinlemek için oynat düğmesine tıklayın';
  const currentJournal = currentArticle?.journal || 'Dergi Adı';
  const currentPMID = currentArticle?.pmid || '';

  return (
    <div className="min-h-screen bg-gray-100">
      <PageContainer>
        <div className="max-w-6xl mx-auto">
          {/* Üst başlık */}
          <div className="bg-gradient-to-r from-[#007bff] to-[#00bfff] text-white p-6 rounded-xl mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">
              Günlük Patoloji Makaleleri
            </h1>
            <p className="text-sm mb-2">Her güne özel sesli podcast</p>
            <span className="inline-block bg-white/10 px-4 py-1 rounded-full text-xs font-medium">
              {today}
            </span>
          </div>

          {/* Üstte sabit player benzeri kutu */}
          <div
            ref={playerRef}
            className="bg-white rounded-xl shadow-md border border-gray-200 px-4 py-3 sm:px-6 sm:py-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-[5.5rem] md:top-[4.5rem] z-10"
          >
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#336699] bg-[#eef4ff] px-3 py-1 rounded-full w-fit">
                📘 {currentJournal}
              </span>
              <div className="bg-[#eef7ff] border border-[#c7e1ff] rounded-lg px-4 py-3 text-sm md:text-base">
                {currentTitle}
              </div>
              {currentPMID && (
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/${currentPMID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#336699] underline mt-1 w-fit"
                >
                  PubMed: {currentPMID}
                </a>
              )}
              {loadingMessage && (
                <span className="text-xs text-gray-500 italic">
                  {loadingMessage}
                </span>
              )}
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                Ses motoru
                <select
                  value={voiceEngine}
                  onChange={handleVoiceEngineChange}
                  aria-label="Ses motoru seçimi"
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800"
                >
                  <option value="ahenk">Ahenk Cep · Türkçe yapay ses</option>
                  <option value="browser">Tarayıcı sesi</option>
                </select>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handlePlay}
                  disabled={!articles.length || isPlaying}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#336699] text-white text-sm font-semibold hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Play size={16} />
                  Oynat
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isPlaying}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#fb7185] text-white text-sm font-semibold hover:bg-[#e11d48] disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Square size={16} />
                  Durdur
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Volume2 size={18} />
                <span>Ses seviyesi</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
              {voiceEngine === 'ahenk' && isPlaying && ahenkLoad.phase === 'loading' && (
                <div className="w-full max-w-64" role="status" aria-live="polite">
                  <div className="mb-1 flex justify-between gap-2 text-[11px] text-gray-600">
                    <span>{ahenkLoad.detail}</span>
                    <span>{ahenkLoad.percent}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Ahenk model yükleme"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={ahenkLoad.percent}
                    className="h-1.5 overflow-hidden rounded-full bg-gray-200"
                  >
                    <div
                      className="h-full rounded-full bg-[#336699] transition-all duration-300"
                      style={{ width: ahenkLoad.percent + '%' }}
                    />
                  </div>
                </div>
              )}
              {voiceEngine === 'ahenk' && ahenkLoad.phase === 'error' && (
                <p className="max-w-64 text-[11px] text-amber-700">
                  Ahenk yüklenemedi; tarayıcı sesine geçiliyor. Yeniden Oynat ile tekrar deneyebilirsiniz.
                </p>
              )}
              <div className="text-[11px] text-gray-500 italic">{status}</div>
            </div>
          </div>

          {/* Dergi grupları + kartlar */}
          <div className="podcast-articles-section">
            {journalGroups.map((group) => {
              // global index için
              let baseIndex = 0;
              journalGroups
                .slice(0, journalGroups.indexOf(group))
                .forEach((g) => (baseIndex += g.articles.length));

              return (
                <div
                  key={group.journal}
                  className="podcast-journal-group"
                >
                  <div className="podcast-journal-title">
                    <span className="podcast-journal-bullet" />
                    <span>{group.journal}</span>
                  </div>
                  <div className="podcast-articles-grid">
                    {group.articles.map((article, idx) => {
                      const globalIndex = baseIndex + idx;
                      const isActive = globalIndex === currentIndex;
                      return (
                        <div
                          key={`${group.journal}-${idx}`}
                          data-article-index={globalIndex}
                          className={
                            'podcast-article-card' +
                            (isActive ? ' podcast-article-card-active' : '')
                          }
                          onClick={() => handleCardClick(globalIndex)}
                        >
                          <div className="podcast-article-title">
                            {article.title}
                          </div>
                          <div className="podcast-article-meta">
                            {article.author && (
                              <span className="podcast-meta-item">
                                {article.author}
                              </span>
                            )}
                            {article.date && (
                              <span className="podcast-meta-item">
                                {article.date}
                              </span>
                            )}
                            {article.pmid && (
                              <span className="podcast-meta-item">
                                PMID {article.pmid}
                              </span>
                            )}
                          </div>
                          <div className="podcast-article-badges">
                            {article.link && (
                              <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="podcast-link-badge"
                                onClick={(e) => e.stopPropagation()}
                              >
                                PubMed
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs leading-relaxed text-gray-600">
            <p>
              Ahenk Cep ile oluşturulan sesler yapay zekâ tarafından üretilir; gerçek bir
              kişinin ses kaydı değildir. Metin ve ses işlemesi cihazınızda yapılır.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium text-[#336699]">
                Ses modeli, telif ve lisans atıfları
              </summary>
              <div className="mt-2 space-y-2">
                <p>
                  <a href="https://github.com/ozguradmin/ahenk-turkish-tts"
                    target="_blank" rel="noopener noreferrer" className="underline">Ahenk Cep / Ahenk</a>
                  {' '}ses modeli: CC BY 4.0; uygulama kodu ve trnorm: Apache-2.0.
                  Tasarlanmış sentetik ses f022 kullanılır.
                </p>
                <p>
                  Temel model:{' '}
                  <a href="https://huggingface.co/canberkkkkkk/ema-lightning"
                    target="_blank" rel="noopener noreferrer" className="underline">EMA Lightning</a>
                  {' '}(Apache-2.0). Kaynak veri atıfları:{' '}
                  <a href="https://huggingface.co/datasets/cloud0day3/alania-synthetic-speech-tr"
                    target="_blank" rel="noopener noreferrer" className="underline">Alania Turkish Synthetic Speech</a>
                  {' '}ve{' '}
                  <a href="https://huggingface.co/datasets/cloud0day3/alania-domain-text-tr"
                    target="_blank" rel="noopener noreferrer" className="underline">Alania Turkish Domain Text</a>
                  {' '}by PatientDesk AI (CC BY 4.0).
                </p>
                <p>
                  <a href="https://huggingface.co/ozgurguler/ahenk-cep-tr"
                    target="_blank" rel="noopener noreferrer" className="underline">Model kartı ve lisans</a>
                  {' '}·{' '}
                  <a href="https://github.com/metinciris/metinciriscomtr/blob/main/docs/PODCAST-AHENK-CEP.md"
                    target="_blank" rel="noopener noreferrer" className="underline">Entegrasyon ve atıflar</a>
                </p>
              </div>
            </details>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
