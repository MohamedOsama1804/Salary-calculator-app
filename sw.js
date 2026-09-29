/* Service worker for the Salary & Attendance Calculator.
   It only stores the app files (never the user's data, which lives in localStorage)
   so the calculator opens and works with no internet after the first visit.
   Change VERSION when you upload a new version of the app. */
const VERSION = 'v1.0.0';
const CACHE = 'salary-calculator-' + VERSION;
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k.indexOf('salary-calculator-') === 0 && k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Open the app: show the saved copy immediately, refresh it in the background for next time.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html', { ignoreSearch: true }).then(function (cached) {
        const network = fetch(req).then(function (res) {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', copy); }); }
          return res;
        }).catch(function () { return cached; });
        return cached || network;
      })
    );
    return;
  }

  // Other app files: saved copy first, then the network.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      });
    })
  );
});
