---
name: piezas-comunes
description: Piezas reutilizables dentro de las apps de DP World Panamá, ya probadas en Facturas y Pagos a Proveedores, Control de Horas y Last Mile — tutorial de arranque por perfil con «Ver tutorial» en el menú; notificaciones por perfil con interruptores, centro de avisos y notificación del sistema (push con la app cerrada vía Supabase); burbuja de WhatsApp con soluciones rápidas según el perfil; bitácora de acciones (quién hizo qué y cuándo); estados con responsable y segregación de funciones; reclamos o solicitudes de usuarios externos; mapa por mes en verde, rojo y ámbar; adjuntos con visor dentro de la app; portal para usuarios externos (proveedores, clientes, transportistas). Usar cuando el usuario pida cualquiera de estas piezas en una app, diga «como en Proveedores / Control de Horas / Last Mile», o al crear una app nueva que tenga perfiles, aprobaciones o usuarios externos. Complementa a linea-grafica, que manda sobre el login, la cinta y el menú.
---

# Piezas comunes de las apps DP World Panamá

Cada pieza ya funciona en una app de la plataforma. Se copia de su **implementación de referencia** y se adapta a los perfiles y documentos de la app; no se reinventa. El código de referencia está en `referencia/` (sacado de Facturas y Pagos a Proveedores) y su uso completo está en los repos indicados.

| Pieza | Referencia principal | Otras |
|---|---|---|
| Tutorial de arranque por perfil | `inspeccion_contenedores-dpworld/proveedores/index.html` (`pasosTutorial`, `iniciarTutorial`) | `control_horas_Dpworld/index.html` (el original) |
| Notificaciones con interruptores | Proveedores (`NOTIF`, `notificar`, `vAvisos`) | Control de Horas (push real con Supabase: `push-marcaje`), Last Mile (`NT`, `notify`) |
| Burbuja de WhatsApp | Proveedores (`WA_TEMAS`, `waMenu`) | Last Mile (`waMenu`) |
| Bitácora de acciones | Proveedores (`bitacora`, `vBitacora`) | Last Mile (bitácora de bookings) |
| Estados con responsable | Proveedores (`calc`, `PUEDE`, `mismo`) | |
| Reclamos / solicitudes externas | Proveedores (`vReclamos`, `verReclamo`) | |
| Mapa por mes verde / rojo / ámbar | Proveedores (`vMapa`, `pintarMapa`) | |
| Adjuntos con visor | Proveedores (`api.subirArchivo`, `verArchivo`) | |
| Portal para usuarios externos | Proveedores (rol `proveedor`, `*Visibles()`) | Last Mile (cliente, transportista) |

Antes de agregarlas, pregúntale al usuario cuáles quiere en la app y para qué perfiles; no todas convienen en todas. Lo visual sigue siempre `linea-grafica` (sin íconos ni emojis; textos en Barlow Condensed en mayúsculas).

## Reglas comunes

- **En el menú lateral**, grupo **Ayuda**: «Notificaciones» (con insignia de no leídas) y «Ver tutorial». Las secciones nuevas (Bitácora, Reclamos, Mapa) son filas del menú, ocultas para los perfiles que no las usan.
- **Por perfil**: el tutorial, los avisos y los temas de WhatsApp cambian según el rol. Un usuario externo nunca ve datos de otro.
- **Todo cambio deja rastro**: quien registra, aprueba, rechaza, paga o responde queda en el historial del documento con fecha, hora y nombre (externos: «Nombre · Empresa»).
- **Prototipo y producción**: en prototipo los datos van en `localStorage` y los archivos en IndexedDB, todo detrás de un objeto `api`. Al pasar a Supabase se cambia solo `api`. Decirle al usuario con claridad qué funciona solo en el equipo (datos, avisos del sistema) hasta tener servidor.

## 1. Tutorial de arranque por perfil

