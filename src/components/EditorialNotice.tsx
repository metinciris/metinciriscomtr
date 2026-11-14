import React from 'react';

interface EditorialNoticeProps {
  lastUpdated?: string;
  className?: string;
}

/** Tek tip editoryal künye; gercekten onaylanmamis sayfa tarihi uydurulmaz. */
export function EditorialNotice({ lastUpdated, className = '' }: EditorialNoticeProps) {
  return (
    <aside className={'rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 ' + className}
      aria-label="Editoryal bilgi">
      <p className="m-0"><strong>Bilimsel içerik sorumlusu:</strong> Prof. Dr. İbrahim Metin Çiriş
        {' · '}<a href="/iletisim/" className="underline text-blue-700">Editöre ulaşın</a>
      </p>
      {lastUpdated && <p className="m-0">Son gözden geçirme: <time dateTime={lastUpdated}>
        {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(lastUpdated + 'T12:00:00Z'))}
      </time></p>}
      <p className="m-0 text-xs text-slate-600">İçerikler genel bilgilendirme ve eğitim amaçlıdır; hekim değerlendirmesinin yerine geçmez.</p>
    </aside>
  );
}
