import { useEffect, useState, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2 } from 'lucide-react';

interface ProfilProps {
  onNavigate: (page: string) => void;
}

interface JournalMapping {
  start: number;
  end: number;
  name: string;
}

export default function Profil({ onNavigate }: ProfilProps) {
  const [articleTitles, setArticleTitles] = useState<string[]>([]);
  const [articleJournals, setArticleJournals] = useState<string[]>([]);
  const [articlePMIDs, setArticlePMIDs] = useState<string[]>([]);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [status, setStatus] = useState('Hazır');
  const [loadingMessage, setLoadingMessage] = useState('Google Sheets\'ten veriler yükleniyor...');
  const [tableData, setTableData] = useState<string[]>([]);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const journalMapping: JournalMapping[] = [
    { start: 2, end: 11, name: "Modern Pathology" },
    { start: 13, end: 22, name: "Histopathology" },
    { start: 24, end: 33, name: "American Journal of Surgical Pathology" },
    { start: 35, end: 44, name: "Human Pathology" },
    { start: 46, end: 55, name: "Virchows Archiv" },
    { start: 57, end: 66, name: "Journal of Pathology" },
    { start: 68, end: 77, name: "Annals of Diagnostic Pathology" },
    { start: 79, end: 88, name: "Diagnostic Pathology" },
    { start: 90, end: 99, name: "Pathology International" },
    { start: 101, end: 110, name: "Pathology Research and Practice" },
    { start: 112, end: 121, name: "International Journal of Surgical Pathology" },
    { start: 123, end: 131, name: "American Journal of Clinical Pathology" }
  ];

  useEffect(() => {
    // Initialize Speech Synthesis
    synthRef.current = window.speechSynthesis;
    loadVoices();
    
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    // Load Google Charts and data
    loadGoogleCharts();
    
    // Fetch podcast data
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
      selectedVoiceRef.current = voicesRef.current.find(v => v.lang.startsWith('tr')) || voicesRef.current[0];
    }
  };

  const loadGoogleCharts = () => {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      (window as any).google.charts.load('current', { packages: ['corechart'] });
      (window as any).google.charts.setOnLoadCallback(loadTableData);
    };
    document.body.appendChild(script);
  };

  const loadTableData = () => {
    const sheetID = '148p3M41R52gVVjtLSF2Qh8rJvBPEWJ7SV4lgSBQYwLc';
    const query = new (window as any).google.visualization.Query(
      `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?gid=1844098177&range=A1:A20`
    );
    
    query.send((response: any) => {
      if (response.isError()) {
        console.error('Veri çekilemedi');
        return;
      }
      
      const responseData = response.getDataTable();
      const data: string[] = [];
      
      for (let i = 0; i < responseData.getNumberOfRows(); i++) {
        data.push(responseData.getValue(i, 0));
      }
      
      setTableData(data);
    });
  };

  const fetchPodcastData = async () => {
    try {
      const SHEET_ID = '148p3M41R52gVVjtLSF2Qh8rJvBPEWJ7SV4lgSBQYwLc';
      const SHEET_GID = '1109640564';
      const SHEET_RANGE = 'A1:F132';
      
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}&range=${SHEET_RANGE}`;
      const response = await fetch(url);
      const responseText = await response.text();
      const jsonText = responseText.substring(responseText.indexOf('(') + 1, responseText.lastIndexOf(')'));
      const data = JSON.parse(jsonText);

      if (data.table && data.table.rows) {
        const titles: string[] = [];
        const journals: string[] = [];
        const pmids: string[] = [];

        data.table.rows.forEach((row: any, index: number) => {
          const title = row.c[0]?.v?.toString().trim() || "";
          const pmid = row.c[5]?.v ? row.c[5].v.toString().trim() : "";
          
          if (title && pmid) {
            const rowNum = index + 2;
            let journal = "";
            
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
        setCurrentTitleIndex(prev => prev + 1);
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
      setCurrentTitleIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentTitleIndex < articleTitles.length - 1) {
      setCurrentTitleIndex(prev => prev + 1);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  };

  const currentTitle = articleTitles[currentTitleIndex] || 'Makale başlıklarını Türkçe dinlemek için oynat düğmesine tıklayın';
  const currentJournal = articleJournals[currentTitleIndex] || 'Dergi Adı';
  const currentPMID = articlePMIDs[currentTitleIndex] || '';

  return (
    <div className="min-h-screen bg-gray-100">
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-[#007bff] to-[#00bfff] text-white p-8 rounded-xl mb-8 text-center">
            <h1 className="mb-4">Prof. Dr. Metin Çiriş</h1>
            <p>Tıbbi Patoloji Uzmanı | SDÜ Tıp Fakültesi</p>
          </div>

          {/* Profile Image */}
          <div className="text-center mb-8">
            <ImageWithFallback
              src="https://w3.sdu.edu.tr/foto.aspx?sicil_no=02956"
              alt="Prof. Dr. Metin Çiriş"
              className="w-40 h-40 rounded-full mx-auto object-cover shadow-lg"
            />
          </div>

          {/* Contact Info */}
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <div className="space-y-3">
              <p>
                <strong>Web Sitem:</strong>{' '}
                <a href="http://metinciris.com.tr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  metinciris.com.tr
                </a>
              </p>
              <p>
                <strong>Üniversite Sayfam:</strong>{' '}
                <a href="https://w3.sdu.edu.tr/personel/02956" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  w3.sdu.edu.tr/personel/02956
                </a>
              </p>
              <p>
                <strong>Adres:</strong>{' '}
                <a href="https://tinyurl.com/haritapatoloji" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Süleyman Demirel Ü. Tıp Fakültesi Tıbbi Patoloji A.D. 32260 Merkez / Isparta
                </a>
              </p>
              <p><strong>Telefon:</strong> +90 505 519 9***</p>
              <p><strong>Email:</strong> metin(at)metinciris.com.tr</p>
              <p><strong>Email:</strong> ibrahimciris(at)sdu.edu.tr</p>
            </div>

            {/* Podcast Player */}
            <div className="mt-8 border-t pt-8">
              <h3 className="mb-4">Güncel Makaleler Podcast</h3>
              
              <div className="bg-[#336699] text-white px-4 py-2 rounded inline-block mb-4">
                {currentJournal}
              </div>

              <div className="bg-[#eef7ff] border-2 border-[#c7e1ff] rounded-lg p-6 mb-4 min-h-[120px] flex items-center justify-center text-center">
                <p>{currentTitle}</p>
              </div>

              {currentPMID && (
                <div className="mb-4">
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${currentPMID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#336699] bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 inline-block"
                  >
                    PubMed: {currentPMID}
                  </a>
                </div>
              )}

              {loadingMessage && (
                <div className="text-gray-600 italic mb-4">{loadingMessage}</div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={handlePlay}
                  disabled={articleTitles.length === 0 || isPlaying}
                  className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Play size={16} /> Oynat
                </button>
                <button
                  onClick={handlePause}
                  disabled={!isPlaying}
                  className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Pause size={16} /> Duraklat
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isPlaying}
                  className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Square size={16} /> Durdur
                </button>
                <button
                  onClick={handlePrevious}
                  disabled={currentTitleIndex === 0 || isPlaying}
                  className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <SkipBack size={16} /> Önceki
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentTitleIndex >= articleTitles.length - 1 || isPlaying}
                  className="bg-[#336699] text-white px-4 py-2 rounded hover:bg-[#264d73] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <SkipForward size={16} /> Sonraki
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Volume2 size={20} />
                <label className="text-sm">Ses Seviyesi:</label>
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

              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{currentTitleIndex + 1}/{articleTitles.length} makale</span>
              </div>

              <div className="text-sm text-gray-600 italic">{status}</div>
            </div>
          </div>

          {/* Data Table */}
          {tableData.length > 0 && (
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
              <table className="w-full">
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index}>
                      <td 
                        className="py-2 border-b" 
                        dangerouslySetInnerHTML={{ __html: row }}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signature */}
          <div className="text-right mb-8">
            <ImageWithFallback
              src="https://metinciris.com.tr/img/imza.png"
              alt="İmza"
              className="max-w-[200px] h-auto ml-auto"
            />
          </div>

          {/* Social Links */}
          <div className="bg-white p-8 rounded-lg shadow-md mb-8 text-center">
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://fb.com/patoloji" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Facebook Patoloji
              </a>
              <a href="https://fb.com/sdutip" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Facebook Kişisel
              </a>
              <a href="https://linkedin.com/in/patoloji/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                LinkedIn
              </a>
              <a href="https://youtube.com/c/Metin%C3%87iri%C5%9F" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                YouTube
              </a>
              <a href="https://github.com/metinciris" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                GitHub
              </a>
              <a href="https://metinciris.com.tr/#!/url=ozgecmis.php" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Portfolyo
              </a>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
