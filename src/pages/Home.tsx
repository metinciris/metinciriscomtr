import React from 'react';
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
  Users,
  Building2,
  FolderOpen,
  Phone,
  Headphones,
  Microscope,
  Calendar,
  Landmark,
} from 'lucide-react';
import { useRotatingText } from '../hooks/useRotatingText';
import { useWeather } from '../hooks/useWeather';
import { usePodcastTitle } from '../hooks/usePodcastTitle';
import {
  TIP_SUBTITLES,
  ILETISIM_SUBTITLES,
  DIS_SUBTITLES,
  ECZA_SUBTITLES,
  GALERI_SUBTITLES,
  MAKALE_SUBTITLES,
  HASTANE_YEMEK_SUBTITLES,
  YAYIN_SUBTITLES,
  PORTFOLYO_SUBTITLES,
  DIGER_SUBTITLES,
  KONSENSUS_SUBTITLES,
} from '../data/homeSubtitles';
import './Home.css';

interface HomeProps {
  onNavigate: (page: string) => void;
}

/* ──────────────────────────────────────────────
   Kurum bilgisi — ayrı const olarak tutulur,
   kurum değişikliğinde sadece burası güncellenir.
   ────────────────────────────────────────────── */
const INSTITUTION = {
  name: 'Süleyman Demirel Üniversitesi',
  department: 'Tıp Fakültesi Tıbbi Patoloji Anabilim Dalı',
  city: 'Isparta',
};

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
  const galeriSubtitle = useRotatingText(GALERI_SUBTITLES, 4000);
  const makaleSubtitle = useRotatingText(MAKALE_SUBTITLES, 4000);
  const hastaneYemekSubtitle = useRotatingText(HASTANE_YEMEK_SUBTITLES, 4000);
  const yayinSubtitle = useRotatingText(YAYIN_SUBTITLES, 4000);
  const portfolyoSubtitle = useRotatingText(PORTFOLYO_SUBTITLES, 4000);
  const digerSubtitle = useRotatingText(DIGER_SUBTITLES, 4000);
  const konsensusSubtitle = useRotatingText(KONSENSUS_SUBTITLES, 4000);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 pt-4">
          {/* ══════════ HASTALAR ══════════ */}
          <div>
            <h2 className="mb-1 text-2xl font-bold">Hastalar</h2>
            <p className="mb-4 text-sm text-slate-600">
              Biyopsi sonuçları, patoloji raporları, iletişim ve günlük pratik
              bilgiler.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <MetroTile
                title="İletişim"
                subtitle={iletisimSubtitle}
                icon={<Phone size={40} />}
                color="bg-[#00A6D6]"
                size="wide"
                href="/iletisim/"
                onClick={() => onNavigate('iletisim')}
              />
              <MetroTile
                title="Biyopsi ve Patoloji"
                subtitle="Patoloji raporu hakkında bilgilendirme"
                icon={<FileText size={40} />}
                color="bg-[#8E44AD]"
                size="medium"
                href="/biyopsi-sonucu/"
                onClick={() => onNavigate('biyopsi-sonucu')}
              />
              <MetroTile
                title="Sık Sorulan Sorular"
                subtitle="Biyopsi süreci ve patoloji hakkında"
                icon={<MessageSquare size={40} />}
                color="bg-[#FF8C00]"
                size="medium"
                href="/ziyaret-mesaji/"
                onClick={() => onNavigate('ziyaret-mesaji')}
              />
              <MetroTile
                title="Baktığım Biyopsiler"
                subtitle="İncelenen biyopsi türleri"
                icon={<BookOpen size={40} />}
                color="bg-[#0078D4]"
                size="medium"
                href="/baktigim-biyopsiler/"
                onClick={() => onNavigate('baktigim-biyopsiler')}
              />
              <MetroTile
                title="Isparta Nöbetçi Eczane"
                subtitle="Güncel nöbetçi eczane listesi"
                icon={<Building2 size={40} />}
                color="bg-[#A52A2A]"
                size="medium"
                href="/nobetci-eczane/"
                onClick={() => onNavigate('nobetci-eczane')}
              />
              <MetroTile
                title="SDÜ Hastane Yemek"
                subtitle={hastaneYemekSubtitle}
                icon={<Utensils size={40} />}
                color="bg-[#16A085]"
                size="medium"
                href="/hastane-yemek/"
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

          {/* ══════════ PATOLOJİ VE EĞİTİM ══════════ */}
          <div>
            <h2 className="mb-1 text-2xl font-bold">Patoloji ve Eğitim</h2>
            <p className="mb-4 text-sm text-slate-600">
              Patoloji eğitimi, ders notları, güncel vakalar ve mesleki
              kaynaklar.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <MetroTile
                title="Patoloji Notları"
                subtitle={tipSubtitle}
                icon={<BookMarked size={40} />}
                color="bg-[#00A6D6]"
                size="wide"
                href="/donem-3/"
                onClick={() => onNavigate('donem-3')}
              />
              <MetroTile
                title="Eğitim Kaynakları"
                subtitle={disSubtitle}
                icon={<FolderOpen size={40} />}
                color="bg-[#E67E22]"
                size="medium"
                href="/ders-programi/"
                onClick={() => onNavigate('ders-programi')}
              />
              <MetroTile
                title="Seçili Patoloji Araçları"
                subtitle={eczaSubtitle}
                icon={<Microscope size={40} />}
                color="bg-[#3498DB]"
                size="medium"
                href="/diger-calismalar/"
                onClick={() => onNavigate('diger-calismalar')}
              />
              <MetroTile
                title="Patoloji Ders Programları"
                subtitle="Güncel ders takvimi"
                icon={<GraduationCap size={40} />}
                color="bg-[#003E7E]"
                size="medium"
                href="/ders-programi/"
                onClick={() => onNavigate('ders-programi')}
              />
              <MetroTile
                title="Ayın Vakası"
                subtitle="Kendinizi test edin"
                icon={<Microscope size={40} />}
                color=""
                style={{ backgroundColor: '#8B0000', color: 'white' }}
                size="medium"
                href="/ayin-vakasi/"
                onClick={() => onNavigate('ayin-vakasi')}
              />
              <MetroTile
                title="Slide Galeri"
                subtitle={galeriSubtitle}
                icon={<Microscope size={40} />}
                color="bg-[#003E7E]"
                size="medium"
                href="/galeri/"
                onClick={() => onNavigate('galeri')}
              />
              <MetroTile
                title="Makale Takip"
                subtitle={makaleSubtitle}
                icon={<Calendar size={40} />}
                color="bg-[#16A085]"
                size="medium"
                href="/pubmed-makale-takip/"
                onClick={() => onNavigate('pubmed-makale-takip')}
              />
            </div>
          </div>

          {/* ══════════ AKADEMİK / PROFESYONEL ══════════ */}
          <div>
            <h2 className="mb-1 text-2xl font-bold">Akademik / Profesyonel</h2>
            <p className="mb-4 text-sm text-slate-600">
              Yayınlar, özgeçmiş, moleküler patoloji ve profesyonel çalışmalar.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <MetroTile
                title="Yayınlar"
                subtitle={yayinSubtitle}
                icon={<FileText size={40} />}
                color="bg-[#DC143C]"
                size="medium"
                href="/yayinlar/"
                onClick={() => onNavigate('yayinlar')}
              />
              <MetroTile
                title="Özgeçmiş"
                subtitle={portfolyoSubtitle}
                icon={<Briefcase size={40} />}
                color="bg-[#8E44AD]"
                size="medium"
                href="/portfolyo/"
                onClick={() => onNavigate('portfolyo')}
              />

              {/* Podcast karosu */}
              <MetroTile
                title="Patoloji Podcast"
                subtitle={podcastSubtitle}
                icon={<Headphones size={40} />}
                color="bg-[#E67E22]"
                size="wide"
                href="/podcast/"
                onClick={() => onNavigate('podcast')}
              />

              <MetroTile
                title="Konsensus"
                subtitle={konsensusSubtitle}
                icon={<Users size={40} />}
                color="bg-[#2563eb] text-white"
                size="medium"
                href="/konsensus/"
                onClick={() => onNavigate('konsensus')}
              />
              <MetroTile
                title="Üniversite ve SDÜ Arşivi"
                subtitle="Ders notları, öğrenci kaynakları"
                icon={<Landmark size={40} />}
                color="bg-[#0077B5] text-white"
                size="medium"
                href="/universite/"
                onClick={() => onNavigate('universite')}
              />
              <MetroTile
                title="Blog"
                subtitle="Bilimsel takip ve notlarım"
                icon={<FileText size={40} />}
                color="bg-[#8E44AD]"
                size="medium"
                href="/blog/"
                onClick={() => onNavigate('blog')}
              />
              <MetroTile
                title="Diğer Çalışmalar"
                subtitle={digerSubtitle}
                icon={<Briefcase size={40} />}
                color="bg-[#27AE60]"
                size="medium"
                href="/diger-calismalar/"
                onClick={() => onNavigate('diger-calismalar')}
              />
            </div>
          </div>
        </div>

        {/* ──────── Profesyonel Tanıtım ──────── */}
        <section className="home-hero mt-12 mb-6" aria-label="Profesyonel tanıtım">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">
            Prof. Dr. İbrahim Metin Çiriş
          </h1>
          <p className="text-lg text-blue-700 font-medium mb-3">
            Tıbbi Patoloji Uzmanı
          </p>
          <p className="text-slate-600 max-w-2xl leading-relaxed mb-2">
            Tanısal patoloji, moleküler patoloji ve dijital patoloji alanlarında
            çalışan tıbbi patoloji uzmanı. Patologlar, sağlık profesyonelleri,
            öğrenciler ve hastalar için bilimsel içerikler, mesleki kaynaklar ve
            seçili karar destek araçları hazırlamaktadır.
          </p>
          <p className="text-sm text-slate-400">
            {INSTITUTION.name} · {INSTITUTION.department}
          </p>
        </section>
      </PageContainer>
    </div>
  );
}
