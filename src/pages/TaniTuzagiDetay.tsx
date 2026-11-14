import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, ClipboardCheck, ExternalLink } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { PITFALLS } from '../data/tani-tuzaklari';
import { pitfallUrl, relatedPostsForPitfall } from '../utils/pitfallBlogLinks.js';

type BlogLink = { title: string; path: string; updatedAt?: string };

function ChecklistSection({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  if (!items.length) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
      <h2 className={'mb-4 border-l-4 pl-3 text-xl font-bold ' + accent}>{title}</h2>
      <ul className="space-y-3 pl-5 list-disc text-slate-700 leading-relaxed">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </section>
  );
}

export function TaniTuzagiDetay({ id }: { id: string }) {
  const p = PITFALLS.find((item) => item.id === id);
  const [blogPosts, setBlogPosts] = useState<BlogLink[]>([]);

  useEffect(() => {
    if (!p) return;
    let active = true;
    fetch('/blog/posts.json')
      .then((res) => { if (!res.ok) throw new Error('Blog verisi yüklenemedi'); return res.json(); })
      .then((feed: { posts?: BlogLink[] }) => { if (active) setBlogPosts(Array.isArray(feed.posts) ? feed.posts : []); })
      .catch(() => { if (active) setBlogPosts([]); });
    return () => { active = false; };
  }, [p?.id]);

  const matches = useMemo(() => relatedPostsForPitfall(id, blogPosts, 8), [blogPosts, id]);
  const relatedTopics = useMemo(() => p ? PITFALLS
    .filter((item) => item.id !== p.id && item.organSystem === p.organSystem)
    .slice(0, 5) : [], [p]);

  if (!p) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8">
          <h1 className="text-2xl font-bold">Tanı tuzağı bulunamadı</h1>
          <p className="my-4 text-slate-600">Bu başlık kaldırılmış veya bağlantı hatalı olabilir.</p>
          <a className="text-indigo-700 underline" href="/tani-tuzaklari/">Tüm tanı tuzaklarına dön</a>
        </div>
      </PageContainer>
    );
  }

  const updateText = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(p.updatedAt + 'T12:00:00Z'));

  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl pb-12">
        <nav className="mb-5 text-sm text-slate-600" aria-label="İçerik yolu">
          <a className="hover:text-indigo-700" href="/">Ana Sayfa</a>
          {' / '}<a className="hover:text-indigo-700" href="/tani-tuzaklari/">Tanı Tuzakları</a>
          {' / '}<span aria-current="page">{p.titleTR}</span>
        </nav>
        <header className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-10 text-white mb-6">
          <p className="text-white/70 text-sm font-semibold mb-3">{p.organSystem} · {p.category} · {p.modality}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">{p.titleTR}</h1>
          {p.titleEN && <p className="text-white/85 italic mb-4">{p.titleEN}</p>}
          <p className="text-white/90 text-lg leading-relaxed mb-5">{p.teaser}</p>
          <div className="flex flex-wrap gap-3 items-center text-white/70 text-sm">
            <span>Bilimsel içerik sorumlusu: Prof. Dr. İbrahim Metin Çiriş</span>
            <span className="inline-flex items-center gap-1"><CalendarDays size={15} aria-hidden="true" />
              Son güncelleme: <time dateTime={p.updatedAt}>{updateText}</time>
            </span>
            <span>Zorluk: {p.difficulty}</span>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <ChecklistSection title="Neden Yanıltır?" items={p.whyItTricks} accent="border-red-500" />
          <ChecklistSection title="Ayırıcı Tanı İpuçları" items={p.keyClues} accent="border-emerald-500" />
          <ChecklistSection title="Minimal Çalışma" items={p.minimalWorkup} accent="border-blue-500" />
          <ChecklistSection title="Raporlama Yaklaşımı" items={p.reportingTips} accent="border-indigo-500" />
        </div>

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-7">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-amber-950">
            <ClipboardCheck size={21} aria-hidden="true" /> Olgu Başı Hızlı Kontrol Listesi
          </h2>
          <ul className="space-y-3">
            {p.checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-800">
                <span className="mt-0.5 text-amber-700" aria-hidden="true">✓</span><span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {p.references && p.references.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
            <h2 className="text-xl font-bold mb-4">Kaynaklar</h2>
            <ul className="space-y-2 list-disc pl-5 text-slate-700">
              {p.references.map((reference, i) => (
                <li key={i}>{reference.url ? (
                  <a className="text-indigo-700 underline" href={reference.url} rel="noopener noreferrer" target="_blank">
                    {reference.label} <ExternalLink size={13} className="inline-block" aria-hidden="true" />
                  </a>
                ) : reference.label}{reference.note && <span> — {reference.note}</span>}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 md:p-7" aria-labelledby="pitfall-blog-heading">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={23} className="text-indigo-700" aria-hidden="true"/>
            <h2 id="pitfall-blog-heading" className="text-xl font-bold text-slate-900 mb-0">Konuyla İlgili Blog Yazıları</h2>
          </div>
          {matches.length > 0 ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {matches.map((post) => (
                <li key={post.path}>
                  <a href={post.path} className="flex h-full items-start justify-between gap-3 rounded-xl border border-indigo-100 bg-white p-4 text-indigo-800 hover:bg-indigo-100">
                    <span className="font-semibold leading-relaxed">{post.title}</span><ArrowRight size={18} className="shrink-0 mt-1" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-700">Bu başlıkla doğrudan eşleşen blog yazısı henüz bulunamadı. Yeni makaleler yayımlandıkça uygun bağlantılar otomatik eklenecektir.</p>
          )}
          <a href="/blog/" className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-800 underline">
            Tüm patoloji blog yazıları <ArrowRight size={17} aria-hidden="true" />
          </a>
        </section>

        {relatedTopics.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
            <h2 className="text-xl font-bold mb-4">Aynı Alanın Diğer Tanı Tuzakları</h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {relatedTopics.map((item) => (
                <li key={item.id}>
                  <a className="flex items-center gap-2 rounded-xl p-3 text-indigo-800 hover:bg-indigo-50" href={pitfallUrl(item.id)}>
                    <ArrowRight size={16} className="shrink-0" aria-hidden="true" />{item.titleTR}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="mt-7 flex flex-wrap justify-between gap-3">
          <a className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            href="/tani-tuzaklari/"><ArrowLeft size={18} aria-hidden="true" /> Tüm Tanı Tuzakları</a>
          <a className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800"
            href="/blog/">Blog Kütüphanesi <ArrowRight size={18} aria-hidden="true" /></a>
        </div>
        <p className="mt-7 text-sm text-slate-500">Bu içerik eğitim amaçlıdır. Tanı ve raporlama kararında güncel sınıflama ve kurum uygulamaları esas alınmalıdır.</p>
      </main>
    </PageContainer>
  );
}
