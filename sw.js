/* ============================================================
   DEZIL DERMO — Service Worker
   Version: 1.0.0 | Strategy: Cache First (shell) + Network First (data)
   ============================================================ */

const CACHE_NAME   = 'dezildermo-v1.0.0';
const STATIC_CACHE = 'dezildermo-static-v1.0.0';

// Ressources à mettre en cache immédiatement (App Shell)
const PRECACHE_URLS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/main.js',
  './manifest.json',
  // Polices Google (si offline, dégradation gracieuse)
];

// ── Install : mise en cache de l'App Shell ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Install error:', err))
  );
});

// ── Activate : nettoyage des anciens caches ─────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch : stratégie selon la ressource ────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les requêtes non-GET ou cross-origin (cartes, polices)
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin && !url.hostname.includes('fonts.g')) return;

  // Images : Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // CSS / JS / fonts : Cache First
  if (['style', 'script', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML (navigation) : Network First avec fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Tout le reste : Network First
  event.respondWith(networkFirst(request));
});

// ── Helpers ─────────────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return new Response('Ressource non disponible hors ligne.', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback page offline
    const offlinePage = await caches.match('./index.html');
    return offlinePage || new Response(
      '<h1>Hors ligne</h1><p>Reconnectez-vous pour accéder à Dezil Dermo.</p>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
