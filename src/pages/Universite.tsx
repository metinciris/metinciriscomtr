import { PageContainer } from '../components/PageContainer';
import {
  BookOpen,
  GraduationCap,
  Utensils,
  FolderOpen,
  Calendar,
  Camera,
} from 'lucide-react';

interface UniversiteProps {
  onNavigate?: (page: string) => void;
}

/** Üniversite ve SDÜ arşiv sayfalarına kısa bağlantılar */
const ARCHIVE_LINKS = [
  {
    title: 'SDÜ Tıp Fakültesi Patoloji Ders Notlarım',
    description: 'Tıp öğrencileri için patoloji ders slaytları ve özet notlar.',
    icon: BookOpen,
    page: 'donem-3',
    color: '#00A6D6',
  },
  {
    title: 'Ders Programı',
    description: 'SDÜ Tıp Fakültesi patoloji ders programı ve akademik takvim.',
    icon: Calendar,
    page: 'ders-programi',
    color: '#003E7E',
  },
  {
    title: 'Öğrenci Yemek Listesi',
    description: 'SDÜ kampüs yemekhanesi günlük menüsü.',
    icon: Utensils,
    page: 'ogrenci-yemek',
    color: '#16A085',
  },
  {
    title: 'Hastane Yemek Listesi',
    description: 'SDÜ Araştırma Hastanesi günlük yemek menüsü.',
    icon: Utensils,
    page: 'hastane-yemek',
    color: '#E67E22',
  },
  {
    title: 'Sınav Analizi',
    description: 'Patoloji sınav sonuçları ve başarı analizleri.',
    icon: GraduationCap,
    page: 'sinav-analizi',
    color: '#8E44AD',
  },
  {
    title: 'Slide Galeri',
    description: 'Sanal mikroskopi ve histopatoloji vaka arşivi.',
    icon: Camera,
    page: 'galeri',
    color: '#2563eb',
  },
  {
    title: 'Diş Hekimliği Ders Notları',
    description: 'SDÜ Diş Hekimliği Fakültesi patoloji ders materyalleri.',
    icon: FolderOpen,
    page: null,
    externalUrl:
      'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/AOfBeT92mkwxHs0wt-VIZDQ/Di%C5%9F%20hekimli%C4%9Fi?dl=0&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1',
    color: '#DC143C',
  },
  {
    title: 'Eczacılık Ders Notları',
    description: 'SDÜ Eczacılık Fakültesi patoloji ders materyalleri.',
    icon: FolderOpen,
    page: null,
    externalUrl:
      'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/APcXz0YMCCY2ZVcsb62t80w/Eczac%C4%B1l%C4%B1k?dl=0&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1',
    color: '#3498DB',
  },
] as const;

export function Universite({ onNavigate }: UniversiteProps) {
  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          SDÜ ve Üniversite
        </h2>
        <p className="text-slate-600 max-w-2xl">
          Ders notları, programlar, yemek listeleri ve SDÜ öğrencilerine yönelik kaynaklar.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {ARCHIVE_LINKS.map((item) => {
          const Icon = item.icon;
          const isExternal = !item.page && 'externalUrl' in item;

          const cardContent = (
            <div className="flex items-start gap-4">
              <div
                className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: item.color }}
              >
                <Icon size={22} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 m-0">
                  {item.description}
                </p>
              </div>
            </div>
          );

          if (isExternal) {
            return (
              <a
                key={item.title}
                href={(item as { externalUrl: string }).externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all no-underline"
              >
                {cardContent}
              </a>
            );
          }

          const href = item.page ? `/${item.page}/` : '#';

          return (
            <a
              key={item.title}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                if (item.page && onNavigate) onNavigate(item.page);
              }}
              className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all no-underline"
            >
              {cardContent}
            </a>
          );
        })}
      </div>
    </PageContainer>
  );
}