- Tarjetas que **resaltan una parte real de la pantalla** (hueco con sombra y borde verde) y explican qué es. Pasos: bienvenida → menú → las secciones del perfil → notificaciones → WhatsApp → listo.
- Sale **la primera vez que cada usuario entra en el equipo** (`localStorage` `<app>_tutorial_<usuario>`), unos 700 ms después de entrar. Se repite desde el menú, «Ver tutorial».
- Cada paso: `{nav:'vista', sel:'selector' | () => elemento, t:'Título', d:'Texto'}`. `nav` cambia de vista antes de resaltar. Sin `sel` la tarjeta va al centro.
- Botones Saltar / Anterior / Siguiente / Terminar; teclado: Escape, flechas. Al terminar vuelve a la vista donde estaba.
- Lo alto (listas) se muestra **desde su inicio** y la tarjeta nunca sale de la pantalla (eso falló con listas largas: está resuelto en la referencia).
- Texto de cada paso: qué es y para qué sirve en ese perfil, en una o dos frases.
- Prueba obligatoria: recorrer el tutorial de **cada perfil** y comprobar que cada paso (salvo bienvenida y listo) tiene su parte resaltada, que no se repite al volver a entrar y que «Ver tutorial» lo abre.

## 2. Notificaciones por perfil

- **Catálogo** `[clave, título, descripción, perfiles]`. Cada perfil ve solo sus avisos. Todos encendidos por defecto; se guardan solo los apagados (`usuario.notif = {clave:false}`). Control de Horas suma avisos **obligatorios** por perfil (interruptor fijo): usarlo cuando el uso correcto de la app depende de ese aviso.
- **Pantalla Notificaciones**: interruptores (`.sw` con `role="switch"`, «Encender todos · Apagar todos»), estado de **este equipo** (activar, probar, desactivar; pasos de iPhone: instalar desde Safari con iOS 16.4+; aviso si están bloqueadas) y **centro de avisos** recibidos con «Marcar todas como leídas».
- `notificar(evento, título, texto, ref, {users | provId})`: decide destinatarios por perfil, nunca a quien hizo la acción, respeta interruptores, guarda en el centro y muestra la notificación del sistema si el usuario la activó en el equipo. `ref = {act, id}` abre el documento al tocar el aviso (en la app o desde el sistema).
- **Resumen diario** al entrar (vencidos, por vencer), una vez al día por usuario.
- **Service worker**: agregar `referencia/sw-avisos.js` (eventos `push` y `notificationclick`; abre `?abrir=act:id` si la app estaba cerrada).
- **Con la app cerrada** solo llegan con servidor: Supabase con tabla de suscripciones push por usuario y una Edge Function con web-push y claves VAPID (modelo: `push-marcaje` de Control de Horas, con «Probar con la app cerrada»). Sin servidor, el aviso del sistema aparece en el equipo donde ocurre la acción: decírselo al usuario.

## 3. Burbuja de WhatsApp

- Botón verde flotante abajo a la derecha (marcado en `referencia/burbuja-whatsapp.html`; el símbolo de WhatsApp es la única excepción a «sin íconos», como en Last Mile). `z-index` por encima de los modales y `padding-bottom` en vistas y modales para que no tape botones.
- Menú «Soluciones rápidas» con **temas por perfil**: `[título, contacto, mensaje]`. El mensaje empieza con «Hola, soy Nombre (de Empresa / Perfil) desde la app …» y, si hay un documento abierto, `{fac}` agrega sus datos (número, monto, vencimiento).
- **Contactos** por área (Cuentas por pagar, Compras, Aprobación, Tesorería, Soporte, o los que tenga la app) en Configuración: número con código de país (8 dígitos de Panamá se completan con 507) o enlace de grupo. Sin número: «Sin número configurado».
- Celular: `whatsapp://send?phone=…&text=…`. Computadora: botones «App de escritorio» y «WhatsApp Web» con la nota del código QR.

## 4. Bitácora de acciones

