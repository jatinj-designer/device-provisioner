/* Device Provisioner — service worker for offline use */
const CACHE = 'device-provisioner-v2';

// Derive the base path from the SW scope so this file works at any sub-path
// (root in dev, /device-provisioner/ on GitHub Pages, etc.)
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '');

const PRECACHE = [
  BASE + '/',
  BASE + '/manifest.webmanifest',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
  BASE + '/icons/icon-maskable-512.png',
  BASE + '/icons/apple-touch-icon.png',
  BASE + '/icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (Google API) pass through

  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => caches.match(BASE + '/'))
    )
  );
});
