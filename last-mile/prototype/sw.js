/* Last Mile · service worker
   Muestra los avisos push aunque la app esté cerrada y, al tocarlos, abre el booking.
   En el prototipo los avisos los genera la misma app; en producción llegan del
   servidor (Supabase Edge Function con web-push) por el evento 'push'. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { texto: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Last Mile · DP World', {
    body: d.texto || '', icon: 'icon-192.png', badge: 'badge-96.png',
    tag: d.tag, data: { bk: d.bk || null }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const bk = (e.notification.data || {}).bk;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => new URL(c.url).pathname.startsWith(new URL(self.registration.scope).pathname));
    if (w) { w.postMessage({ abrir: bk }); return w.focus(); }
    return self.clients.openWindow('./' + (bk ? '#bk=' + bk : ''));
  }));
});
