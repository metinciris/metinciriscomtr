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
  Microscope,
  Calendar,
  Landmark,
  Dna,
  Camera,
} from 'lucide-react';
import { useRotatingText } from '../hooks/useRotatingText';
import { useWeather } from '../hooks/useWeather';
import {
  TIP_SUBTITLES,
  ILETISIM_SUBTITLES,
  DIS_SUBTITLES,
  ECZA_SUBTITLES,
  MAKALE_SUBTITLES,
  GALERI_SUBTITLES,
  HASTANE_YEMEK_SUBTITLES,
  YAYIN_SUBTITLES,
  PORTFOLYO_SUBTITLES,
  DIGER_SUBTITLES,
  KONSENSUS_SUBTITLES,
  NGS_SUBTITLES,
  BLOG_SUBTITLES,
  BIYOPSI_SUBTITLES,
  SOZLUK_SSS_SUBTITLES,
  BAKTIGIM_SUBTITLES,
  UNIVERSITE_SUBTITLES,
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
  faculty: 'Tıp Fakültesi',
  department: 'Tıbbi Patoloji Anabilim Dalı',
  city: 'Isparta',
};

/* ──────────────────────────────────────────────
   Dış ders notu bağlantıları (Universite.tsx ile tutarlı)
   ────────────────────────────────────────────── */
const DROPBOX_DIS =
  'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/AOfBeT92mkwxHs0wt-VIZDQ/Di%C5%9F%20hekimli%C4%9Fi?dl=0&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1';

const DROPBOX_ECZA =
  'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/APcXz0YMCCY2ZVcsb62t80w/Eczac%C4%B1l%C4%B1k?dl=0&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1';

