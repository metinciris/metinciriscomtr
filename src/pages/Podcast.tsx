// src/pages/Podcast.tsx
import { useEffect, useState, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react';

interface PodcastProps {
  onNavigate: (page: string) => void; // App ile uyum için, bu sayfada kullanmıyoruz
}

interface JournalMapping {
  start: number;
  end: number;
  name: string;
}

const journalMapping: JournalMapping[] = [
  { start: 2, end: 11, name: 'Modern Pathology' },
  { start: 13, end: 22, name: 'Histopathology' },
  { start: 24, end: 33, name: 'American Journal of Surgical Pathology' },
  { start: 35, end: 44, name: 'Human Pathology' },
  { start: 46, end: 55, name: 'Virchows Archiv' },
  { start: 57, end: 66, name: 'Journal of Pathology' },
  { start: 68, end: 77, name: 'Annals of Diagnostic Pathology' },
  { start: 79, end: 88, name: 'Diagnostic Pathology' },
  { start: 90, end: 99, name: 'Pathology International' },
  { start: 101, end: 110, name: 'Pathology Research and Practice' },
  {
    start: 112,
    end: 121,
    name: 'International Journal of Surgical Pathology',
  },
  {
    start: 123,
    end: 131,
    name: 'American Journal of Clinical Pathology',
  },
];

const PODCAST_SHEET_ID = '148p3M41R52gVVjtLSF2Qh8rJvBPEWJ7SV4lgSBQYwLc';

export default function Podcast({}: PodcastProps) {
  const [articleTitles, setArticleTitles] = useState<string[]>([]);
  const [articleJournals, setArticleJournals] = useState<string[]>([]);
  const [articlePMIDs, setArticlePMIDs] = useState<string[]>([]);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [status, setStatus] = useState('Hazır');
  const [loadingMessage, setLoadingMessage] = useState(
    "Google Sheets'ten veriler yükleniyor...",
  );

  // Alt kısımdaki büyük HTML bloğu
  const [htmlContent, setHtmlContent] = useState<string>('');

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    // Speech Synthesis
    synthRef.current = window.speechSynthesis;
    loadVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    // Google Charts ile alt HTML verisini çek
    loadGoogleCharts();

    // Podcast başlık/PMID verileri
    fetchPodcastData();

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const loadVoices = () => {
    if (synthRef.current) {
      voicesRef.current = synthRef.current.getVoices();
      selectedVoiceRef.current =
        voicesRef.current.find((v) => v.lang.startsWith('tr')) ||
        voicesRef.current[0];
    }
  };

  const loadGoogleCharts = () => {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      // Eski, çalışan yapı: corechart paketi
      (window as any).google.charts.load('current', { packages: ['corechart'] });
      (window as any).google.charts.setOnLoadCallback(loadHtmlBlock);
    };
    document.body.appendChild(script);
  };

  // Eski Profil.tsx gibi A1:A20 aralığını çek ama tablo çizme; tek HTML bloğu yap
  const loadHtmlBlock = () => {
    const query = new (window as any).google.visualization.Query(
      `https://docs.google.com/spreadsheets/d/${PODCAST_SHEET_ID}/gviz/tq?gid=1844098177&range=A1:A20`,
    );

    query.send((response: any) => {
      if (response.isError()) {
        console.error('HTML hücreleri çekilemedi:', response.getMessage());
        return;
      }

      const responseData = response.getDataTable();
      const parts: string[] = [];

      for (let i = 0; i < responseData.getNumberOfRows(); i++) {
        const value = responseData.getValue(i, 0);
        if (typeof value === 'string' && value.trim().length > 0) {
          parts.push(value);
        }
      }

      // Tüm satırları tek bir HTML string olarak birleştir
      setHtmlContent(parts.join(''));
    });
  };

  const fetchPodcastData = async () => {
    try {
      const SHEET_GID = '1109640564';
      const SHEET_RANGE = 'A1:F132';

      const url = `https://docs.google.com/spreadsheets/d/${PODCAST_SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}&range=${SHEET_RANGE}`;
      const response = await fetch(url);
      const responseText = await response.text();
      const jsonText = responseText.substring(
        responseText.indexOf('(') + 1,
        responseText.lastIndexOf(')'),
      );
      const data = JSON.parse(jsonText);

      if (data.table && data.table.rows) {
        const titles: string[] = [];
        const journals: string[] = [];
        const pmids: string[] = [];

        data.table.rows.forEach((row: any, index: number) => {
          const title = row.c[0]?.v?.toString().trim() || '';
          const pmid = row.c[5]?.v ? row.c[5].v.toString().trim() : '';

          if (title && pmid) {
            const rowNum = index + 2;
            let journal = '';

            for (const mapping of journalMapping) {
              if (rowNum >= mapping.start && rowNum <= mapping.end) {
                journal = mapping.name;
                break;
              }
            }

            titles.push(title);
            journals.push(journal);
            pmids.push(pmid);
          }
        });

        setArticleTitles(titles);
        setArticleJournals(journals);
        setArticlePMIDs(pmids);
        setLoadingMessage('');
        setStatus('Hazır');
      }
    } catch (e) {
      console.error(e);
      setLoadingMessage('Veriler alınamadı - demo başlıklar kullanılıyor');
    }
  };

  const createUtterance = (text: string) => {
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    if (selectedVoiceRef.current) {
      utteranceRef.current.voice = selectedVoiceRef.current;
    }
    utteranceRef.current.lang = 'tr-TR';
    utteranceRef.current.rate = 0.9;
    utteranceRef.current.volume = volume;

    utteranceRef.current.onend = () => {
      if (!isPaused && currentTitleIndex < articleTitles.length - 1) {
        setCurrentTitleIndex((prev) => prev + 1);
        speakNextTitle(currentTitleIndex + 1);
      } else {
        setIsPlaying(false);
        setStatus('Hazır');
      }
    };
  };

  const speakNextTitle = (index: number) => {
    if (articleTitles[index] && synthRef.current) {
      createUtterance(articleTitles[index]);
      synthRef.current.speak(utteranceRef.current!);
      setStatus('Konuşuyor...');
      setIsPlaying(true);
    }
  };

  const handlePlay = () => {
    if (synthRef.current && articleTitles.length > 0) {
      if (synthRef.current.speaking && isPaused) {
        synthRef.current.resume();
        setIsPaused(false);
        setIsPlaying(true);
        setStatus('Konuşuyor...');
      } else {
        speakNextTitle(currentTitleIndex);
      }
    }
  };

  const handlePause = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
      setStatus('Duraklatıldı');
    }
  };

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPaused(false);
      setIsPlaying(false);
      setStatus('Hazır');
    }
  };

  const handlePrevious = () => {
    if (currentTitleIndex > 0) {
      setCurrentTitleIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentTitleIndex < articleTitles.length - 1) {
      setCurrentTitleIndex((prev) => prev + 1);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  };

  const currentTitle =
    articleTitles[currentTitleIndex] ||
    'Makale başlıklarını Türkçe dinlemek için oynat düğmesine tıklayın';
  const currentJournal = articleJournals[currentTitleIndex] || 'Dergi Adı';
  const currentPMID = articlePMIDs[currentTitleIndex] || '';

  return (
    <div className="min-h-screen bg-gray-100">
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          {/* Üst başlık */}
          <div className="bg-gradient-to-r from-[#007bff] to-[#00bfff] text-white p-6 rounded-xl mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">
              Güncel Patoloji Makaleleri Podcast
            </h1>
            <p className="text-sm">
              Seçili dergilerden PubMed&apos;e yeni düşen makalelerin başlıklarını
              Türkçe sesli dinleyin.
            </p>
          </div>

          {/* Podcast Player */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="mb-4">
              <span className="bg-[#336699] text-white px-4 py-2 rounded inline-block text-sm">
                {currentJournal}
              </span>
            </div>

            <div className="bg-[#eef7ff] border-2 border-[#c7e1ff] rounded-lg p-6 mb-4 min-h-[120px] flex items-center justify-center text-center">
              <p className="text-sm sm:text-base">{currentTitle}</p>
            </div>

            {currentPMID && (
              <div className="mb-4">
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/${currentPMID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#336699] bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 inline-block text-sm"
                >
                  PubMed: {currentPMID}
                </a>
              </div>
            )}

            {loadingMessage && (
              <div className="text-gray-600 italic mb-4 text-sm">
                {loadingMessage}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={handlePlay}
                disabled={articleTitles.length === 0 || isPlaying}
                className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <Play size={16} /> Oynat
              </button>
              <button
                onClick={handlePause}
                disabled={!isPlaying}
                className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <Pause size={16} /> Duraklat
              </button>
              <button
                onClick={handleStop}
                disabled={!isPlaying}
                className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <Square size={16} /> Durdur
              </button>
              <button
                onClick={handlePrevious}
                disabled={currentTitleIndex === 0 || isPlaying}
                className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <SkipBack size={16} /> Önceki
              </button>
              <button
                onClick={handleNext}
                disabled={
                  currentTitleIndex >= articleTitles.length - 1 || isPlaying
                }
                className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <SkipForward size={16} /> Sonraki
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 text-sm">
              <Volume2 size={20} />
              <span>Ses Seviyesi:</span>
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

            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>
                {articleTitles.length > 0
                  ? `${currentTitleIndex + 1}/${articleTitles.length} makale`
                  : 'Makale yükleniyor...'}
              </span>
            </div>

            <div className="text-xs text-gray-600 italic">{status}</div>
          </div>

          {/* Alt HTML blok: dergi + makale listeleri */}
          {htmlContent && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <div
                className="text-sm leading-relaxed podcast-html-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
