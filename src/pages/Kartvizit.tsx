import { useState } from 'react';
import {
  ArrowUpRight, BookOpen, Building2, Check, ContactRound, Copy,
  Download, ExternalLink, FileText, FlaskConical, Github, GraduationCap,
  Linkedin, Mail, MapPin, Microscope, Phone, QrCode, Share2,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '../components/PageContainer';
import { trackClick } from '../utils/analytics';
import { buildDigitalCardVCard, DIGITAL_CARD, DIGITAL_CARD_URL } from '../utils/digitalCard';

type CardLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

const academicLinks: CardLink[] = [
  {
    title: 'ORCID', description: 'Araştırmacı kimliğim',
    href: 'https://orcid.org/0000-0002-5619-4989', icon: GraduationCap, external: true,
  },
  {
    title: 'Google Scholar', description: 'Akademik yayınlar ve atıflar',
    href: 'https://scholar.google.com/citations?user=zEF_KLsAAAAJ&hl=tr',
    icon: BookOpen, external: true,
  },
  {
    title: 'LinkedIn', description: 'Mesleki ağ ve güncellemeler',
    href: 'https://www.linkedin.com/in/patoloji/', icon: Linkedin, external: true,
  },
  {
    title: 'GitHub', description: 'Açık kaynak geliştirmeler',
    href: 'https://github.com/metinciris', icon: Github, external: true,
  },
];

const contentLinks: CardLink[] = [
  {
    title: 'Akademik Yayınlar', description: 'Makalelerim ve bilimsel çalışmalarım',
    href: '/yayinlar/', icon: FileText,
  },
  {
    title: 'Patoloji Radarı ve Blog', description: 'Güncel patoloji yazıları',
    href: '/blog/', icon: BookOpen,
  },
  {
    title: 'Akademik Portfolyo', description: 'Özgeçmiş ve araştırma projeleri',
    href: '/portfolyo/', icon: GraduationCap,
  },
  {
    title: 'Moleküler ve Dijital Patoloji', description: 'NGS ve dijital patoloji çalışmaları',
    href: '/ngs/', icon: FlaskConical,
  },
];

function LinkTile({ item }: { item: CardLink }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      onClick={() => trackClick('Kartvizit: ' + item.title)}
      className="group flex min-h-20 items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-900 no-underline shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight">{item.title}</span>
        <span className="mt-1 block text-sm leading-snug text-slate-600">{item.description}</span>
      </span>
      <ArrowUpRight size={18} aria-hidden="true" className="shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

function downloadVCard() {
  const blob = new Blob([buildDigitalCardVCard()], { type: 'text/vcard;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = 'Prof-Dr-Ibrahim-Metin-Ciris.vcf';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  trackClick('Kartvizit: Rehbere ekle');
  toast.success('Kişi kartı indirildi. Dosyayı açarak rehberinize ekleyebilirsiniz.');
}

export function Kartvizit() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(DIGITAL_CARD_URL);
      setCopied(true);
      toast.success('Kartvizit bağlantısı kopyalandı.');
      trackClick('Kartvizit: Bağlantıyı kopyala');
    } catch {
      // HTTP veya tarayıcı izni nedeniyle clipboard kapalı olabilir.
      window.prompt('Kartvizit bağlantısını kopyalayın:', DIGITAL_CARD_URL);
    }
  }

  async function shareCard() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: DIGITAL_CARD.fullName + ' | Dijital Kartvizit',
          text: 'Dijital akademik kartvizitim',
          url: DIGITAL_CARD_URL,
        });
        trackClick('Kartvizit: Paylaş');
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    await copyLink();
  }

  function showQrCode() {
    document.getElementById('kartvizit-qr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    trackClick('Kartvizit: QR kodu göster');
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl space-y-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-600" aria-label="İçerik yolu">
          <a href="/" className="font-medium text-blue-700 hover:underline">Ana Sayfa</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Dijital Kartvizit</span>
        </nav>

        <section className="relative isolate overflow-hidden rounded-3xl bg-[#0a233a] text-white shadow-xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background: 'radial-gradient(circle at 90% 5%, rgba(0,188,212,.28), transparent 42%), radial-gradient(circle at 5% 100%, rgba(29,78,216,.22), transparent 55%)',
            }}
          />
          <div className="relative grid items-center gap-9 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-12">
            <div>
              <div className="mb-7 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <img
                  src="/img/metinciris.avif"
                  alt="Prof. Dr. İbrahim Metin Çiriş"
                  className="h-32 w-28 shrink-0 rounded-2xl border-2 border-white/30 object-cover object-top shadow-lg sm:h-40 sm:w-32"
                  width={128}
                  height={160}
                  fetchPriority="high"
                />
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-cyan-200">Dijital akademik kartvizit</p>
                  <h1 className="mb-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
                    Prof. Dr. İbrahim Metin Çiriş
                  </h1>
                  <p className="mb-1 text-lg font-semibold text-white">{DIGITAL_CARD.title}</p>
                  <p className="text-sm leading-relaxed text-slate-200">
                    Süleyman Demirel Üniversitesi · Tıp Fakültesi
                    <span className="block">Tıbbi Patoloji Anabilim Dalı</span>
                  </p>
                </div>
              </div>
              <p className="mb-7 max-w-2xl text-base leading-relaxed text-slate-100">
                Tanısal patoloji, moleküler patoloji ve dijital patoloji alanlarındaki
                yayınlarıma, projelerime ve iletişim bilgilerime tek yerden ulaşın.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={downloadVCard}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 shadow-sm transition-colors hover:bg-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ContactRound size={20} aria-hidden="true" /> Rehbere Ekle
                </button>
                <button
                  type="button"
                  onClick={shareCard}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Share2 size={20} aria-hidden="true" /> Paylaş
                </button>
                <button
                  type="button"
                  onClick={showQrCode}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                >
                  <QrCode size={19} aria-hidden="true" /> QR Kodu Göster
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                >
                  {copied ? <Check size={19} aria-hidden="true" /> : <Copy size={19} aria-hidden="true" />}
                  {copied ? 'Bağlantı Kopyalandı' : 'Bağlantıyı Kopyala'}
                </button>
              </div>
            </div>

            <div id="kartvizit-qr" className="scroll-mt-28 rounded-3xl bg-white p-5 text-center text-slate-900 shadow-xl">
              <div className="mx-auto max-w-60 rounded-xl border border-slate-100 bg-white p-2">
                <img
                  src="/img/kartvizit-qr.svg"
                  alt="metinciris.com.tr/kartvizit/ adresini açan QR kod"
                  width={232}
                  height={232}
                  className="h-auto w-full"
                />
              </div>
              <p className="mt-3 font-bold text-slate-900">Telefonunuzla okutun</p>
              <p className="mt-1 break-all text-xs text-slate-600">metinciris.com.tr/kartvizit/</p>
              <a
                href="/img/kartvizit-qr.svg"
                download="metin-ciris-kartvizit-qr.svg"
                onClick={() => trackClick('Kartvizit: QR indir')}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-800 no-underline hover:bg-slate-50"
              >
                <Download size={17} aria-hidden="true" /> QR Kodu İndir
              </a>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="card-contact-title">
            <h2 id="card-contact-title" className="mb-5 text-2xl font-bold text-slate-900">İletişim</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <Mail className="mt-1 shrink-0 text-cyan-800" size={21} aria-hidden="true" />
                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-600">E-posta</p>
                  <a href={'mailto:' + DIGITAL_CARD.email} className="break-all font-medium text-blue-800 underline">{DIGITAL_CARD.email}</a>
                  <a href={'mailto:' + DIGITAL_CARD.universityEmail} className="mt-1 block break-all text-sm text-blue-800 underline">{DIGITAL_CARD.universityEmail}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="mt-1 shrink-0 text-cyan-800" size={21} aria-hidden="true" />
                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-600">İş telefonu</p>
                  <a href={'tel:' + DIGITAL_CARD.officePhone} className="font-medium text-blue-800 underline">+90 (246) 211 92 92</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 shrink-0 text-cyan-800" size={21} aria-hidden="true" />
                <div>
                  <p className="mb-1 text-sm font-semibold text-slate-600">Kurum ve adres</p>
                  <p className="leading-relaxed text-slate-800">
                    SDÜ Araştırma ve Uygulama Hastanesi<br />
                    Tıbbi Patoloji Anabilim Dalı<br />
                    32260 Isparta, Türkiye
                  </p>
                </div>
              </div>
              <a href="/iletisim/" className="inline-flex items-center gap-2 font-semibold text-blue-800 underline">
                <Building2 size={17} aria-hidden="true" /> Ayrıntılı iletişim bilgileri
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8" aria-labelledby="card-academic-title">
            <h2 id="card-academic-title" className="mb-5 text-2xl font-bold text-slate-900">Akademik Profiller</h2>
            <div className="grid gap-3">
              {academicLinks.map((item) => <LinkTile key={item.href} item={item} />)}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="card-works-title">
          <div className="mb-5 flex items-center gap-3">
            <Microscope size={26} className="text-cyan-800" aria-hidden="true" />
            <h2 id="card-works-title" className="text-2xl font-bold text-slate-900">Patoloji ve Akademik Çalışmalarım</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {contentLinks.map((item) => <LinkTile key={item.href} item={item} />)}
          </div>
        </section>

        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 sm:flex-row sm:items-center">
          <p className="m-0">
            Bu kartvizit kişisel ve akademik bilgilendirme amaçlıdır.
            Lütfen e-posta ile hasta kimlik bilgisi veya sağlık raporu göndermeyiniz.
          </p>
          <a href="/kvkk-aydinlatma-metni/" className="inline-flex shrink-0 items-center gap-1 font-semibold text-blue-800 underline">
            KVKK Bilgilendirmesi <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
    </PageContainer>
  );
}
