import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { MetroTile } from '../components/MetroTile';
import {
  MessageSquare,
  FileText,
  BookOpen,
  Utensils,
  GraduationCap,
  Briefcase,
  BookMarked,
  Facebook,
  Building2,
  FolderOpen,
  Linkedin,
  Github,
  Phone,
  Headphones,
} from 'lucide-react';
import './Home.css';

interface HomeProps {
  onNavigate: (page: string) => void;
}

/* --- KISA, TEK SATIRLIK DÖNEN AÇIKLAMALAR --- */

// Öğrenci
const TIP_SUBTITLES = ['Ders slaytları', 'Özet notlar', 'Güncel müfredat'];
const ILETISIM_SUBTITLES = [
  'Prof. Dr. Metin Çiriş',
  'Adres',
  'E-posta',
  'Sosyal medya',
  'LinkedIn iletişim',
];
const DIS_SUBTITLES = ['Slaytlar', 'Ders materyali'];
const ECZA_SUBTITLES = ['Slaytlar', 'Ders materyali'];
const BLOG_SUBTITLES = ['Vaka yazıları', 'Yazılım & eğitim', 'Güncel notlar'];
const GALERI_SUBTITLES = [
  'Sanal mikroskop',
  'Histopatoloji vakaları',
  'Dijital slide arşivi',
];

// Akademik
const YAYIN_SUBTITLES = [
  'Makale listesi',
  'PubMed bağlantıları',
  'Güncel yayınlar',
];
const PORTFOLYO_SUBTITLES = [
  'Kısaca ben',
  'Uzmanlıklarım',
  'Baktığım biyopsiler',
    'Akademik geçmiş',
];
const DIGER_SUBTITLES = ['Raporlama', 'Patoloji için'];

/* --- KISA DÖNEN METİN HOOK'U --- */
function useRotatingText(texts: string[], intervalMs: number): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!texts || texts.length <= 1) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [texts, intervalMs]);

  return texts[index] ?? '';
}

/* Küçük yardımcı: yazıyı tek satırda tutmak için kısaltma */
function shorten(text: string, max: number): string {
  if (!text) return '';
  return text.length <= max ? text : text.slice(0, max - 3) + '...';
}

/* --- PODCAST KAROSU İÇİN SHEET'TEN BAŞLIK ÇEKEN HOOK --- */

const PODCAST_SHEET_ID = '148p3M41R52gVVjtLSF2Qh8rJvBPEWJ7SV4lgSBQYwLc';
const PODCAST_GID = '1109640564';
const PODCAST_RANGE = 'A1:F132';

function usePodcastRotatingTitle(intervalMs: number): string {
  const [titles, setTitles] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  // Başlıkları bir kez çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${PODCAST_SHEET_ID}/gviz/tq?tqx=out:json&gid=${PODCAST_GID}&range=${PODCAST_RANGE}`;
        const res = await fetch(url);
        const text = await res.text();
        const jsonText = text.substring(
          text.indexOf('(') + 1,
          text.lastIndexOf(')'),
        );
        const data = JSON.parse(jsonText);

        const collected: string[] = [];
        if (data.table && data.table.rows) {
          data.table.rows.forEach((row: any) => {
            const title = row.c[0]?.v?.toString().trim();
            if (title) {
              collected.push(title);
            }
          });
        }

        if (collected.length > 0) {
          // Her sayfa yüklemesinde rastgele bir başlangıç index'i
          const startIndex = Math.floor(Math.random() * collected.length);
          setTitles(collected);
          setIndex(startIndex);
        }
      } catch (e) {
        console.error('Podcast başlıkları alınamadı', e);
      }
    };

    fetchData();
  }, []);

  // 10 sn'de bir sonraki başlığa geç
  useEffect(() => {
    if (!titles.length) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % titles.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [titles, intervalMs]);

  if (!titles.length) return '';
  return titles[index] ?? '';
}

/* --- HAVA DURUMU TİP VE YARDIMCI FONKSİYONLAR --- */

type WeatherVariant =
  | 'day'
  | 'night'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'fog'
  | 'cloudy';

type WeatherState = {
  temp: number | null;
  icon: string;
  variant: WeatherVariant;
};

// Kod + gündüz/gece bilgisinden tema seç
function getWeatherVariant(code?: number, isDay?: boolean): WeatherVariant {
  if (code === undefined || code === null) return isDay ? 'day' : 'night';

  if (code === 45 || code === 48) return 'fog'; // sis

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    // yağmur / sağanak / donan yağmur
    return 'rain';
  }

  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    // kar / kar sağanağı
    return 'snow';
  }

  if (code >= 95) {
    // gök gürültülü fırtına
    return 'storm';
  }

  if (!isDay) return 'night';
  if (code === 3) return 'cloudy';

  return 'day';
}

