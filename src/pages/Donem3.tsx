import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Download, ExternalLink } from 'lucide-react';

export function Donem3() {
  const kurulData = [
    {
      emoji: '🧩',
      title: 'Kurul 2',
      lessons: [
        {
          name: 'Hemodinamik bozuklukların patolojisi (1 ve 2)',
          links: [
            'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/APQr4p1OeAim7lcwT4Ncruc/T%C4%B1p%203/2.%20kurul?dl=0&preview=1.+Patolojiye+Giri%C5%9F.ppt&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1'
          ]
        },
        {
          name: 'Pratik: Ödem, trombüs, atrofi, hiperplazi örneklerinin incelemesi',
          links: [
            'https://drive.google.com/drive/u/1/folders/1SHoTlPM4JI45_lRNBBDcce8N_b9H_Ge0'
          ]
        },
        {
          name: 'Patoloji Laboratuvarı tanıtım videosu izle',
          links: [
            'https://www.youtube.com/watch?v=EG0B2uJ72BM'
          ],
          isVideo: true
        }
      ],
      color: 'bg-[#00A6D6]'
    },
    {
      emoji: '🫀',
      title: 'Kurul 3',
      lessons: [
        {
          name: 'Nazal Kavite, Paranazal Sinüsler, Nazofarenks ve Larenks Patolojisi',
          links: [
            'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/APBFoS7MSB2ub-F1EcoWhZs/T%C4%B1p%203/3.%20kurul/Nazal%20Kavite%2C%20Paranazal%20Sin%C3%BCsler%2C%20Nazofarenks%20ve%20Larinks%20Patolojisi?dl=0&preview=Ba%C5%9F+Boyun+Patolojisi.pptx&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1'
          ]
        },
        {
          name: 'İskemik Kalp Hastalıkları Patolojisi / Valvüler Kalp Hastalıkları Patolojisi / Kardiyomyopatilerin Patolojisi',
          links: [
            'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/AOpUCZo5fxLmMzqO8sL4tro/T%C4%B1p%203/3.%20kurul?dl=0&preview=Patoloji+-+Kalp+iskemik+-+kapak+hastal%C4%B1klar%C4%B1.pptx&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1'
          ]
        }
      ],
      color: 'bg-[#E74C3C]'
    },
    {
      emoji: '🧫',
      title: 'Kurul 4',
      lessons: [
        {
          name: 'Karaciğerin Yapısal Bozuklukları, Kistik Hastalıkları / Hepatitlerin Patolojisi / Karaciğer Tümörlerinin Patolojisi / Siroz Patolojisi / Karaciğerin Bakteriyel, Parazitik ve Damarsal Hastalıkları / Safra Kesesi ve Karaciğer Dışı Safra Yolları Patolojisi / Ekzokrin Pankreas Hastalıkları Patolojisi / Pankreas Tümörleri Patolojisi',
          links: [
            'https://docs.google.com/presentation/d/1w2r7k1BuKN3EqAvL4_fQ4blw9PnEenrxicXTPcvrZ_o/edit'
          ]
        },
        {
          name: 'Pratik dersler: Gastrit, Pleomorfik Adenom, Warthin Tümörü, Kolesistit örneklerinin incelemesi / Siroz ve Karaciğer Tümör örneklerinin mikroskobik incelemesi / Gastrit, Pleomorfik Adenom, Warthin Tümörü, Kolesistit örneklerinin incelemesi (4 saat)',
          links: [
            'https://drive.google.com/drive/u/1/folders/14i5GZHv0dkPHrXMi1cW5OIUa98Ho4wis'
          ]
        }
      ],
      color: 'bg-[#27AE60]'
    },
    {
      emoji: '🧠',
      title: 'Kurul 5',
      lessons: [
        {
          name: 'Glomerüler Hastalıkların Patolojisi / Tubulus ve İnterstisyel Böbrek Hastalıklarının Patolojisi',
          links: [
            'https://www.dropbox.com/scl/fi/wn48dm1aafao20zc0em41/B-brek-Patolojisi-t-m-r-d.pptx?rlkey=ygfav7qd0yglw6itdifbu8c09&st=bx2mzpbt&dl=0'
          ]
        },
        {
          name: 'Hipofiz Hastalıklarının Patolojisi / Sürrenal Hastalıkların Patolojisi / Tiroid ve Paratiroid Hastalıklarının Patolojisi / Endokrin Pankreas Hastalıklarının Patolojisi',
          links: [
            'https://docs.google.com/presentation/d/1VIudF8m2D9haq7MDTrtOMGfjdKICzIHVQS1glykVQ88/edit?slide=id.g111fcb90412_0_3#slide=id.g111fcb90412_0_3'
          ]
        },
        {
          name: 'Pratik: Nodüler kollaidal guatr, tiroidit ve tiroid tümör örneklerinin mikroskobik incelemesi',
          links: [
            'https://docs.google.com/presentation/d/1VIudF8m2D9haq7MDTrtOMGfjdKICzIHVQS1glykVQ88/edit?slide=id.p#slide=id.p'
          ]
        }
      ],
      color: 'bg-[#8E44AD]'
    },
    {
      emoji: '🦴',
      title: 'Kurul 6',
      lessons: [
        {
          name: 'SSS\'nin Vasküler Hastalıklarının Patolojisi',
          links: [
            'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/AFShcT9sdh048Ve5pBaNufE/T%C4%B1p%203/6.%20kurul?dl=0&preview=SSS%E2%80%99nin+Vask%C3%BCler+Hastal%C4%B1klar%C4%B1n%C4%B1n+ve+anomalilerin+Patolojisi.pptx&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1'
          ]
        },
        {
          name: 'Normal İskelet Sistemi, Kemik Yapımı ve Gelişimi / Kemiğin Gelişimsel ve Kazanılmış Anomalileri / Kemik Kırıkları, Osteonekroz ve Kemik Enfeksiyonları / Kemik Tümörleri ve Tümör Benzeri Lezyonlarının Patolojisi / Eklem Hastalıkları ve Eklemleri Tutan Tümörlerin Patolojisi / Yumuşak Doku Tümörlerinin Patolojisi',
          links: [
            'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/AFShcT9sdh048Ve5pBaNufE/T%C4%B1p%203/6.%20kurul?e=1&preview=Kemik%2C+eklem%2C+yumu%C5%9Fak+doku+patolojisi.pptx&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1&dl=0'
          ]
        },
        {
          name: 'Göz Hastalıkları Patolojisi',
          links: [
            'https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/AFShcT9sdh048Ve5pBaNufE/T%C4%B1p%203/6.%20kurul?dl=0&preview=G%C3%B6z+Hastal%C4%B1klar%C4%B1+Patolojisi.pptx&rlkey=4z1tpnwnam9pxt0vo2no8t8v6&subfolder_nav_tracking=1'
          ]
        },
        {
          name: 'Pratik: Yumuşak doku, kemik ve kıkırdak doku tümörü örneklerinin mikroskobik incelemesi',
          links: [
            'https://drive.google.com/drive/u/1/folders/14i5GZHv0dkPHrXMi1cW5OIUa98Ho4wis'
          ]
        }
      ],
      color: 'bg-[#FF8C00]'
    }
  ];

  return (
    <PageContainer>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#00A6D6] to-[#0078D4] text-white p-12 mb-8 rounded-lg">
        <h1 className="text-white mb-4">Dönem 3 - Tıbbi Patoloji</h1>
        <p className="text-white/90 text-lg">
          SDÜ Dönem 3 - Tıbbi Patoloji Ders notlarım
        </p>
      </div>

      {/* Kurul Bilgilendirme */}
      <div className="bg-gradient-to-r from-[#8E44AD] to-[#9B59B6] text-white p-6 mb-8 rounded-lg">
        <p className="text-white/95 text-center m-0 mb-4">
          📚 Aşağıda kurullara göre organize edilmiş ders notları ve pratik ders materyalleri bulunmaktadır
        </p>
        <div className="text-center">
          <a
            href="https://www.dropbox.com/scl/fo/ux2nae6xf2vc09m63jwwj/AL8W24d0di7HbFKddFeWF7U/T%C4%B1p%203?rlkey=4z1tpnwnam9pxt0vo2no8t8v6&e=1&subfolder_nav_tracking=1&dl=0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#8E44AD] px-6 py-3 rounded-lg hover:bg-white/90 transition-colors no-underline"
          >
            <Download size={20} />
            SDÜ Tıp ders notlarımın tamamına ulaşın
          </a>
        </div>
      </div>

      {/* Kurullar */}
      <div className="space-y-8">
        {kurulData.map((kurul, kurulIndex) => (
          <div key={kurulIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Kurul Başlığı */}
            <div className={`${kurul.color} text-white px-6 py-5 flex items-center gap-3`}>
              <span className="text-3xl">{kurul.emoji}</span>
              <h2 className="text-white m-0">{kurul.title}</h2>
              {kurul.title === 'Kurul 6' && (
                <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
                  Kurul Başkanı – Tıbbi Patoloji
                </span>
              )}
            </div>

            {/* Dersler */}
            <div className="p-6 space-y-4">
              {kurul.lessons.map((lesson, lessonIndex) => (
                <div
                  key={lessonIndex}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  {/* Ders Adı */}
                  <div className="mb-4">
                    <p className="text-gray-800 leading-relaxed m-0">
                      {lesson.name}
                    </p>
                  </div>

                  {/* İndirme Butonları */}
                  <div className="flex flex-wrap gap-3">
                    {lesson.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${
                          lesson.isVideo
                            ? 'bg-[#E74C3C] hover:bg-[#C0392B]'
                            : 'bg-[#00A6D6] hover:bg-[#0078D4]'
                        } text-white px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2 no-underline`}
                      >
                        {lesson.isVideo ? (
                          <>
                            <ExternalLink size={18} />
                            Video İzle
                          </>
                        ) : lesson.links.length > 1 ? (
                          <>
                            <Download size={18} />
                            İndir {linkIndex + 1}
                          </>
                        ) : (
                          <>
                            <Download size={18} />
                            İndir
                          </>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Alt Bilgilendirme */}
      <div className="bg-[#FFF3E0] border-l-4 border-[#FF8C00] p-6 mt-8 rounded">
        <h3 className="mb-3">📌 Önemli Notlar</h3>
        <ul className="space-y-2 text-gray-700 m-0">
          <li>• Tüm ders materyalleri düzenli olarak güncellenmektedir</li>
          <li>• Pratik dersler için ilgili bağlantıları takip ediniz</li>
          <li>• Sorularınız için iletişim sayfasından ulaşabilirsiniz</li>
        </ul>
      </div>
    </PageContainer>
  );
}
