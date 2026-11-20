// Agregar al final del sw.js de la app (kit/pwa/sw.js): muestra los avisos push y, al tocarlos, abre lo que avisan.
// Notificaciones: en el prototipo las muestra la app con showNotification; en producción llegan del servidor
// (Supabase Edge Function con web-push) por el evento 'push', aunque la app esté cerrada.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { texto: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Facturas y Pagos a Proveedores', {
    body: d.texto || '', icon: 'dpw/pwa/icon-192.png', badge: 'dpw/pwa/icon-192.png', tag: d.tag, data: { ref: d.ref || null }
  }));
});
// Al tocar el aviso se abre lo que avisa (factura, pago, reclamo o proveedor)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const ref = (e.notification.data || {}).ref;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => new URL(c.url).pathname.startsWith(new URL(self.registration.scope).pathname));
    if (w) { if (ref) w.postMessage({ abrir: ref }); return w.focus(); }
    return self.clients.openWindow('./index.html' + (ref ? '?abrir=' + encodeURIComponent(ref.act + ':' + ref.id) : ''));
  }));
});
