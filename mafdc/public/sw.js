// Simple service worker for PWA functionality
const CACHE_NAME = 'ma-florencio-dental-v2';
const urlsToCache = [
  '/',
  '/onlineappointment',
  '/services',
  '/contact',
  '/Mafdc.jpg'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  try {
    const request = event.request;
    const url = new URL(request.url);

    // Do not interfere during local development
    const isDevHost = ['localhost', '127.0.0.1'].includes(self.location.hostname);
    if (isDevHost) {
      return; // let the network handle it
    }

    // Skip Next.js internals and asset chunks
    if (url.pathname.startsWith('/_next/') || url.pathname.includes('/__nextjs')) {
      return; // don't handle these with the SW
    }

    // Only cache GET requests
    if (request.method !== 'GET') {
      return;
    }

    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            // Optionally cache successful basic responses
            const shouldCache = response && response.status === 200 && response.type === 'basic';
            if (shouldCache) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone)).catch(() => {});
            }
            return response;
          })
          .catch(() => cached || Promise.reject('Network error'));
      })
    );
  } catch (_) {
    // If anything goes wrong, do not block the request
  }
});
