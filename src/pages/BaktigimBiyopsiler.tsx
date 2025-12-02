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
            src="/img/metin-ciris.jpg"
            alt="Prof. Dr. Metin Çiriş"
            className="w-full h-96 object-cover mb-6"
          />
          <h2 className="mb-2">Prof. Dr. Metin Çiriş</h2>
          <p className="text-muted-foreground mb-4">
            Süleyman Demirel Üniversitesi<br />
            Tıp Fakültesi Tıbbi Patoloji Anabilim Dalı<br />
            Öğretim Üyesi<br />
            Merkez / Isparta
          </p>
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
              <div className="flex items-start gap-3 p-3 bg-white">
                <span className="text-[#E67E22]">•</span>
                <span className="text-muted-foreground">Kemik ve yumuşak doku patolojisi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Uzmanlık Alanları Görselleri */}
      <div className="mb-8">
        <h2 className="mb-6">Uzmanlık Alanları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* 1. Endokrin sistem patolojisi */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/endocrine_pathology.jpg"
              alt="Endokrin sistem patolojisi"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#8E44AD] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Endokrin sistem patolojisi</h3>
              <p className="text-white/90 m-0">Tiroid, Paratiroid, Hipofiz, Adrenal gland</p>
            </div>
          </div>

          {/* 2. Sitopatoloji */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/cytopathology.jpg"
              alt="Sitopatoloji"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#E74C3C] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Sitopatoloji</h3>
              <p className="text-white/90 m-0">Tiroid, paratiroid İİAB</p>
            </div>
          </div>

          {/* 3. Baş-Boyun Patolojisi */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/bas-boyun-patolojisi.jpg"
              alt="Baş-Boyun Patolojisi"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#27AE60] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Baş-Boyun Patolojisi</h3>
              <p className="text-white/90 m-0">Baş ve boyun bölgesi tümörleri</p>
            </div>
          </div>

          {/* 4. Hepatobiliyer Sistem ve pankreas */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/hepatobiliyer-pankreas.jpg"
              alt="Hepatobiliyer Sistem ve pankreas"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#E74C3C] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Hepatobiliyer Sistem ve pankreas</h3>
              <p className="text-white/90 m-0">Karaciğer, safra yolları ve pankreas patolojisi</p>
            </div>
          </div>

          {/* 5. Nefropatoloji */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/nefropatoloji.jpg"
              alt="Nefropatoloji"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1BA1E2] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Nefropatoloji</h3>
              <p className="text-white/90 m-0">Böbrek patolojisi</p>
            </div>
          </div>

          {/* 6. Kemik ve Yumuşak Doku */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/kemik-yumusak-doku.jpg"
              alt="Kemik ve Yumuşak Doku"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#E67E22] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Kemik ve Yumuşak Doku</h3>
              <p className="text-white/90 m-0">Sarkom ve tümör patolojisi</p>
            </div>
          </div>

          {/* 7. Frozen */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/frozen_section.png"
              alt="Frozen"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00A6D6] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Frozen</h3>
              <p className="text-white/90 m-0">Ameliyat esnasında frozen inceleme</p>
            </div>
          </div>

          {/* 8. Moleküler tetkikler */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/molekuler-tetkik.jpg"
              alt="Moleküler tetkikler"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#9B59B6] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Moleküler tetkikler</h3>
              <p className="text-white/90 m-0">Tümör patolojisi moleküler tetkikleri</p>
            </div>
          </div>

          {/* 9. NGS */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/ngs.jpg"
              alt="NGS"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#9B59B6] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">NGS (Yeni Nesil Dizileme)</h3>
              <p className="text-white/90 m-0">Tümör dokusundaki genetik değişiklikleri detaylı inceleyen ileri test</p>
            </div>
          </div>

          {/* 10. Metastatik tümörler */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/metastatik-tumor.jpg"
              alt="Metastatik tümörler"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#34495E] to-transparent opacity-90"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Metastatik tümörler</h3>
              <p className="text-white/90 m-0">Karaciğer, kemik, beyin metastazlarından tanı</p>
            </div>
          </div>

          {/* 11. Konsültasyon */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/konsultasyon.jpg"
              alt="Konsültasyon"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#34495E] to-transparent opacity-90"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Konsültasyon</h3>
              <p className="text-white/90 m-0">Patoloji konsültasyonu. Preparat ve parafin blok birlikte gönderilmelidir.</p>
            </div>
          </div>

          {/* 12. Deneysel Patoloji */}
          <div className="relative overflow-hidden group">
            <ImageWithFallback
              src="/img/deneysel-patoloji.jpg"
              alt="Deneysel Patoloji"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16A085] to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="text-white mb-2">Deneysel Patoloji</h3>
              <p className="text-white/90 m-0">Deney hayvanları patolojisi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Laboratuvar Görseli */}
      <div className="mb-8">
        <div className="relative overflow-hidden">
          <ImageWithFallback
            src="/img/patoloji-laboratuvar.jpg"
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
