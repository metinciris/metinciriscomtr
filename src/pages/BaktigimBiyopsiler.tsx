import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { GraduationCap, Award, BookOpen, Microscope, Users, Target, Stethoscope, Brain, Heart } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function BaktigimBiyopsiler() {
  return (
    <PageContainer>
      <div className="bg-[#11528f] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Baktığım Biyopsiler</h1>
        <p className="text-white/90">
          Süleyman Demirel Üniversitesi Tıp Fakültesi Tıbbi Patoloji Anabilim Dalında görev yapıyorum
        </p>
      </div>

      {/* Profil Bölümü */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8">
          <ImageWithFallback
            src="https://w3.sdu.edu.tr/foto.aspx?sicil_no=02956"
            alt="Prof. Dr. Metin Çiriş"
            className="w-full h-96 object-cover mb-6"
          />
          <h2 className="mb-2">Prof. Dr. Metin Çiriş</h2>
          <p className="text-muted-foreground mb-4">
            Süleyman Demirel Üniversitesi<br />
            Tıp Fakültesi Tıbbi Patoloji Anabilim Dalı<br />
            Öğretim Üyesi
          </p>
          <div className="bg-[#11528f] text-white p-6">
            <p className="text-white m-0">
              Ben, Prof. Dr. Metin Çiriş, Isparta Süleyman Demirel Üniversitesi Tıp Fakültesi Patoloji
              Anabilim Dalında görev yapıyorum.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white">
                <Microscope size={24} />
              </div>
              <h2>İlgi Alanlarım</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#F5F5F5]">
                <span className="text-[#00A6D6]">•</span>
                <span className="text-muted-foreground">Tiroid ve paratiroid</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white">
                <span className="text-[#27AE60]">•</span>
                <span className="text-muted-foreground">Baş-boyun patolojisi</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#F5F5F5]">
                <span className="text-[#E74C3C]">•</span>
                <span className="text-muted-foreground">Hepatobiliyer sistem</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white">
                <span className="text-[#8E44AD]">•</span>
                <span className="text-muted-foreground">Pankreas</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#F5F5F5]">
                <span className="text-[#F39C12]">•</span>
                <span className="text-muted-foreground">Santral sinir sistemi</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white">
                <span className="text-[#1BA1E2]">•</span>
                <span className="text-muted-foreground">Nefropatoloji</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#F5F5F5]">
                <span className="text-[#9B59B6]">•</span>
                <span className="text-muted-foreground">NGS</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#00A6D6] to-[#11528f] text-white p-8">
            <h3 className="text-white mb-4">Görev ve Sorumluluklar</h3>
            <p className="text-white/90 m-0">
              Tıbbi patoloji alanında hasta tanı ve tedavisine katkı sağlamak,
              tıp öğrencilerinin eğitimi ve bilimsel araştırmalar yapmak temel
              görevlerim arasındadır.
            </p>
          </div>
        </div>
      </div>

      {/* Uzmanlık Alanları Görselleri */}
      <div className="mb-8">
        <h2 className="mb-6">Uzmanlık Alanları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1715111641804-f8af88e93b01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aHlyb2lkJTIwbWVkaWNhbHxlbnwxfHx8fDE3NjI4MDI5MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Tiroid ve Paratiroid"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00A6D6] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Tiroid ve Paratiroid</h3>
              <p className="text-white/90 m-0">Endokrin sistem patolojisi</p>
            </div>
          </div>

          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1630959300489-63dae3a8240a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXRob2xvZ3klMjBtaWNyb3Njb3BlJTIwbGFib3JhdG9yeXxlbnwxfHx8fDE3NjI4MDI5MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Hepatobiliyer Sistem"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#E74C3C] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Hepatobiliyer Sistem</h3>
              <p className="text-white/90 m-0">Karaciğer ve safra yolları</p>
            </div>
          </div>

          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1738778344503-f6e0df318895?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwcmVzZWFyY2glMjBzY2llbmNlfGVufDF8fHx8MTc2Mjc4NzkxNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Santral Sinir Sistemi"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#8E44AD] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Santral Sinir Sistemi</h3>
              <p className="text-white/90 m-0">Nöropatoloji</p>
            </div>
          </div>

          <div className="bg-[#27AE60] text-white p-8 flex flex-col justify-center">
            <div className="mb-4">
              <Stethoscope size={48} className="text-white" />
            </div>
            <h3 className="text-white mb-2">Baş-Boyun Patolojisi</h3>
            <p className="text-white/90 m-0">Baş ve boyun bölgesi hastalıkları</p>
          </div>

          <div className="bg-[#F39C12] text-white p-8 flex flex-col justify-center">
            <div className="mb-4">
              <Heart size={48} className="text-white" />
            </div>
            <h3 className="text-white mb-2">Pankreas</h3>
            <p className="text-white/90 m-0">Pankreas patolojisi</p>
          </div>

          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1715527498501-4eb81f7ce451?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRuZXklMjBuZXBocm9sb2d5JTIwbWVkaWNhbHxlbnwxfHx8fDE3NjI4MDI5MzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Nefropatoloji"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1BA1E2] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Nefropatoloji</h3>
              <p className="text-white/90 m-0">Böbrek patolojisi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Akademik Bilgiler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#27AE60] w-12 h-12 flex items-center justify-center text-white">
              <BookOpen size={24} />
            </div>
            <h2>Eğitim ve Araştırma</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Süleyman Demirel Üniversitesi Tıp Fakültesi Tıbbi Patoloji Anabilim Dalında
            uzun yıllardır öğretim üyeliği yapmaktayım.
          </p>
          <p className="text-muted-foreground mb-4">
            Tıp öğrencilerine patoloji eğitimi vermenin yanı sıra, uzmanlık öğrencilerinin
            eğitiminde de aktif rol almaktayım.
          </p>
          <p className="text-muted-foreground m-0">
            Yukarıda belirtilen ilgi alanlarımda araştırmalar yapmakta ve bilimsel
            yayınlar üretmekteyim.
          </p>
        </div>

        <div className="bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#E74C3C] w-12 h-12 flex items-center justify-center text-white">
              <Users size={24} />
            </div>
            <h2>İletişim ve İş Birliği</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Hastalar, öğrenciler ve meslektaşlarım için her zaman ulaşılabilir olmaya
            çalışıyorum.
          </p>
          <p className="text-muted-foreground mb-4">
            Biyopsi sonuçları, konsültasyon talepleri ve akademik iş birlikleri için
            benimle iletişime geçebilirsiniz.
          </p>
          <div className="bg-[#F5F5F5] p-4">
            <p className="text-muted-foreground m-0">
              <strong>E-posta:</strong> metin@metinciris.com.tr<br />
              <strong>Telefon:</strong> (246) 211 92 92
            </p>
          </div>
        </div>
      </div>

      {/* Laboratuvar Görseli */}
      <div className="mb-8">
        <div className="relative overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1630959300489-63dae3a8240a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXRob2xvZ3klMjBtaWNyb3Njb3BlJTIwbGFib3JhdG9yeXxlbnwxfHx8fDE3NjI4MDI5MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Patoloji Laboratuvarı"
            className="w-full h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#11528f]/90 to-transparent flex items-center">
            <div className="p-12 max-w-2xl">
              <h2 className="text-white mb-4">Tıbbi Patoloji</h2>
              <p className="text-white/90 mb-4">
                Patoloji, hastalıkların nedenlerini, gelişimini ve etkilerini inceleyen
                bir tıp dalıdır.
              </p>
              <p className="text-white/90 m-0">
                Mikroskobik incelemeler ve laboratuvar testleri ile hastalıkların tanısında
                kritik rol oynar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Önemli Not */}
      <div className="bg-[#E3F2FD] border-l-4 border-[#11528f] p-6 mb-8">
        <h3 className="mb-3">Daha Fazla Bilgi</h3>
        <p className="text-muted-foreground m-0">
          Akademik yayınlarım, araştırmalarım ve detaylı özgeçmişim için
          <strong> Akademik</strong> bölümündeki <strong>Yayınlar</strong> sayfasını ziyaret edebilirsiniz.
        </p>
      </div>

      {/* Hızlı Erişim Linkleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <a href="#portfolyo" className="block group">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full hover:shadow-md transition-shadow">
            <h3 className="text-[#11528f] mb-2 group-hover:underline">Uzmanlık Alanlarım ve Akademik Bilgilerim</h3>
            <p className="text-sm text-gray-600">Portfolyo sayfasına git</p>
          </div>
        </a>

        <a href="#yayinlar" className="block group">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full hover:shadow-md transition-shadow">
            <h3 className="text-[#DC143C] mb-2 group-hover:underline">Akademik Yayınlarım</h3>
            <p className="text-sm text-gray-600">Katıldığım bilimsel çalışmalar</p>
          </div>
        </a>

        <a href="#biyopsi-sonucu" className="block group">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full hover:shadow-md transition-shadow">
            <h3 className="text-[#8E44AD] mb-2 group-hover:underline">Biyopsi Sonucu</h3>
            <p className="text-sm text-gray-600">Özel biyopsi değerlendirmesi ve rapor sonuçları</p>
          </div>
        </a>
      </div>
    </PageContainer>
  );
}
