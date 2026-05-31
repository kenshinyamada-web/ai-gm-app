const CACHE_NAME = 'trpg-emokroa-v21';
const CACHE_URLS = [
  './ai_trpg_gm.html',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // 同一オリジンのみ扱う
  if (!req.url.startsWith(self.location.origin)) return;
  // API リクエストはキャッシュしない
  if (req.url.includes('googleapis.com')) return;

  // HTML（ページ遷移）はネットワーク優先：オンラインなら常に最新を取得し、
  // 取得できたらキャッシュも更新。オフライン時のみキャッシュにフォールバック。
  const isHTML = req.mode === 'navigate' || req.destination === 'document' || req.url.endsWith('.html');
  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./ai_trpg_gm.html')))
    );
    return;
  }

  // その他のアセットはキャッシュ優先
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
