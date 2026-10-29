/* Mekart — cache PWA versionné. Aucune donnée utilisateur n'est effacée ici. */
const VERSION = 'v38';
const CACHE = `mes-cartes-${VERSION}`;
const CORE = ['./', 'index.html', 'style.css', 'app.js', 'storage-backup.js', 'crypto-vault.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const CDN = [
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Ne jamais activer une nouvelle version si les fichiers essentiels manquent.
    await cache.addAll(CORE.map(url => new Request(url, { cache: 'reload' })));
    // Les bibliothèques externes peuvent être indisponibles temporairement.
    await Promise.all(CDN.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Ne toucher qu'aux caches de cette application, jamais au stockage des cartes.
    await Promise.all(keys.filter(k => k.startsWith('mes-cartes-') && k !== CACHE).map(k => caches.delete(k)));
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
    const cached = await cache.match(req, { ignoreSearch: false });
    // Ressources versionnées : le cache garantit une version cohérente hors ligne.
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response.ok) await cache.put(req, response.clone());
      return response;
    } catch {
      if (req.mode === 'navigate') return (await cache.match('./')) || (await cache.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
