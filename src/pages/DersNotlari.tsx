import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { FolderOpen, Download, ExternalLink, FileText, BookOpen } from 'lucide-react';

export function DersNotlari() {
  return (
    <PageContainer>
      <div className="bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Ders Notları</h1>
        <p className="text-white/90">
          Tıbbi Patoloji ders notlarına Dropbox üzerinden erişebilirsiniz
        </p>
      </div>

      {/* Ana Kart */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="bg-white p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#27AE60] w-20 h-20 flex items-center justify-center text-white">
              <FolderOpen size={40} />
            </div>
            <div>
              <h2 className="mb-1">Dropbox Klasörü</h2>
              <p className="text-muted-foreground m-0">Tıbbi Patoloji ders materyalleri</p>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Tüm ders notları, sunumlar ve ek materyaller Dropbox klasöründe bulunmaktadır. 
            Aşağıdaki butona tıklayarak Dropbox klasörüne erişebilirsiniz.
          </p>

          <a
            href="https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/ALLPCbZW5mL3cnxg1Jq0JEM?rlkey=4z1tpnwnam9pxt0vo2no8t8v6&e=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#27AE60] text-white px-8 py-4 hover:bg-[#229954] transition-colors w-full justify-center"
          >
            <ExternalLink size={24} />
            <span>Dropbox Klasörünü Aç</span>
          </a>
        </div>
      </div>

      {/* İçerik Bilgisi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 text-center">
          <div className="bg-[#0078D4] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="mb-3">Ders Notları</h3>
          <p className="text-muted-foreground">
            PDF formatında ders notları ve özetler
          </p>
        </div>

        <div className="bg-white p-6 text-center">
          <div className="bg-[#FF8C00] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <h3 className="mb-3">Sunumlar</h3>
          <p className="text-muted-foreground">
            PowerPoint ve PDF sunumları
          </p>
        </div>

        <div className="bg-white p-6 text-center">
          <div className="bg-[#8E44AD] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <Download size={32} />
          </div>
          <h3 className="mb-3">Ek Materyaller</h3>
          <p className="text-muted-foreground">
            Görüntüler, tablolar ve referanslar
          </p>
        </div>
      </div>

      {/* Kullanım Bilgisi */}
      <div className="bg-[#E8F5E9] border-l-4 border-[#27AE60] p-6">
        <h3 className="mb-3">Kullanım Bilgisi</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-[#27AE60]">•</span>
            <span>Dosyaları görüntülemek için Dropbox hesabı gerekmez</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#27AE60]">•</span>
            <span>Dosyaları bilgisayarınıza indirebilirsiniz</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#27AE60]">•</span>
            <span>Mobil cihazlardan da erişilebilir</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#27AE60]">•</span>
            <span>Klasör düzenli olarak güncellenmektedir</span>
          </li>
        </ul>
      </div>
    </PageContainer>
  );
}
