// Web Push Service Worker for Konsensus App

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
            // If not JSON, use as plain text
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
                // Check if there is already a window open with this URL
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If no window, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
