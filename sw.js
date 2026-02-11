const CACHE_NAME = 'meteor-cache-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching App Shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to pre-cache App Shell:', error);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(event.request)
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(
          response => {
            if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// ==========================================
// NOTIFICAÇÕES PUSH - FUNCIONAMENTO OFFLINE
// ==========================================

// Evento push - recebe mensagem do servidor mesmo com app fechado
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push recebido:', event);

  let data = {
    title: 'Meteor - Alerta',
    body: 'Você tem uma nova notificação',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: '/',
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Ignorar' }
    ]
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('[Service Worker] Erro ao parsear push:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: {
      url: data.url || '/'
    }
  };

  // ESSENCIAL: event.waitUntil mantém o Service Worker ativo
  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('[Service Worker] Notificação exibida com sucesso');
      })
      .catch(err => {
        console.error('[Service Worker] Erro ao exibir notificação:', err);
      })
  );
});

// Evento de clique na notificação
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Clique na notificação:', event);

  event.notification.close();

  const url = event.notification.data?.url || '/';

  // Ação de abrir
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Procura uma janela/janela já aberta
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // Se não encontrar, abre nova janela
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }

  // Ação de dispensar - apenas fecha
  if (event.action === 'dismiss') {
    // Já foi fechado no início
    console.log('[Service Worker] Notificação dispensada');
  }
});

// Evento para fechar notificação
self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notificação fechada:', event);
});

// ==========================================
// SINCRONIZAÇÃO EM BACKGROUND
// ==========================================

self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-alerts') {
    event.waitUntil(
      // Aqui poderia verificar alertas pendentes
      console.log('[Service Worker] Sincronização em background')
    );
  }
});
