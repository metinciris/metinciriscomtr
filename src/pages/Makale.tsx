import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';

interface MakaleProps {
  onNavigate: (page: string) => void;
}

interface GithubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  html_url: string;
  created_at: string;
}

const OWNER = 'metinciris';
const REPO = 'metinciriscomtr';
const LABEL = 'Makale';
const PER_PAGE = 10;

export function Makale({ onNavigate }: MakaleProps) {
  const [issues, setIssues] = React.useState<GithubIssue[]>([]);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadIssues = React.useCallback(
    async (nextPage: number) => {
      if (isLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        const url =
          `https://api.github.com/repos/${OWNER}/${REPO}/issues` +
          `?labels=${encodeURIComponent(LABEL)}` +
          `&state=all&sort=created&direction=desc` +
          `&per_page=${PER_PAGE}&page=${nextPage}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`GitHub issues getirilemedi (HTTP ${res.status})`);
        }

        const data = (await res.json()) as GithubIssue[];

        setIssues(prev =>
          nextPage === 1 ? data : [...prev, ...data]
        );
        setPage(nextPage);

        if (data.length < PER_PAGE) {
          setHasMore(false);
        }
      } catch (e: any) {
        setError(e?.message || 'Bilinmeyen bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  React.useEffect(() => {
    loadIssues(1);
  }, [loadIssues]);

  return (
    <PageContainer>
      {/* Üst açıklama */}
      <div className="bg-gradient-to-r from-[#00A6D6] to-[#8E44AD] text-white p-8 mb-8 rounded-2xl">
        <h1 className="text-white mb-3">Günlük PubMed Makale Özetleri</h1>
        <p className="text-white/90 text-sm md:text-base">
          Dünyada ve Türkiye&apos;de önde gelen patoloji dergilerini takip ediyorum.
          İşte son çıkan makaleler.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Sadece A3’ten gelen kutular */}
      <div className="space-y-6">
        {issues.map(issue => (
          <div
            key={issue.id}
            className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-slate-100"
          >
            <div
              className="text-sm leading-relaxed overflow-x-auto"
              // Issue body = Veriler!A3 HTML
              dangerouslySetInnerHTML={{ __html: issue.body }}
            />
          </div>
        ))}
      </div>

      {/* Hiç kayıt yoksa */}
      {!isLoading && issues.length === 0 && !error && (
        <p className="text-sm text-muted-foreground mt-4">
          Henüz makale özeti alınmamış görünüyor. Sabah çalıştığında burada görünecek.
        </p>
      )}

      {/* Daha fazla butonu */}
      <div className="flex justify-center mt-8">
        {hasMore ? (
          <Button
            onClick={() => loadIssues(page + 1)}
            disabled={isLoading}
          >
            {isLoading && (
              <Loader2 size={16} className="animate-spin mr-2" />
            )}
            Daha fazla göster
          </Button>
        ) : (
          issues.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Tüm kayıtlar yüklendi.
            </p>
          )
        )}
      </div>
    </PageContainer>
  );
}
