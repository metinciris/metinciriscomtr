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
  UserCircle,
} from 'lucide-react';
import './Home.css';

interface HomeProps {
  onNavigate: (page: string) => void;
}

/** --- KISA, TEK SATIRLIK DÖNEN AÇIKLAMALAR --- **/

const TIP_SUBTITLES = [
  'Ders slaytları',
  'Özet notlar',
  'Güncel müfredat',
];

const DIS_SUBTITLES = [
  'Diş hekimliği notları',
  'Slayt ve sunumlar',
  'Pratik odaklı notlar',
];

const ECZA_SUBTITLES = [
  'Eczacılık notları',
  'Farmakoloji ağırlıklı',
  'Dropbox klasörü',
];

const BLOG_SUBTITLES = [
  'Vaka yazıları',
  'Yazılım & eğitim',
  'Güncel notlar',
];

const GALERI_SUBTITLES = [
  'Sanal mikroskop',
  'Histopatoloji vakaları',
  'Dijital slide arşivi',
];

// Akademik taraf
const YAYIN_SUBTITLES = [
  'Makale listesi',
  'PubMed bağlantıları',
  'Güncel yayınlar',
];

const PORTFOLYO_SUBTITLES = [
  'Projeler & slaytlar',
  'Sunum arşivi',
  'Örnek çalışmalar',
];

const PROFIL_SUBTITLES = [
  'Akademik özgeçmiş',
  'İletişim bilgileri',
  'Çalışma alanları',
];

const DIGER_SUBTITLES = [
  'Vaka sunumları',
  'Yan projeler',
  'Diğer çalışmalar',
];

/** Kısa dönen metin hook’u */
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

/** Hava durumu state’i */
type WeatherState = {
  temp: number | null;
  icon: string;
};

function getWeatherIcon(code?: number): string {
  if (code === undefined || code === null) return '☁️';

  // Open-Meteo weather_code haritasını kabaca gruplayalım
  // 0: Clear, 1-2: açık/az bulutlu, 3: kapalı, 45-48: sis
  // 51-67: yağmur / drizzle, 71-86: kar, 95+: fırtına
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 86) return '❄️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

export function Home({ onNavigate }: HomeProps) {
  // Dönen alt açıklamalar
  const tipSubtitle = useRotatingText(TIP_SUBTITLES, 4000);
  const disSubtitle = useRotatingText(DIS_SUBTITLES, 4000);
  const eczaSubtitle = useRotatingText(ECZA_SUBTITLES, 4000);
  const blogSubtitle = useRotatingText(BLOG_SUBTITLES, 4000);
  const galeriSubtitle = useRotatingText(GALERI_SUBTITLES, 4000);

  const yayinSubtitle = useRotatingText(YAYIN_SUBTITLES, 4000);
  const portfolyoSubtitle = useRotatingText(PORTFOLYO_SUBTITLES, 4000);
  const profilSubtitle = useRotatingText(PROFIL_SUBTITLES, 4000);
  const digerSubtitle = useRotatingText(DIGER_SUBTITLES, 4000);

  // Hava durumu (Isparta) – Open-Meteo (API key gerektirmiyor)
  const [weather, setWeather] = useState<WeatherState>({
    temp: null,
    icon: '☁️',
  });

  useEffect(() => {
    const lat = 37.76; // Isparta civarı
    const lon = 30.55;

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
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

        setWeather({
          temp:
            typeof tempRaw === 'number' ? Math.round(tempRaw) : weather.temp,
          icon: getWeatherIcon(codeRaw),
        });
      })
      .catch(() => {
        // Hata olursa mevcut state kalsın (☁️ / null)
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                subtitle=""
                icon={
                  <img
                    src="/img/metinciris.png"
                    alt="Prof. Dr. Metin Çiriş"
                    className="w-20 h-20 object-cover border-2 border-white/70 shadow-md"
                  />
                }
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

              {/* Lumia tarzı, tıklanmayan, otomatik güncellenen hava durumu */}
              <div className="home-weather-tile">
                <div className="home-weather-header">
                  <span className="home-weather-city">Isparta</span>
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

              {/* Öğrenci grubunun EN ALTINA Slide Galeri kutusu */}
              <MetroTile
                title="Slide Galeri"
                subtitle={galeriSubtitle}
                icon={<FileText size={40} />}
                color="bg-[#1BA1E2]"
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
              <MetroTile
                title="Profil"
                subtitle={profilSubtitle}
                icon={<UserCircle size={40} />}
                color="bg-[#E67E22]"
                size="wide"
                onClick={() => onNavigate('profil')}
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
