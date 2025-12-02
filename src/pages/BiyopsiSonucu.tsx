import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { FileCheck, Shield, MessageSquare, Phone, Globe } from 'lucide-react';

export function BiyopsiSonucu() {
  return (
    <PageContainer>
      <div className="bg-gradient-to-r from-[#8E44AD] to-[#9B59B6] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Online Patoloji Raporu</h1>
        <p className="text-white/90">
          SDÜ patoloji sonucunu alabilirsiniz
        </p>
      </div>

      {/* E-imza Bilgisi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#00A6D6] w-16 h-16 flex items-center justify-center text-white">
              <Shield size={32} />
            </div>
            <div>
              <h2 className="mb-1">E-İmza ile Rapor</h2>
              <p className="text-muted-foreground m-0">Güvenli ve geçerli</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Raporunuzu <strong>e-imza ile imzalanmış</strong> alabilirsiniz.
          </p>
          <p className="text-muted-foreground">
            E-imza (elektronik imza) ıslak imza ile eşdeğerlidir.
          </p>
        </div>

        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#27AE60] w-16 h-16 flex items-center justify-center text-white">
              <MessageSquare size={32} />
            </div>
            <div>
              <h2 className="mb-1">Otomatik SMS</h2>
              <p className="text-muted-foreground m-0">Rapor hazır bilgilendirmesi</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Biyopsiniz için iki kez SMS alırsınız: Patoloji laboratuvarına giriş yapılınca ve raporunuz uzman doktor tarafından onaylanınca hastane sistemiyle otomatik SMS gönderilir.
          </p>
        </div>
      </div>

      {/* Rapor Alma Süreci */}
      <div className="mb-8">
        <h2 className="mb-6">Rapor Alma Süreci</h2>
        <div className="bg-white p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-[#8E44AD] w-12 h-12 flex items-center justify-center text-white flex-shrink-0">
              <FileCheck size={24} />
            </div>
            <div>
              <h3 className="mb-3">Patoloji sonucunuz Dr. Metin Çiriş tarafından elektronik imza ile imzalandıktan sonra:</h3>
            </div>
          </div>

          <div className="space-y-6 ml-16">
            <div className="border-l-4 border-[#00A6D6] pl-6">
              <h4 className="mb-2">1. SMS Bildirimi</h4>
              <p className="text-muted-foreground">
                Hastanemizde kayıtlı olan telefona SMS bilgilendirme mesajı (şu no'lu raporunuz çıkmıştır mesajı) gider.
              </p>
            </div>

            <div className="border-l-4 border-[#27AE60] pl-6">
              <h4 className="mb-2">2. Rapor Alma</h4>
              <p className="text-muted-foreground">
                Kendi raporunuzu patoloji sekreterliğimizden gelen SMS'i göstererek alabilirsiniz.
              </p>
            </div>

            <div className="border-l-4 border-[#FF8C00] pl-6">
              <h4 className="mb-2">3. E-Nabız Erişimi</h4>
              <p className="text-muted-foreground">
                Patoloji raporunuzu <strong>e-nabız</strong> üzerinden görebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* İletişim Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#E74C3C] w-16 h-16 flex items-center justify-center text-white">
              <Phone size={32} />
            </div>
            <div>
              <h3 className="mb-1">Patoloji Sekreterliği</h3>
              <p className="text-muted-foreground m-0">Bilgi ve destek için</p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            Lütfen rapor sekreterliğimizi arayın:
          </p>
          <a
            href="tel:+902462119424"
            className="inline-flex items-center gap-2 bg-[#E74C3C] text-white px-6 py-3 hover:bg-[#C0392B] transition-colors"
          >
            <Phone size={20} />
            <span>(246) 211 94 24</span>
          </a>
          <p className="text-sm text-muted-foreground mt-4">
            Özel patoloji değerlendirmesi için sekreterliğimiz ile görüşebilirsiniz.
          </p>
        </div>

        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#0078D4] w-16 h-16 flex items-center justify-center text-white">
              <Globe size={32} />
            </div>
            <div>
              <h3 className="mb-1">E-Nabız</h3>
              <p className="text-muted-foreground m-0">Online rapor görüntüleme</p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            Tüm sağlık raporlarınıza online erişim:
          </p>
          <a
            href="https://enabiz.gov.tr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0078D4] text-white px-6 py-3 hover:bg-[#005A9E] transition-colors"
          >
            <Globe size={20} />
            <span>E-Nabız'a Git</span>
          </a>
        </div>
      </div>

      {/* Önemli Not */}
      <div className="bg-[#FFF3E0] border-l-4 border-[#FF8C00] p-8">
        <h3 className="mb-4">Önemli Hatırlatma</h3>
        <div className="space-y-3 text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="text-[#FF8C00] flex-shrink-0">📱</span>
            <span>
              SMS ile raporunuz çıktı mesajı, kayıtlı telefonunuza <strong>otomatik olarak gelecektir</strong>.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[#FF8C00] flex-shrink-0">📋</span>
            <span>
              Rapor almak için SMS'i göstermeniz gerekmektedir. Sizden kimlik istenebilir.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[#FF8C00] flex-shrink-0">💻</span>
            <span>
              E-Nabız üzerinden raporlarınızı dilediğiniz zaman görüntüleyebilirsiniz.
            </span>
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
