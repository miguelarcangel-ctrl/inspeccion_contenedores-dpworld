// DP World Panamá · service worker común de las apps (skill linea-grafica, kit/pwa).
// Permite instalar la app y abrirla sin conexión. La app se pide primero a la red (siempre la versión publicada);
// la copia guardada solo se usa sin conexión. Supabase nunca se guarda: los datos van siempre al servidor.
// Al publicar un cambio grande, sube la versión de CACHE.
const CACHE = 'dpw-app-v1';
const BASE = ['./', './index.html', './manifest.webmanifest', './dpw/dpw-shell.css', './dpw/dpw-shell.js', './dpw/dpw-escenas.js',
  './dpw/assets/dpworld-logo-fondo-claro.png', './dpw/pwa/icon-192.png', './dpw/pwa/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || /supabase\.co$/.test(url.hostname)) return;
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(r => r || caches.match('./index.html'))));
  } else if (/cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|cdn\.sheetjs\.com|unpkg\.com|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(k => k.match(req).then(hit => {
      const red = fetch(req).then(r => { if (r.ok || r.type === 'opaque') k.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || red;
    })));
  }
});
