import React from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  Calendar,
  ExternalLink,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';

interface MakaleProps {
  onNavigate: (page: string) => void; // App ile uyum için; burada kullanmıyoruz
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

        const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues` +
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  return (
    <PageContainer>
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#00A6D6] to-[#8E44AD] text-white p-8 mb-8">
        <h1 className="text-white mb-3">Günlük PubMed Makale Özetleri</h1>
        <p className="text-white/90">
          Google Sheets → GitHub Issues üzerinden otomatik gelen patoloji
          makale özetleri. Son 10 gün varsayılan, istersen daha fazlasını
          yükleyebilirsin.
        </p>
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Issue listesi */}
      <div className="space-y-6">
        {issues.map(issue => (
          <Card key={issue.id} className="bg-white">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle className="text-base md:text-lg font-semibold">
                  {issue.title}
                </CardTitle>
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#00A6D6] text-sm hover:underline"
                >
                  GitHub’da aç <ExternalLink size={16} />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(issue.created_at)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eef7ff] text-[#0b3a5e]">
                  <BookOpen size={14} />
                  Makale özeti
                </span>
              </div>
            </CardHeader>

            <CardContent>
              {/* A3’ten gelen HTML kartı burada direkt render ediyoruz */}
              <div
                className="text-sm leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: issue.body }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hiç kayıt yoksa */}
      {!isLoading && issues.length === 0 && !error && (
        <p className="text-sm text-muted-foreground mt-4">
          Henüz makale issues’u oluşturulmamış görünüyor. Google Sheets
          tetiklendiğinde burada görünecek.
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