export function Home({ onNavigate }: HomeProps) {
  /* ── Dönen alt açıklamalar ── */
  const iletisimSubtitle   = useRotatingText(ILETISIM_SUBTITLES, 4000);
  const biyopsiSubtitle    = useRotatingText(BIYOPSI_SUBTITLES, 4000);
  const sozlukSssSubtitle = useRotatingText(SOZLUK_SSS_SUBTITLES, 4000);
  const baktigimSubtitle   = useRotatingText(BAKTIGIM_SUBTITLES, 4000);
  const hastaneYemekSub    = useRotatingText(HASTANE_YEMEK_SUBTITLES, 4000);

  const tipSubtitle        = useRotatingText(TIP_SUBTITLES, 4000);
  const disSubtitle        = useRotatingText(DIS_SUBTITLES, 4000);
  const eczaSubtitle       = useRotatingText(ECZA_SUBTITLES, 4000);
  const makaleSubtitle     = useRotatingText(MAKALE_SUBTITLES, 4000);
  const galeriSubtitle     = useRotatingText(GALERI_SUBTITLES, 4000);

  const ngsSubtitle        = useRotatingText(NGS_SUBTITLES, 4000);
  const yayinSubtitle      = useRotatingText(YAYIN_SUBTITLES, 4000);
  const portfolyoSubtitle  = useRotatingText(PORTFOLYO_SUBTITLES, 4000);
  const blogSubtitle       = useRotatingText(BLOG_SUBTITLES, 4000);
  const konsensusSubtitle  = useRotatingText(KONSENSUS_SUBTITLES, 4000);
  const universiteSubtitle = useRotatingText(UNIVERSITE_SUBTITLES, 4000);
  const digerSubtitle      = useRotatingText(DIGER_SUBTITLES, 4000);

  /* ── Hava durumu (Isparta) – Open-Meteo ── */
  const weather = useWeather();

  /* ── Son güncelleme etiketi ── */
  const weatherUpdated = weather.temp !== null ? 'Canlı veri' : 'Yükleniyor…';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 transition-colors duration-300">
      <PageContainer>

        {/* ══════════ KİMLİK ALANI (üst tanıtım) ══════════ */}
        <section className="home-identity" aria-label="Profesyonel tanıtım">
          <h1 className="home-identity-name">Prof. Dr. İbrahim Metin Çiriş</h1>
          <p className="home-identity-title">Tıbbi Patoloji Uzmanı ve Akademisyen</p>
          <p className="home-identity-desc">
            Biyopsi ve cerrahi patoloji örneklerini değerlendiren; tanısal patoloji,
            moleküler patoloji ve dijital patoloji alanlarında çalışan akademisyen.
          </p>
          <p className="home-identity-institution">
            {INSTITUTION.name} · {INSTITUTION.faculty} · {INSTITUTION.department} · {INSTITUTION.city}
          </p>
          <ul className="home-identity-links">
            <li><a href="/portfolyo/">Özgeçmiş</a></li>
            <li><a href="/yayinlar/">Yayınlar</a></li>
            <li>
              <a
                href="https://orcid.org/0000-0002-5619-4989"
                target="_blank"
                rel="noopener noreferrer"
              >
                ORCID
              </a>
            </li>
            <li>
              <a
                href="https://pubmed.ncbi.nlm.nih.gov/?term=ciris+M"
                target="_blank"
                rel="noopener noreferrer"
              >
                PubMed
              </a>
            </li>
            <li><a href="/iletisim/">İletişim</a></li>
          </ul>
        </section>

        {/* ══════════ KARO IZGARASI ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

          {/* ══ HASTALAR ══ */}
          <div>
            <h2 className="mb-1 text-xl font-bold">Hastalar</h2>
            <p className="mb-3 text-sm text-slate-600">
              Biyopsi sonuçları, patoloji raporları, iletişim ve günlük pratik bilgiler.
            </p>
            <div className="grid grid-cols-2 gap-3">

              {/* Geniş: İletişim */}
              <MetroTile
                title="İletişim"
                subtitle={iletisimSubtitle}
                icon={<Phone size={38} />}
                color="tile-patient-primary"
                size="wide"
                href="/iletisim/"
                onClick={() => onNavigate('iletisim')}
              />

              {/* Biyopsi ve Patoloji */}
              <MetroTile
                title="Biyopsi ve Patoloji"
                subtitle={biyopsiSubtitle}
                icon={<FileText size={38} />}
                color="tile-patient-a"
                size="medium"
                href="/biyopsi-sonucu/"
                onClick={() => onNavigate('biyopsi-sonucu')}
              />

              {/* Patoloji Sözlüğü ve SSS */}
              <MetroTile
                title="Patoloji Sözlüğü & SSS"
                subtitle={sozlukSssSubtitle}
                icon={<MessageSquare size={38} />}
                color="tile-patient-b"
                size="medium"
                href="/patoloji-sozlugu/"
                onClick={() => onNavigate('patoloji-sozlugu')}
              />

              {/* Baktığım Biyopsiler */}
              <MetroTile
                title="Baktığım Biyopsiler"
                subtitle={baktigimSubtitle}
                icon={<BookOpen size={38} />}
                color="tile-patient-c"
                size="medium"
                href="/baktigim-biyopsiler/"
                onClick={() => onNavigate('baktigim-biyopsiler')}
              />

              {/* Nöbetçi Eczane */}
              <MetroTile
                title="Isparta Nöbetçi Eczane"
                subtitle="Güncel nöbetçi eczane listesi"
                icon={<Building2 size={38} />}
                color="tile-accent-danger"
                size="medium"
                href="/nobetci-eczane/"
                onClick={() => onNavigate('nobetci-eczane')}
              />

              {/* Hastane Yemek */}
              <MetroTile
                title="SDÜ Hastane Yemek"
                subtitle={hastaneYemekSub}
                icon={<Utensils size={38} />}
                color="tile-patient-utility"
                size="medium"
                href="/hastane-yemek/"
                onClick={() => onNavigate('hastane-yemek')}
              />

              {/* Hava Durumu */}
              <div className={`home-weather-tile home-weather-${weather.variant}`}>
                <div className="home-weather-header">
                  <span className="home-weather-city">ISPARTA</span>
                  <span className="home-weather-updated">{weatherUpdated}</span>
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

          {/* ══ PATOLOJİ VE EĞİTİM ══ */}
          <div>
            <h2 className="mb-1 text-xl font-bold">Patoloji ve Eğitim</h2>
            <p className="mb-3 text-sm text-slate-600">
              Patoloji eğitimi, ders notları, güncel vakalar ve mesleki kaynaklar.
            </p>
            <div className="grid grid-cols-2 gap-3">

              {/* Geniş: Tıp Fakültesi Ders Notları */}
              <MetroTile
                title="Tıp Fakültesi Patoloji Ders Notları"
                subtitle={tipSubtitle}
                icon={<BookMarked size={38} />}
                color="tile-edu-primary"
                size="wide"
                href="/donem-3/"
                onClick={() => onNavigate('donem-3')}
              />

              {/* Diş Hekimliği */}
              <MetroTile
                title="Diş Hekimliği Patoloji Ders Notları"
                subtitle={disSubtitle}
                icon={<FolderOpen size={38} />}
                color="tile-edu-a"
                size="medium"
                href={DROPBOX_DIS}
                target="_blank"
                rel="noopener noreferrer"
              />

              {/* Eczacılık */}
              <MetroTile
                title="Eczacılık Patoloji Ders Notları"
                subtitle={eczaSubtitle}
                icon={<FolderOpen size={38} />}
                color="tile-edu-b"
                size="medium"
                href={DROPBOX_ECZA}
                target="_blank"
                rel="noopener noreferrer"
              />

              {/* Öğrenci Yemek */}
              <MetroTile
                title="Öğrenci Yemek Listesi"
                subtitle="SDÜ kampüs yemekhanesi"
                icon={<Utensils size={38} />}
                color="tile-edu-utility"
                size="medium"
                href="/ogrenci-yemek/"
                onClick={() => onNavigate('ogrenci-yemek')}
              />

              {/* Ders Programları */}
              <MetroTile
                title="Patoloji Ders Programları"
                subtitle="Güncel ders takvimi"
                icon={<GraduationCap size={38} />}
                color="tile-edu-c"
                size="medium"
                href="/ders-programi/"
                onClick={() => onNavigate('ders-programi')}
              />

              {/* Patoloji Radarı */}
              <MetroTile
                title="Patoloji Radarı"
                subtitle={makaleSubtitle}
                icon={<Calendar size={38} />}
                color="tile-edu-radar"
                size="medium"
                href="/makale-takip/"
                onClick={() => onNavigate('makale-takip')}
              />

              {/* Slide Galeri */}
              <MetroTile
                title="Slide Galeri"
                subtitle={galeriSubtitle}
                icon={<Camera size={38} />}
                color="tile-edu-galeri"
                size="medium"
                href="/galeri/"
                onClick={() => onNavigate('galeri')}
              />

            </div>
          </div>

          {/* ══ AKADEMİK / PROFESYONEL ══ */}
          <div>
            <h2 className="mb-1 text-xl font-bold">Akademik / Profesyonel</h2>
            <p className="mb-3 text-sm text-slate-600">
              Yayınlar, özgeçmiş, moleküler patoloji ve profesyonel çalışmalar.
            </p>
            <div className="grid grid-cols-2 gap-3">

              {/* Yayınlar */}
              <MetroTile
                title="Yayınlar"
                subtitle={yayinSubtitle}
                icon={<FileText size={38} />}
                color="tile-acad-pub"
                size="medium"
                href="/yayinlar/"
                onClick={() => onNavigate('yayinlar')}
              />

              {/* Özgeçmiş */}
              <MetroTile
                title="Özgeçmiş"
                subtitle={portfolyoSubtitle}
                icon={<Briefcase size={38} />}
                color="tile-acad-cv"
                size="medium"
                href="/portfolyo/"
                onClick={() => onNavigate('portfolyo')}
              />

              {/* NGS ve Moleküler Patoloji */}
              <MetroTile
                title="NGS ve Moleküler Patoloji"
                subtitle={ngsSubtitle}
                icon={<Dna size={38} />}
                color="tile-acad-primary"
                size="medium"
                href="/ngs/"
                onClick={() => onNavigate('ngs')}
              />

              {/* Podcast */}
              <MetroTile
                title="Patoloji Podcast"
                subtitle="Sesli makale ve vaka özetleri"
                icon={<MessageSquare size={38} />}
                color="bg-[#10B981]"
                size="medium"
                href="/podcast/"
                onClick={() => onNavigate('podcast')}
              />

              {/* Blog / Patoloji Notları */}
              <MetroTile
                title="Patoloji Notları"
                subtitle={blogSubtitle}
                icon={<BookOpen size={38} />}
                color="tile-acad-blog"
                size="medium"
                href="/blog/"
                onClick={() => onNavigate('blog')}
              />

              {/* Patoloji Konsensus */}
              <MetroTile
                title="Patoloji Konsensus"
                subtitle={konsensusSubtitle}
                icon={<Users size={38} />}
                color="tile-acad-konsensus"
                size="medium"
                href="/konsensus/"
                onClick={() => onNavigate('konsensus')}
              />

              {/* SDÜ ve Üniversite */}
              <MetroTile
                title="SDÜ ve Üniversite"
                subtitle={universiteSubtitle}
                icon={<Landmark size={38} />}
                color="tile-acad-uni"
                size="medium"
                href="/universite/"
                onClick={() => onNavigate('universite')}
              />

              {/* Diğer Çalışmalar */}
              <MetroTile
                title="Diğer Çalışmalar"
                subtitle={digerSubtitle}
                icon={<FolderOpen size={38} />}
                color="tile-acad-other"
                size="medium"
                href="/diger-calismalar/"
                onClick={() => onNavigate('diger-calismalar')}
              />

            </div>
          </div>

        </div>
      </PageContainer>
    </div>
  );
}
