import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { MetroTile } from '../components/MetroTile';
import {
  User, MessageSquare, FileText, BookOpen, Stethoscope,
  Utensils, GraduationCap, Briefcase, Activity, FileBarChart,
  BookMarked, Facebook, Building2, FolderOpen, Linkedin, Github, UserCircle
} from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export function Home({ onNavigate }: HomeProps) {
  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Hero Header */}
      <div className="bg-[#00A6D6] text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-white mb-2">Prof Dr Metin ÇİRİŞ</h1>
          <p className="text-white/90">SDÜ Tıp Fakültesi Tıbbi Patoloji</p>
        </div>
      </div>

      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* HASTA Bölümü */}
          <div>
            <h2 className="mb-6">Hasta</h2>
            <div className="grid grid-cols-2 gap-4">
              <MetroTile
  title="İletişim"
  subtitle="Hastalarla iletişim"
  icon={
    <img
      src="/img/metinciris.png"
      alt="Prof. Dr. Metin Çiriş"
      className="w-16 h-16 rounded-full object-cover border-2 border-white/70 shadow-md"
    />
  }
  color="bg-[#00A6D6]"
  size="wide"
  onClick={() => onNavigate('iletisim')}
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
                subtitle="Tanıma ve iş birliği"
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
            </div>
          </div>

          {/* ÖĞRENCİ Bölümü */}
          <div>
            <h2 className="mb-6">Öğrenci</h2>
            <div className="grid grid-cols-2 gap-4">
              <MetroTile
                title="SDÜ Tıp Patoloji Notlarım"
                subtitle=""
                icon={<BookMarked size={40} />}
                color="bg-[#00A6D6]"
                size="wide"
                onClick={() => onNavigate('donem-3')}
              />
              <MetroTile
                title="Diş Ders Notlarım"
                subtitle=""
                icon={<FolderOpen size={40} />}
                color="bg-[#E67E22]"
                size="medium"
                onClick={() => window.open('https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/AOfBeT92mkwxHs0wt-VIZDQ/Di%C5%9F%20hekimli%C4%9Fi?dl=0&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1', '_blank')}
              />
              <MetroTile
                title="Eczacılık Notlarım"
                subtitle=""
                icon={<FolderOpen size={40} />}
                color="bg-[#3498DB]"
                size="medium"
                onClick={() => window.open('https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/APcXz0YMCCY2ZVcsb62t80w/Eczac%C4%B1l%C4%B1k?dl=0&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1', '_blank')}
              />
              <MetroTile
                title="Patoloji Ders Programları"
                subtitle=""
                icon={<GraduationCap size={40} />}
                color="bg-[#003E7E]"
                size="medium"
                onClick={() => onNavigate('ders-programi')}
              />
            </div>
          </div>

          {/* AKADEMİK Bölümü */}
          <div>
            <h2 className="mb-6">Akademik</h2>
            <div className="grid grid-cols-2 gap-4">
              <MetroTile
                title="Yayınlar"
                subtitle=""
                icon={<FileText size={40} />}
                color="bg-[#DC143C]"
                size="medium"
                onClick={() => onNavigate('yayinlar')}
              />
              <MetroTile
                title="Portfolyo"
                subtitle=""
                icon={<Briefcase size={40} />}
                color="bg-[#8E44AD]"
                size="medium"
                onClick={() => onNavigate('portfolyo')}
              />
              <MetroTile
                title="Profil"
                subtitle=""
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
                title="Sınav Analizi"
                subtitle=""
                icon={<FileBarChart size={40} />}
                color="bg-[#27AE60]"
                size="medium"
                onClick={() => onNavigate('sinav-analizi')}
              />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
