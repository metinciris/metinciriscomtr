/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ReportingDisclaimer() {
  return (
    <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-3 text-slate-400">
        <AlertCircle size={18} />
        <span className="text-xs font-black uppercase tracking-widest">Önemli Bilgilendirme</span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed font-medium">
        Sunulan raporlama formatları, patoloji uzmanları ve patoloji asistanlarının mesleki uygulamalarında ve eğitimlerinde kullanılmak üzere hazırlanmıştır. Bu içerikler tıbbi karar yerine geçmez; klinik bağlam ve uzman değerlendirmesi her zaman önceliklidir.
      </p>
    </div>
  );
}
