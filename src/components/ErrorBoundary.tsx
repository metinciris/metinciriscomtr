import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);

        // Chunk load / dynamic import hatası tespiti
        const isChunkError =
            error.message?.includes('Failed to fetch dynamically imported module') ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('Loading CSS chunk') ||
            error.name === 'ChunkLoadError';

        if (isChunkError) {
            const lastReload = sessionStorage.getItem('chunk-error-reload');
            const now = Date.now();
            // Son 10 saniye içinde yenileme yapılmadıysa otomatik kurtar
            if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
                sessionStorage.setItem('chunk-error-reload', String(now));
                // Service Worker'ları temizle
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                        registrations.forEach(reg => reg.unregister());
                    });
                }
                // Cache'leri temizle
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => caches.delete(name));
                    });
                }
                // Sayfayı yenile
                window.location.reload();
                return;
            }
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                    padding: '2rem',
                    textAlign: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #fee2e2, #fef3c7)',
                        borderRadius: '1rem',
                        padding: '2.5rem',
                        maxWidth: '480px',
                        width: '100%',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        border: '1px solid #fecaca',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: '#991b1b',
                            marginBottom: '0.75rem',
                        }}>
                            Bir hata oluştu
                        </h2>
                        <p style={{
                            fontSize: '0.95rem',
                            color: '#78350f',
                            marginBottom: '1.5rem',
                            lineHeight: 1.6,
                        }}>
                            Sayfa yüklenirken beklenmeyen bir sorunla karşılaşıldı.
                            Sayfayı yenileyerek tekrar deneyebilirsiniz.
                        </p>

                        <button
                            onClick={this.handleReload}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.75rem',
                                background: 'linear-gradient(135deg, #dc2626, #ea580c)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '0.75rem',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
                            }}
                        >
                            🔄 Sayfayı Yenile
                        </button>

                        {this.state.error && (
                            <details style={{
                                marginTop: '1.5rem',
                                textAlign: 'left',
                                background: '#fff',
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1rem',
                                border: '1px solid #e5e7eb',
                            }}>
                                <summary style={{
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    color: '#6b7280',
                                    fontWeight: 500,
                                }}>
                                    Hata Detayı
                                </summary>
                                <pre style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: '#991b1b',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    maxHeight: '120px',
                                    overflow: 'auto',
                                }}>
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
