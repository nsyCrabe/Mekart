/* ===== Mes cartes — service worker v3 =====
   Change VERSION à chaque publication pour forcer la mise à jour du cache. */
const VERSION = 'v8';
const CACHE = `mes-cartes-${VERSION}`;

const CORE = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
const CDN = [
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Un fichier manquant ne doit pas bloquer l'installation
    await Promise.all([...CORE, ...CDN].map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCdn = CDN.includes(req.url);
  if (!sameOrigin && !isCdn) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });

    // Librairies externes : cache d'abord (elles ne changent jamais, version fixée)
    if (isCdn && cached) return cached;

    // Fichiers de l'app : on sert le cache tout de suite, et on met à jour en arrière-plan
    const network = fetch(req, sameOrigin ? { cache: 'no-cache' } : undefined).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    if (cached) { event.waitUntil(network); return cached; }
    const res = await network;
    if (res) return res;
    // Hors ligne et rien en cache : on retombe sur la page d'accueil
    if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  })());
});
