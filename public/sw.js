// Web Push and Asset Caching Service Worker for Metin Ciris App

const CACHE_NAME = 'metinciris-shell-v1';
const ASSETS_CACHE = 'metinciris-assets-static';

// Assets that should be cached on install (optional, but good for critical paths)
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Fetch event handler with caching strategies
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Cache First for Vite hashed assets (immutable)
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                if (response) return response;
                return fetch(event.request).then((networkResponse) => {
                    const cacheCopy = networkResponse.clone();
                    caches.open(ASSETS_CACHE).then((cache) => {
                        cache.put(event.request, cacheCopy);
                    });
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 2. Stale-While-Revalidate for images and data
    if (url.pathname.includes('/img/') || url.pathname.includes('/data/') || url.pathname.endsWith('.avif') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    const cacheCopy = networkResponse.clone();
                    caches.open(ASSETS_CACHE).then((cache) => {
                        cache.put(event.request, cacheCopy);
                    });
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }
});

// Push notification logic
self.addEventListener('push', (event) => {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body || 'Yeni bir toplantı duyurusu var.',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                data: {
                    url: data.url || '/#konsensus'
                },
                actions: [
                    {
                        action: 'open',
                        title: 'Görüntüle'
                    }
                ]
            };

            event.waitUntil(
                self.registration.showNotification(data.title || 'Konsensus Toplantısı', options)
            );
        } catch (e) {
            const text = event.data.text();
            event.waitUntil(
                self.registration.showNotification('Konsensus', {
                    body: text,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico'
                })
            );
        }
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        const urlToOpen = event.notification.data?.url || '/#konsensus';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});

