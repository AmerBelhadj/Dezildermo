// INK NOIR — Service Worker v1.0.0
const CACHE_VERSION = 'ink-noir-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/images/hero-bg.jpg',
  './assets/images/artist-portrait.jpg',
  './assets/images/gallery-1-mandala.jpg',
  './assets/images/gallery-2-botanical.jpg',
  './assets/images/gallery-3-geometric.jpg',
  './assets/images/gallery-4-skull.jpg',
  './assets/images/gallery-5-wave.jpg',
  './assets/images/gallery-6-mountain.jpg',
  './assets/images/gallery-7-rose.jpg',
  './assets/images/gallery-8-snake.jpg',
  './assets/images/flash-1-eclipse.jpg',
  './assets/images/flash-2-serpent.jpg',
  './assets/images/flash-3-rose.jpg',
  './assets/images/flash-4-dualite.jpg',
  './assets/images/flash-5-peaks.jpg',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap'
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install cache error:', err))
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('ink-noir-') && key !== STATIC_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les requêtes non-GET ou hors scope
  if (request.method !== 'GET') return;

  // API et ressources dynamiques → Network Only
  if (
    url.hostname === 'api.github.com' ||
    url.hostname === 'raw.githubusercontent.com' ||
    url.pathname.includes('/api/')
  ) {
    event.respondWith(fetch(request).catch(() => new Response('offline', { status: 503 })));
    return;
  }

  // Google Fonts CSS → Network First avec fallback cache
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Shell applicatif → Cache First
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          return response;
        });
      })
      .catch(() => {
        // Fallback offline : retourner index.html pour la navigation
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
