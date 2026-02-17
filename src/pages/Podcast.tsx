import { useEffect, useState, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Play, Square, Volume2 } from 'lucide-react';
import '../styles/Podcast.css';

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
  const [loadingMessage, setLoadingMessage] = useState(
    "Google Sheets'ten veriler yükleniyor...",
  );

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const volumeRef = useRef(volume);

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
    // Speech Synthesis hazırla
    synthRef.current = window.speechSynthesis;
    loadVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    // Makale verisini çek
    fetchPodcastData();

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
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

  const speak = (index: number) => {
    const article = articles[index];
    if (!article || !synthRef.current) return;

    if (utteranceRef.current) {
      synthRef.current.cancel();
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
    utterance.pitch = 1.0;
    utterance.volume = volumeRef.current;

    utterance.onend = () => {
      if (index < articles.length - 1) {
        const nextIndex = index + 1;
        setCurrentIndex(nextIndex);
        speak(nextIndex);
      } else {
        setIsPlaying(false);
        setStatus('Hazır');
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setStatus('Sesli okuma hatası');
    };

    synthRef.current.speak(utterance);
    setIsPlaying(true);
    setStatus('Okunuyor...');
  };

  const handlePlay = () => {
    if (!articles.length) return;
    speak(currentIndex);
  };

  const handleStop = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setStatus('Durduruldu');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  };

  const handleCardClick = (index: number) => {
    setCurrentIndex(index);
    speak(index);
  };

  // Seçili kartı merkeze kaydır
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(
      `[data-article-index="${currentIndex}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          <div className="bg-white rounded-xl shadow-md border border-gray-200 px-6 py-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-4 z-10">
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
        </div>
      </PageContainer>
    </div>
  );
}
