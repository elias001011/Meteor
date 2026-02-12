const CACHE_NAME = 'meteor-cache-v3';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
];

// Instalação: cacheia o app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.error('[Meteor SW] Erro ao cachear:', err))
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Meteor SW] Removendo cache antigo:', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim())
  );
});

// Fetch: estratégia network-first com fallback para cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Nunca cacheia requisições de funções Netlify
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Para API externas, sempre vai na rede
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Só cacheia respostas válidas do mesmo origin
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        }).catch(() => {});
        return response;
      })
      .catch(() => {
        // Fallback para cache em caso de offline
        return caches.match(event.request).then(cached => {
          if (cached) {
            return cached;
          }
          // Se não tem no cache e é navegação, retorna index.html (SPA)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw new Error('Recurso não disponível offline');
        });
      })
  );
});

// Notificações Push
self.addEventListener('push', event => {
  let data = {
    title: 'Meteor - Alerta',
    body: 'Você tem uma nova notificação',
    icon: '/favicon.svg',
    url: '/'
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.warn('[Meteor SW] Erro ao parsear dados do push:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: '/favicon.svg',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .catch(err => console.error('[Meteor SW] Erro ao mostrar notificação:', err))
  );
});

// Clique na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Tenta focar uma janela existente
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não achou, abre nova janela
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch(err => console.error('[Meteor SW] Erro ao manipular clique:', err))
  );
});

// Erros no Service Worker
self.addEventListener('error', event => {
  console.error('[Meteor SW] Erro:', event.message);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[Meteor SW] Promise rejeitada:', event.reason);
});
