import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { MetroTile } from '../components/MetroTile';
import { motion } from 'motion/react';
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
  Microscope,
  Calendar,
} from 'lucide-react';
import { useRotatingText } from '../hooks/useRotatingText';
import { useWeather } from '../hooks/useWeather';
import { usePodcastTitle } from '../hooks/usePodcastTitle';
import {
  TIP_SUBTITLES,
  ILETISIM_SUBTITLES,
  DIS_SUBTITLES,
  ECZA_SUBTITLES,
  BLOG_SUBTITLES,
  GALERI_SUBTITLES,
  MAKALE_SUBTITLES,
  HASTANE_YEMEK_SUBTITLES,
  YAYIN_SUBTITLES,
  PORTFOLYO_SUBTITLES,
  DIGER_SUBTITLES,
} from '../data/homeSubtitles';
import './Home.css';

interface HomeProps {
  onNavigate: (page: string) => void;
}

/** Küçük yardımcı: yazıyı tek satırda tutmak için kısaltma */
function shorten(text: string, max: number): string {
  if (!text) return '';
  return text.length <= max ? text : text.slice(0, max - 3) + '...';
}

export function Home({ onNavigate }: HomeProps) {
  // Dönen alt açıklamalar
  const tipSubtitle = useRotatingText(TIP_SUBTITLES, 4000);
  const iletisimSubtitle = useRotatingText(ILETISIM_SUBTITLES, 4000);
  const disSubtitle = useRotatingText(DIS_SUBTITLES, 4000);
  const eczaSubtitle = useRotatingText(ECZA_SUBTITLES, 4000);
  const blogSubtitle = useRotatingText(BLOG_SUBTITLES, 4000);
  const galeriSubtitle = useRotatingText(GALERI_SUBTITLES, 4000);
  const makaleSubtitle = useRotatingText(MAKALE_SUBTITLES, 4000);
  const hastaneYemekSubtitle = useRotatingText(HASTANE_YEMEK_SUBTITLES, 4000);
  const yayinSubtitle = useRotatingText(YAYIN_SUBTITLES, 4000);
  const portfolyoSubtitle = useRotatingText(PORTFOLYO_SUBTITLES, 4000);
  const digerSubtitle = useRotatingText(DIGER_SUBTITLES, 4000);

  // Podcast karosu için canlı başlık
  const podcastDynamicTitle = usePodcastTitle(10000);
  const podcastSubtitle =
    podcastDynamicTitle && podcastDynamicTitle.trim().length > 0
      ? shorten(podcastDynamicTitle, 80)
      : 'Güncel makale başlıkları';

  // Hava durumu (Isparta) – Open-Meteo
  const weather = useWeather();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 transition-colors duration-300">
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* HASTA Bölümü */}
          <div>
            <h2 className="mb-1 text-2xl font-bold">Hasta</h2>
            <p className="mb-4 text-sm text-slate-600">
              Biyopsi sonuçları, iletişim ve günlük pratik bilgiler.
            </p>
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
                title="Baktığım Biyopsiler"
                subtitle=""
                icon={<BookOpen size={40} />}
                color="bg-[#0078D4]"
                size="medium"
                onClick={() => onNavigate('baktigim-biyopsiler')}
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
                title="SDÜ Hastane Yemek"
                subtitle={hastaneYemekSubtitle}
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
            <h2 className="mb-1 text-2xl font-bold">Öğrenci</h2>
            <p className="mb-4 text-sm text-slate-600">
              Tıp, diş ve eczacılık öğrencileri için ders notları ve
              programlar.
            </p>
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

              {/* Ayın Vakası */}
              <MetroTile
                title="Ayın Vakası"
                subtitle="Kendinizi test edin"
                icon={<Microscope size={40} />}
                color=""
                style={{ backgroundColor: '#8B0000', color: 'white' }}
                size="medium"
                onClick={() => onNavigate('ayin-vakasi')}
              />

              {/* Slide Galeri */}
              <MetroTile
                title="Slide Galeri"
                subtitle={galeriSubtitle}
                icon={<Microscope size={40} />}
                color="bg-[#003E7E]"
                size="medium"
                onClick={() => onNavigate('galeri')}
              />

              {/* Makale Takip */}
              <MetroTile
                title="Makale Takip"
                subtitle={makaleSubtitle}
                icon={<Calendar size={40} />}
                color="bg-[#16A085]"
                size="medium"
                onClick={() => onNavigate('pubmed-makale-takip')}
              />
            </div>
          </div>

          {/* AKADEMİK Bölümü */}
          <div>
            <h2 className="mb-1 text-2xl font-bold">Akademik</h2>
            <p className="mb-4 text-sm text-slate-600">
              Yayınlar, portfolyo ve patolojiye yönelik projeler.
            </p>
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

              {/* Podcast karosu */}
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
