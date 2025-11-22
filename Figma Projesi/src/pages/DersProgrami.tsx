import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, Clock, BookOpen, ExternalLink, FileText } from 'lucide-react';

export function DersProgrami() {
  return (
    <PageContainer>
      <div className="bg-[#11528f] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Ders Programı</h1>
        <p className="text-white/90">
          Ders programı linkleri - Eczacılık Fakültesi, Diş Hekimliği Fakültesi
        </p>
      </div>

      {/* SDÜ Tip */}
      <div className="bg-white p-8 mb-8">
        <h2 className="mb-6">SDÜ Tıp:</h2>
        <div className="bg-[#F5F5F5] p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <FileText size={24} className="text-[#11528f] flex-shrink-0" />
            <div className="flex-1">
              <h3 className="mb-3">Tıp Fakültesi Ders Programı</h3>
              <p className="text-muted-foreground mb-4">
                Tıp Fakültesi Tıbbi Patoloji ders programını görüntülemek için aşağıdaki iframe'i kullanabilir 
                veya yeni sekmede açabilirsiniz.
              </p>
              <a
                href="https://docs.google.com/document/d/e/2PACX-1vQsUJhue2XK6offGQJCtGFLoAfpOnXrtvVKHcw3nhTaEM9Xm9fgE7dkoBlCBtS2MfsSXat7339o8OsH/pub"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#11528f] text-white px-6 py-3 hover:bg-[#0d3e6f] transition-colors"
              >
                <ExternalLink size={20} />
                Yeni Sekmede Aç
              </a>
            </div>
          </div>
        </div>
        
        {/* Iframe */}
        <div className="border-2 border-[#E0E0E0]" style={{ minHeight: '800px' }}>
          <iframe
            src="https://docs.google.com/document/d/e/2PACX-1vQsUJhue2XK6offGQJCtGFLoAfpOnXrtvVKHcw3nhTaEM9Xm9fgE7dkoBlCBtS2MfsSXat7339o8OsH/pub?embedded=true"
            width="100%"
            height="800"
            frameBorder="0"
            className="border-0"
            title="Tıp Fakültesi Ders Programı"
          />
        </div>
      </div>

      {/* SDÜ Diş Patoloji */}
      <div className="bg-white p-8 mb-8">
        <h2 className="mb-6">SDÜ Diş Patoloji:</h2>
        <div className="bg-[#F5F5F5] p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <FileText size={24} className="text-[#27AE60] flex-shrink-0" />
            <div className="flex-1">
              <h3 className="mb-3">Diş Hekimliği Fakültesi Patoloji Ders Programı</h3>
              <p className="text-muted-foreground mb-4">
                Diş Hekimliği Fakültesi Patoloji ders programı için lütfen ilgili bölümle iletişime geçiniz.
              </p>
              <div className="inline-block bg-[#27AE60] text-white px-6 py-3">
                <span>Program Hazırlanıyor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SDÜ Eczacılık Patoloji */}
      <div className="bg-white p-8 mb-8">
        <h2 className="mb-6">SDÜ Eczacılık Patoloji:</h2>
        <div className="bg-[#F5F5F5] p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <FileText size={24} className="text-[#E74C3C] flex-shrink-0" />
            <div className="flex-1">
              <h3 className="mb-3">Eczacılık Fakültesi Patoloji Ders Programı</h3>
              <p className="text-muted-foreground mb-4">
                Eczacılık Fakültesi Patoloji ders programı için lütfen ilgili bölümle iletişime geçiniz.
              </p>
              <div className="inline-block bg-[#E74C3C] text-white px-6 py-3">
                <span>Program Hazırlanıyor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bilgilendirme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#E3F2FD] border-l-4 border-[#11528f] p-6">
          <h3 className="mb-3">Ders Programları Hakkında</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-[#11528f]">•</span>
              <span>Ders programları akademik takvime göre güncellenir</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#11528f]">•</span>
              <span>Program değişiklikleri duyuru panosundan takip edilmelidir</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#11528f]">•</span>
              <span>Ders saatleri ve lokasyonlar değişebilir</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#11528f]">•</span>
              <span>Derse devam zorunludur (%70 devam şartı)</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-[#00A6D6] to-[#11528f] text-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={32} className="text-white" />
            <h3 className="text-white m-0">İletişim</h3>
          </div>
          <p className="text-white/90 mb-4">
            Ders programı ile ilgili sorularınız için:
          </p>
          <div className="space-y-2">
            <p className="text-white m-0">
              <strong>E-posta:</strong> <a href="mailto:metin@metinciris.com.tr" className="text-white hover:underline">metin@metinciris.com.tr</a>
            </p>
            <p className="text-white m-0">
              <strong>Telefon:</strong> (246) 211 92 92
            </p>
          </div>
        </div>
      </div>

      {/* Önemli Notlar */}
      <div className="bg-[#FFF3E0] border-l-4 border-[#FF8C00] p-6">
        <h3 className="mb-3">Öğrencilere Önemli Notlar</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-[#FF8C00]">•</span>
            <span>Pratik derslere beyaz önlük ile gelinmelidir</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF8C00]">•</span>
            <span>Vaka tartışmalarına hazırlıklı gelinmelidir</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF8C00]">•</span>
            <span>Ders materyalleri önceden incelenmelidir</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#FF8C00]">•</span>
            <span>Sınav tarihleri takip edilmelidir</span>
          </li>
        </ul>
      </div>
    </PageContainer>
  );
}
