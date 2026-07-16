import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Dna, FileText, CheckCircle, AlertTriangle, Syringe, Clock, ThermometerSnowflake, Microscope } from 'lucide-react';
import { RelatedPages } from '../components/RelatedPages';

export function NgsTestSecimi() {
  return (
    <PageContainer>
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#06255b] via-[#0b6ecb] to-[#0ea5a5] text-white p-8 md:p-12 mb-10 shadow-xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 bg-white/20 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
            <Dna size={18} />
            <span className="text-sm font-bold tracking-wide uppercase">Rehber</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            NGS Test Seçimi ve Örnek Gönderim Rehberi
          </h1>
          <p className="text-lg md:text-xl text-teal-50/90 font-medium max-w-3xl leading-relaxed mt-2">
            Moleküler patoloji laboratuvarına gönderilecek olan doku örneklerinin seçimi, preanalitik süreçleri ve test paneli endikasyonları hakkında güncel kılavuz.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol Kolon - Ana İçerik */}
        <div className="lg:col-span-2 space-y-8">
          
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <CheckCircle size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Test Seçimi: Hangi Panel?</h2>
            </div>
            
            <div className="space-y-6">
              <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Dna size={20} className="text-blue-500" />
                  Kapsamlı Genomik Profilleme (CGP)
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Hem SNV/Indel hem de CNV (kopya sayısı değişikliği) analizini kapsar. TMB (Tümör Mutasyon Yükü) ve MSI durumunu belirler. Genellikle ileri evre, standart tedavilere dirençli veya hedefe yönelik tedavi seçeneği araştırılan solid tümörlerde tercih edilir.
                </p>
                <ul className="list-disc pl-5 text-slate-600 space-y-1">
                  <li>679 Gen (DNA)</li>
                  <li>TMB ve MSI değerlendirmesi</li>
                  <li>HRD (Homolog Rekombinasyon Yetersizliği) analizi (gerektiğinde)</li>
                </ul>
              </div>

              <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Microscope size={20} className="text-teal-500" />
                  RNA Füzyon Paneli
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Yapısal değişikliklerin (translokasyon/füzyon) DNA tabanlı tespitinin zor olduğu durumlarda (örn. NTRK, ALK, ROS1, RET) veya gen füzyonlarının sık görüldüğü sarkom, akciğer ve tiroid tümörlerinde gereklidir.
                </p>
                <ul className="list-disc pl-5 text-slate-600 space-y-1">
                  <li>80 Gen (RNA) Transkript Analizi</li>
                  <li>Bilinen ve bilinmeyen partner analizi</li>
                  <li>Splicing varyant tespiti</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Syringe size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Örnek Hazırlığı ve Gönderimi</h2>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 border border-slate-100 rounded-2xl">
                <div className="shrink-0 mt-1"><FileText className="text-slate-400" /></div>
                <div>
                  <h4 className="font-bold text-slate-800">Dokunun Seçimi</h4>
                  <p className="text-slate-600 mt-1">Nekroz, kanama veya yoğun mukus içermeyen, tümör hücresi oranı yüksek bloklar seçilmelidir. İdeal tümör hücresi oranı &gt;%20 olmalıdır.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 border border-slate-100 rounded-2xl">
                <div className="shrink-0 mt-1"><Clock className="text-slate-400" /></div>
                <div>
                  <h4 className="font-bold text-slate-800">Fiksasyon Süresi</h4>
                  <p className="text-slate-600 mt-1">%10 Nötral Tamponlu Formalin (NBF) içerisinde ideal olarak 6-48 saat (meme için 6-72 saat) fikse edilmelidir. Dekalsifikasyon işlemi nükleik asit bozunmasına yol açabileceğinden (özellikle asit tabanlı dekalsifikasyon) kaçınılmalıdır.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 border border-slate-100 rounded-2xl">
                <div className="shrink-0 mt-1"><ThermometerSnowflake className="text-slate-400" /></div>
                <div>
                  <h4 className="font-bold text-slate-800">Saklama Koşulları</h4>
                  <p className="text-slate-600 mt-1">Kesitler lamlara alındıktan sonra oksidasyonu önlemek için olabildiğince kısa sürede DNA/RNA izolasyonu yapılmalı veya hava almayan kaplarda 4°C'de saklanmalıdır.</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Sağ Kolon - Uyarılar ve Linkler */}
        <div className="space-y-8">
          <div className="bg-rose-50 border-l-4 border-rose-500 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-rose-600" />
              <h3 className="font-bold text-rose-900 text-lg">Preanalitik Hatalar</h3>
            </div>
            <ul className="space-y-3 text-rose-800/80 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Yetersiz fiksasyon veya over-fiksasyon (DNA fragmantasyonuna yol açar).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Yoğun koter artefaktı içeren dokular.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Asit dekalsifikasyon solüsyonlarının kullanılması (EDTA tercih edilmelidir).</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Faydalı Bağlantılar</h3>
            <div className="space-y-3">
              <a href="/ngs/" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                <span className="font-medium text-slate-700">DNA/RNA Gen Arama Motoru</span>
                <Dna size={16} className="text-slate-400 group-hover:text-blue-500" />
              </a>
              <a href="/ngs_afis.pdf" target="_blank" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                <span className="font-medium text-slate-700">NGS Test Afişi (PDF)</span>
                <FileText size={16} className="text-slate-400 group-hover:text-red-500" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <RelatedPages 
        pages={[
          {
            title: "Tüm Kanser Genleri",
            subtitle: "Interaktif DNA ve RNA füzyon paneli",
            page: "ngs",
            color: "bg-blue-600",
            icon: Dna
          },
          {
            title: "Meme HER2 Algoritması",
            subtitle: "HER2 skorlama ve test seçim rehberi",
            page: "meme-her2",
            color: "bg-pink-600",
            icon: Microscope
          }
        ]}
      />
    </PageContainer>
  );
}