// Open-Meteo weather_code + is_day -> emoji
function getWeatherIcon(code?: number, isDay?: boolean): string {
  if (code === undefined || code === null) {
    return isDay ? '🌤️' : '🌙';
  }

  // gece ikonları
  if (!isDay) {
    if (code === 0 || code === 1 || code === 2) return '🌙';
    if (code === 3) return '☁️';
  }

  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';

  if (code >= 51 && code <= 55) return '🌦️'; // hafif yağmur
  if (code >= 56 && code <= 57) return '🌧️'; // donan çise
  if (code >= 61 && code <= 65) return '🌧️'; // yağmur
  if (code >= 66 && code <= 67) return '🌧️'; // donan yağmur

  if (code >= 71 && code <= 77) return '❄️'; // kar
  if (code >= 80 && code <= 82) return '🌦️'; // sağanak
  if (code >= 85 && code <= 86) return '🌨️'; // kar sağanağı

  if (code >= 95 && code <= 99) return '⛈️'; // gök gürültülü

  return isDay ? '🌤️' : '🌙';
}

export function Home({ onNavigate }: HomeProps) {
  // Dönen alt açıklamalar
  const tipSubtitle = useRotatingText(TIP_SUBTITLES, 4000);
  const iletisimSubtitle = useRotatingText(ILETISIM_SUBTITLES, 4000);
  const disSubtitle = useRotatingText(DIS_SUBTITLES, 4000);
  const eczaSubtitle = useRotatingText(ECZA_SUBTITLES, 4000);
  const blogSubtitle = useRotatingText(BLOG_SUBTITLES, 4000);
  const galeriSubtitle = useRotatingText(GALERI_SUBTITLES, 4000);

  const yayinSubtitle = useRotatingText(YAYIN_SUBTITLES, 4000);
  const portfolyoSubtitle = useRotatingText(PORTFOLYO_SUBTITLES, 4000);
  const digerSubtitle = useRotatingText(DIGER_SUBTITLES, 4000);

  // Podcast karosu için canlı başlık
  const podcastDynamicTitle = usePodcastRotatingTitle(10000);
  const podcastSubtitle =
    podcastDynamicTitle && podcastDynamicTitle.trim().length > 0
      ? shorten(podcastDynamicTitle, 80)
      : 'Güncel makale başlıkları';

  // Hava durumu (Isparta) – Open-Meteo
  const [weather, setWeather] = useState<WeatherState>({
    temp: null,
    icon: '🌤️',
    variant: 'day',
  });

  useEffect(() => {
    const lat = 37.76; // Isparta civarı
    const lon = 30.55;

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,is_day` +
      `&timezone=Europe%2FIstanbul`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const current = data.current || data.current_weather;
        if (!current) return;

        const tempRaw =
          typeof current.temperature_2m === 'number'
            ? current.temperature_2m
            : current.temperature;

        const codeRaw =
          typeof current.weather_code === 'number'
            ? current.weather_code
            : current.weathercode;

        const isDay =
          current.is_day === 1 ||
          current.is_day === true ||
          current.is_day === '1';

        const variant = getWeatherVariant(codeRaw, isDay);
        const icon = getWeatherIcon(codeRaw, isDay);

        setWeather({
          temp: typeof tempRaw === 'number' ? Math.round(tempRaw) : null,
          icon,
          variant,
        });
      })
      .catch(() => {
        // Hata olursa mevcut state kalsın
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* HASTA Bölümü */}
          <div>
            <h2 className="mb-6 text-2xl font-bold">Hasta</h2>
            <div className="grid grid-cols-2 gap-4">
              <MetroTile
                title="İletişim"
                subtitle={iletisimSubtitle}
                icon={<Phone size={40} />}
                color="bg-[#00A6D6]"
                size="wide"
                onClick={() => onNavigate('iletisim')}
              />
              <MetroTile
                title="Ziyaret Mesajı"
                subtitle=""
                icon={<MessageSquare size={40} />}
                color="bg-[#FF8C00]"
                size="medium"
                onClick={() => onNavigate('ziyaret-mesaji')}
              />
              <MetroTile
                title="Biyopsi Sonucu"
                subtitle=""
                icon={<FileText size={40} />}
                color="bg-[#8E44AD]"
                size="medium"
                onClick={() => onNavigate('biyopsi-sonucu')}
              />
              <MetroTile
                title="Ben Kimim?"
                subtitle=""
                icon={<BookOpen size={40} />}
                color="bg-[#0078D4]"
                size="medium"
                onClick={() => onNavigate('ben-kimim')}
              />
              <MetroTile
                title="Isparta Nöbetçi Eczane"
                subtitle=""
                icon={<Building2 size={40} />}
                color="bg-[#A52A2A]"
                size="medium"
                onClick={() => onNavigate('nobetci-eczane')}
              />
              <MetroTile
                title="Hastane Yemek Menüsü"
                subtitle=""
                icon={<Utensils size={40} />}
                color="bg-[#16A085]"
                size="medium"
                onClick={() => onNavigate('hastane-yemek')}
              />

              {/* Lumia tarzı, tıklanmayan hava durumu karosu */}
              <div
                className={`home-weather-tile home-weather-${weather.variant}`}
              >
                <div className="home-weather-header">
                  <span className="home-weather-city">ISPARTA</span>
                </div>
                <div className="home-weather-main">
                  <span className="home-weather-icon">{weather.icon}</span>
                  <span className="home-weather-temp">
                    {weather.temp !== null ? `${weather.temp}°` : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ÖĞRENCİ Bölümü */}
          <div>
            <h2 className="mb-6 text-2xl font-bold">Öğrenci</h2>
            <div className="grid grid-cols-2 gap-4">
              <MetroTile
                title="SDÜ Tıp Patoloji Notlarım"
                subtitle={tipSubtitle}
                icon={<BookMarked size={40} />}
                color="bg-[#00A6D6]"
                size="wide"
                onClick={() => onNavigate('donem-3')}
              />
              <MetroTile
                title="Diş Ders Notlarım"
                subtitle={disSubtitle}
                icon={<FolderOpen size={40} />}
                color="bg-[#E67E22]"
                size="medium"
                onClick={() =>
                  window.open(
                    'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/AOfBeT92mkwxHs0wt-VIZDQ/Di%C5%9F%20hekimli%C4%9Fi?dl=0&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1',
                    '_blank',
                  )
                }
              />
              <MetroTile
                title="Eczacılık Notlarım"
                subtitle={eczaSubtitle}
                icon={<FolderOpen size={40} />}
                color="bg-[#3498DB]"
                size="medium"
                onClick={() =>
                  window.open(
                    'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/APcXz0YMCCY2ZVcsb62t80w/Eczac%C4%B1l%C4%B1k?dl=0&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1',
                    '_blank',
                  )
                }
              />
              <MetroTile
                title="Patoloji Ders Programları"
                subtitle=""
                icon={<GraduationCap size={40} />}
                color="bg-[#003E7E]"
                size="medium"
                onClick={() => onNavigate('ders-programi')}
              />
              <MetroTile
                title="Blog"
                subtitle={blogSubtitle}
                icon={<BookOpen size={40} />}
                color="bg-[#8E44AD]"
                size="medium"
                onClick={() => onNavigate('blog')}
              />
              {/* Öğrenci grubunun en altına Slide Galeri */}
              <MetroTile
                title="Slide Galeri"
                subtitle={galeriSubtitle}
                icon={<FileText size={40} />}
                color="bg-[#003E7E]"
                size="wide"
                onClick={() => onNavigate('galeri')}
              />
            </div>
          </div>

          {/* AKADEMİK Bölümü */}
          <div>
            <h2 className="mb-6 text-2xl font-bold">Akademik</h2>
            <div className="grid grid-cols-2 gap-4">
              <MetroTile
                title="Yayınlar"
                subtitle={yayinSubtitle}
                icon={<FileText size={40} />}
                color="bg-[#DC143C]"
                size="medium"
                onClick={() => onNavigate('yayinlar')}
              />
              <MetroTile
                title="Portfolyo"
                subtitle={portfolyoSubtitle}
                icon={<Briefcase size={40} />}
                color="bg-[#8E44AD]"
                size="medium"
                onClick={() => onNavigate('portfolyo')}
              />

              {/* PROFİL yerine PODCAST karosu */}
              <MetroTile
                title="Patoloji Podcast"
                subtitle={podcastSubtitle}
                icon={<Headphones size={40} />}
                color="bg-[#E67E22]"
                size="wide"
                onClick={() => onNavigate('podcast')}
              />

              <MetroTile
                title="Facebook"
                subtitle=""
                icon={<Facebook size={40} />}
                color="bg-[#3B5998] text-white"
                size="medium"
                onClick={() => onNavigate('facebook')}
              />
              <MetroTile
                title="LinkedIn"
                subtitle=""
                icon={<Linkedin size={40} />}
                color="bg-[#0077B5] text-white"
                size="medium"
                onClick={() => onNavigate('linkedin')}
              />
              <MetroTile
                title="GitHub"
                subtitle=""
                icon={<Github size={40} />}
                color="bg-[#333333] text-white"
                size="medium"
                onClick={() => onNavigate('github')}
              />
              <MetroTile
                title="Diğer Çalışmalar"
                subtitle={digerSubtitle}
                icon={<Briefcase size={40} />}
                color="bg-[#27AE60]"
                size="medium"
                onClick={() => onNavigate('diger-calismalar')}
              />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
