const CACHE_NAME = 'meteor-cache-v3';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
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

  // Deixa CDNs e outras origens seguirem o fluxo normal do navegador.
  // Isso evita o Service Worker quebrar scripts e estilos externos.
  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(
        JSON.stringify({ message: 'Serviço temporariamente indisponível.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response && response.ok) {
          const responseToCache = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, responseToCache);
        }
        return response;
      } catch (error) {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        if (event.request.mode === 'navigate') {
          const shell = await caches.match('/index.html') || await caches.match('/');
          if (shell) {
            return shell;
          }
        }

        return new Response('', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});
