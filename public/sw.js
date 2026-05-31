/* Unlimited Games — service worker.
 *
 * Strategy:
 *  - On install, precache the small "app shell" + every game HTML file
 *    so the site works offline once visited.
 *  - On fetch, network-first for navigation requests (so updates roll
 *    out immediately when you ARE online), with a cache fallback when
 *    offline.
 *  - Cache static assets (icons, sprites, manifest) opportunistically.
 *  - Skip Firebase + cross-origin requests entirely; they need a live
 *    network round trip.
 */

const VERSION = 'ug-v3';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
];
const GAMES = [
  '/games/snake.html',
  '/games/2048.html',
  '/games/tetris.html',
  '/games/flappy.html',
  '/games/breakout.html',
  '/games/memory.html',
  '/games/snake-battle.html',
  '/games/arcade-brawl.html',
  '/games/doorman.html',
  '/games/door-escape.html',
  '/games/downhill-brawl.html',
  '/games/chess.html',
  '/games/squish.html',
  '/games/liars-tavern.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache =>
      // Use addAll for required, but fall back to individual fetches so a
      // single 404 doesn't break the whole install.
      Promise.all([...APP_SHELL, ...GAMES].map(url =>
        cache.add(url).catch(err => console.warn('SW precache miss', url, err))
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  // Drop any caches that don't match the current VERSION so stale
  // builds get cleaned up.
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Don't touch anything cross-origin (Firebase, CDNs, fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // Don't try to cache Next.js internals — they have hashed names per build
  if (url.pathname.startsWith('/_next/')) return;

  // For HTML pages: network-first so a deploy is picked up immediately.
  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    event.respondWith(
      fetch(req).then(resp => {
        // Mirror the fresh page into cache for offline fallback
        const copy = resp.clone();
        caches.open(VERSION).then(c => c.put(req, copy)).catch(()=>{});
        return resp;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('/')))
    );
    return;
  }

  // For other same-origin GETs: cache-first, then network.
  event.respondWith(
    caches.match(req).then(hit => hit ||
      fetch(req).then(resp => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(()=>{});
        }
        return resp;
      })
    )
  );
});
