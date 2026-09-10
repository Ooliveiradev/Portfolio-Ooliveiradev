/**
 * Service Worker: Danilo Ribeiro — Portfólio Cósmico 3D
 * Cache de assets estáticos e suporte à experiência offline (PWA Tier 3 - #21).
 */

const CACHE_NAME = 'galactic-portfolio-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.svg',
  './icon-512.svg',
];

// Instalação do Service Worker e pré-cache de arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Fetch: Cache-First para estáticos, Network-First para APIs dinâmicas
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições que não sejam GET
  if (event.request.method !== 'GET') return;

  // Ignora requisições de extensões de navegador
  if (!url.protocol.startsWith('http')) return;

  // Para requisições de mídia, scripts, estilos e fontes: Cache First com fallback de rede
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2|woff|ttf|mp3|wav|ogg|json)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Atualiza em background de forma silenciosa (stale-while-revalidate)
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Para navegação HTML principal: Network First com fallback de cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request).then((res) => res || caches.match('./index.html')))
  );
});
