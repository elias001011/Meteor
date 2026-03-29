const CACHE_NAME = 'meteor-cache-v4';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
];

const urlBase64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
};

self.addEventListener('install', event => {
  console.log('[SW] Instalando v6.1...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_URLS))
      .then(() => {
        console.log('[SW] Instalado, skipWaiting...');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// ============================================
// NOTIFICAÇÕES PUSH - Meteor v6.1
// ============================================

console.log('[SW] Service Worker v6.1 ativo');

self.addEventListener('push', event => {
  console.log('[SW] Push recebido:', event.data ? event.data.text() : 'sem dados');

  let data = {
    title: 'Meteor',
    body: 'Nova notificação',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'default',
    requireInteraction: false,
    data: { url: '/' }
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('[SW] Erro ao parsear push:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    data: data.data,
    // Android-specific
    actions: data.data?.type === 'weather-alert' ? [
      { action: 'open', title: 'Ver alerta' },
      { action: 'dismiss', title: 'Ignorar' }
    ] : undefined
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[SW] Clique na notificação:', event.action || 'default');

  const url = event.notification.data?.url || '/';
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        if (event.action === 'open' || event.action === 'default') {
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('pushsubscriptionchange', event => {
  console.log('[SW] pushsubscriptionchange disparado');
  event.waitUntil((async () => {
    try {
      const configResponse = await fetch('/.netlify/functions/getConfig');
      const config = await configResponse.json();
      const vapidPublicKey = config?.VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) return;

      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      await fetch('/.netlify/functions/saveSubscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          city: 'Porto Alegre',
          enabled: true
        })
      });
    } catch (error) {
      console.error('[SW] Falha ao renovar subscription:', error);
    }
  })());
});
