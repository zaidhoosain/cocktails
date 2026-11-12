/* cocktails — offline cache. The build stamps a new version into this file whenever the book changes,
   so the phone notices, downloads the new edition in the background and offers it on the next open. */
const VERSION = '3b6c96987994';
const CACHE = 'cocktails-' + VERSION;
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith('cocktails-') && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'update') self.skipWaiting();
});

// cache first: the whole book lives in index.html, so the app opens instantly and works with no network
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(key, { ignoreSearch: true }).then(
        (hit) =>
          hit ||
          fetch(req)
            .then((res) => {
              if (res.ok && req.mode !== 'navigate') c.put(req, res.clone());
              return res;
            })
            .catch(() => c.match('./index.html')),
      ),
    ),
  );
});
