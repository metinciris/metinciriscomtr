import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { FileBarChart, Github, ExternalLink, FileSpreadsheet, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function SinavAnalizi() {
  return (
    <PageContainer>
      <div className="bg-gradient-to-r from-[#00A6D6] to-[#0078D4] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Sınav Analiz Sistemi</h1>
        <p className="text-white/90">
          Optik cevap kağıdına işaretlenmiş test sınavlarını analiz eden Excel dosyası: Universal Analiz
        </p>
      </div>

      {/* Açık Kaynak Duyurusu */}
      <div className="bg-gradient-to-r from-[#8E44AD] to-[#9B59B6] text-white p-8 mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles size={32} />
          <h2 className="text-white m-0">Analiz dosyaları artık Github üzerinde açık kaynak</h2>
          <Sparkles size={32} />
        </div>
        <p className="text-white/90 max-w-2xl mx-auto">
          Universal Analiz Excel dosyaları artık Github'ta açık kaynak olarak sunuluyor. 
          Katkıda bulunabilir ve projeyi geliştirebilirsiniz!
        </p>
      </div>

      {/* Ana Görsel */}
      <div className="bg-white p-8 mb-8">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1649052902037-a353259d121d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleGFtJTIwdGVzdCUyMGFuYWx5c2lzJTIwc3ByZWFkc2hlZXR8ZW58MXx8fHwxNzYyODAzOTgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Sınav Analiz Sistemi"
          className="w-full h-96 object-cover mb-6"
        />
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Universal Analiz</h2>
          <p className="text-muted-foreground mb-6">
            Optik cevap kağıdına işaretlenmiş test sınavlarını analiz eden güçlü bir Excel dosyası. 
            Öğrencilerin performansını detaylı şekilde analiz eder ve raporlar.
          </p>
        </div>
      </div>

      {/* İndirme */}
      <div className="mb-8">
        <h2 className="mb-6 text-center">İndirme</h2>
        <div className="max-w-2xl mx-auto">
          {/* Github */}
          <div className="bg-white p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-[#24292e] w-20 h-20 flex items-center justify-center text-white">
                <Github size={40} />
              </div>
              <div>
                <h3 className="mb-1">Github</h3>
                <p className="text-muted-foreground m-0">Açık kaynak proje - 200 soruluk tam sürüm</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              Github üzerinden Universal Analiz dosyalarını indirin. 200 soruluk tam sürüm ve yardımcı 
              dosyalar dahil. Analizi yapılmış sanal sınav ve sanal öğrencileri içerir. Kaynak kodlarını 
              inceleyin ve projeye katkıda bulunun.
            </p>
            <a
              href="https://github.com/metinciris/sinav_analiz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#24292e] text-white px-8 py-4 hover:bg-[#1a1e22] transition-colors w-full justify-center"
            >
              <Github size={24} />
              <span>Github'dan İndir</span>
            </a>
          </div>
        </div>
      </div>

      {/* Özellikler */}
      <div className="mb-8">
        <h2 className="mb-6 text-center">Universal Analiz Özellikleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 text-center">
            <div className="bg-[#00A6D6] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <FileSpreadsheet size={32} />
            </div>
            <h3 className="mb-3">Excel Tabanlı</h3>
            <p className="text-muted-foreground">
              Microsoft Excel ile çalışan, kolay kullanılabilir analiz aracı
            </p>
          </div>

          <div className="bg-white p-6 text-center">
            <div className="bg-[#27AE60] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <FileBarChart size={32} />
            </div>
            <h3 className="mb-3">Detaylı Analiz</h3>
            <p className="text-muted-foreground">
              Konu bazında başarı oranları ve öğrenci performans raporları
            </p>
          </div>

          <div className="bg-white p-6 text-center">
            <div className="bg-[#8E44AD] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <Github size={32} />
            </div>
            <h3 className="mb-3">Açık Kaynak</h3>
            <p className="text-muted-foreground">
              Ücretsiz, açık kaynak kodlu ve sürekli geliştirilen proje
            </p>
          </div>
        </div>
      </div>

      {/* Koordinatörlük Blogu */}
      <div className="bg-gradient-to-r from-[#FF8C00] to-[#FF6600] text-white p-8 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-white mb-4">Koordinatörlük Blogu</h2>
          <p className="text-white/90 mb-6">
            Sınav analizi, eğitim koordinatörlüğü ve öğretim teknikleri hakkında daha fazla bilgi için 
            koordinatörlük blogunu ziyaret edin.
          </p>
          <a
            href="https://koordinatorluk.blogspot.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#FF8C00] px-8 py-4 hover:bg-white/90 transition-colors"
          >
            <ExternalLink size={24} />
            <span>Koordinatörlük Blogu'na Git</span>
          </a>
        </div>
      </div>

      {/* Nasıl Çalışır */}
      <div className="bg-white p-8 mb-8">
        <h2 className="mb-6 text-center">Nasıl Çalışır?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-[#00A6D6] text-white w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl">
              1
            </div>
            <h3 className="mb-3">İndirin</h3>
            <p className="text-muted-foreground">
              Github veya Drive üzerinden Universal Analiz dosyasını indirin
            </p>
          </div>

          <div className="text-center">
            <div className="bg-[#27AE60] text-white w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl">
              2
            </div>
            <h3 className="mb-3">Veri Girin</h3>
            <p className="text-muted-foreground">
              Optik okuyucu cevaplarını veya manuel olarak öğrenci cevaplarını girin
            </p>
          </div>

          <div className="text-center">
            <div className="bg-[#8E44AD] text-white w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl">
              3
            </div>
            <h3 className="mb-3">Analiz Edin</h3>
            <p className="text-muted-foreground">
              Otomatik olarak oluşturulan detaylı analiz raporlarını görüntüleyin
            </p>
          </div>
        </div>
      </div>

      {/* Sağlanan Analizler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#E3F2FD] border-l-4 border-[#00A6D6] p-6">
          <h3 className="mb-4">Analiz Raporları</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-[#00A6D6]">•</span>
              <span>Öğrenci bazında başarı oranları</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00A6D6]">•</span>
              <span>Soru bazında analiz ve zorluk dereceleri</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00A6D6]">•</span>
              <span>Konu bazında performans ölçümü</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00A6D6]">•</span>
              <span>Sınıf ortalaması ve standart sapma</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#00A6D6]">•</span>
              <span>Grafik ve tablo görünümleri</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#E8F5E9] border-l-4 border-[#27AE60] p-6">
          <h3 className="mb-4">Avantajlar</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-[#27AE60]">•</span>
              <span>200 soruya kadar analiz kapasitesi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#27AE60]">•</span>
              <span>Ücretsiz ve açık kaynak</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#27AE60]">•</span>
              <span>Offline çalışabilme</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#27AE60]">•</span>
              <span>Örnek sanal sınav ve öğrenciler dahil</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#27AE60]">•</span>
              <span>Sürekli güncellenen proje</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Destek ve Katkı */}
      <div className="bg-white p-8 mb-8">
        <h2 className="mb-6 text-center">Destek ve Katkı</h2>
        <div className="max-w-3xl mx-auto">
          <p className="text-muted-foreground text-center mb-6">
            Universal Analiz açık kaynak bir projedir. Github üzerinden projeye katkıda bulunabilir, 
            hata bildirebilir veya yeni özellik önerebilirsiniz.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://github.com/metinciris/sinav_analiz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#24292e] text-white px-6 py-3 hover:bg-[#1a1e22] transition-colors"
            >
              <Github size={20} />
              <span>Github Projesini Görüntüle</span>
            </a>
            <a
              href="https://koordinatorluk.blogspot.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FF8C00] text-white px-6 py-3 hover:bg-[#FF6600] transition-colors"
            >
              <ExternalLink size={20} />
              <span>Blog'u Ziyaret Et</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bilgilendirme */}
      <div className="bg-[#FFF3E0] border-l-4 border-[#FF8C00] p-6">
        <h3 className="mb-3">Kullanım Notu</h3>
        <p className="text-muted-foreground mb-4">
          Universal Analiz Microsoft Excel gerektirir. Dosyayı açtıktan sonra makroların etkinleştirilmesi 
          gerekebilir. Detaylı kullanım talimatları için Github sayfasındaki README dosyasını okuyunuz.
        </p>
        <p className="text-muted-foreground m-0">
          Sorularınız veya sorunlarınız için Github Issues bölümünü kullanabilir veya 
          koordinatörlük blogu üzerinden iletişime geçebilirsiniz.
        </p>
      </div>
    </PageContainer>
  );
}