- Cada documento lleva `log: [{t:'AAAA-MM-DD HH:MM', u:'Nombre', a:'Acción'}]`. Las acciones sin documento (usuarios, parámetros, contactos) van a una tabla `bitacora`.
- Vista **Bitácora** (solo perfiles internos): todo junto, de lo más reciente a lo más antiguo; filtros por texto, tipo, usuario y fechas; la fila abre su documento; exporta CSV e imprime; 100 filas y «Mostrar más».
- Las acciones encadenadas también se anotan en el documento relacionado (por ejemplo, el pago queda en el historial de cada factura).
- No se edita ni se borra desde la app. En Supabase: tabla sin UPDATE ni DELETE para nadie.

## 5. Estados con responsable

- Separar **estados que alguien cambia** (registrado, validado, aprobado, rechazado) de **estados que el sistema calcula** (pagado, pago parcial, en solicitud, vencido) a partir de otros registros. Lo calculado nunca se marca a mano.
- Cada cambio tiene un perfil responsable (`PUEDE.registrar()`, `PUEDE.aprobar()`…) y **segregación de funciones**: nadie aprueba lo que registró (`mismo(x)` deja el botón deshabilitado con su explicación).
- Rechazar o anular pide **motivo** obligatorio, que queda en el historial.
- Controles antes de avanzar: lista de revisión, archivo obligatorio, datos completos. Un cambio sensible (cuenta bancaria) devuelve el registro a aprobación.
- Documentar en la app y al usuario, en una tabla, quién mueve cada estado y cómo.

## 6. Reclamos o solicitudes de usuarios externos

- El externo abre un reclamo sobre un documento (en Proveedores: factura vencida; tipos «Solicitud de información» y «Solicitud de programación de pago»). Uno abierto por documento.
- Hilo de mensajes (externo a la izquierda, DP World a la derecha), respuesta con dato opcional (fecha programada). Estados: Por responder → Respondido → Cerrado; si el externo vuelve a escribir, vuelve a Por responder.
- Insignia en el menú: internos ven los por responder; externos, los respondidos. Avisos a ambos lados y registro en la bitácora y en el documento.

## 7. Mapa por mes (verde, rojo, ámbar)

- Filas: entidades (proveedores, clientes…). Columnas: meses (6 o 12, más el siguiente). Base elegible (mes de vencimiento o de emisión).
- Celda: monto y conteo («2 pagadas · 1 vencida»). **Verde**: todo cumplido. **Rojo**: algo vencido. **Ámbar**: pendiente en plazo. Vacía: «—». Tocarla abre los documentos de esa celda.
- Fila de totales por mes sin ceros; leyenda arriba; primera columna fija; en el celular abre en los meses recientes. Un externo solo ve su fila.

## 8. Adjuntos

- Prototipo: IndexedDB (`api.subirArchivo / leerArchivo / borrarArchivo`); Supabase: Storage. PDF, JPG o PNG hasta 10 MB; cada adjunto con nombre, tamaño, quién y cuándo, y su clase (por ejemplo «Factura fiscal», «Correo de aprobación»).
- **Ver dentro de la app** (iframe para PDF, imagen) con «Descargar»: nunca `window.open`, que el iPhone y la app instalada bloquean.

## 9. Portal para usuarios externos

- Rol externo vinculado a su entidad (`usuario.provId`). Funciones `facturasVisibles()`, `pagosVisibles()`… filtran todo lo que ve; menú propio («Mis facturas», «Mis pagos»); se ocultan columnas que solo le sirven a DP World.
- Resumen propio con lo que le importa y el proceso explicado en pasos. El administrador crea sus usuarios en Configuración.
- En producción el filtro va también en el servidor (políticas RLS de Supabase por entidad), no solo en la pantalla.

## Verificación

Playwright en 1440×900 y 390×844, en claro y oscuro, sin errores de consola. Además de lo de `linea-grafica`: recorrer el tutorial de cada perfil; prender y apagar interruptores; generar cada aviso con un perfil y verlo llegar al otro; abrir la burbuja con y sin documento abierto y con números configurados; comprobar que cada acción aparece en la bitácora con su usuario; abrir celdas verde, roja y ámbar del mapa; entrar como externo y confirmar que no ve datos de otros.
