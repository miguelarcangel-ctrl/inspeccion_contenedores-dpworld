---
name: linea-grafica
description: Línea gráfica común de todas las apps de DP World Panamá, con Last Mile como molde. Login con frase grande, escena animada propia de la app y tarjeta blanca; cinta superior blanca; menú desplegable lateral con las secciones; tema claro y oscuro; botón Instalar (PWA); sin íconos ni emojis. Usar SIEMPRE al crear una app nueva, al tocar el login, el encabezado o la navegación de cualquier app (Control de Horas, Inspección de Contenedores, Cotizador 3PL, Alertas de Calidad, Hub, Last Mile), o cuando pidan que una app "se vea igual que las demás".
---

# Línea gráfica de las apps DP World Panamá

Todas las apps comparten el mismo cascarón, copiado de **Last Mile** (`inspeccion_contenedores-dpworld/last-mile/prototype`). El contenido de cada app conserva su propio estilo, pero lo que el usuario ve al entrar y al moverse es igual en todas: login, cinta superior, menú desplegable, tema claro/oscuro y botón Instalar.

El kit está en `kit/` junto a este archivo:

| Archivo | Qué trae |
|---|---|
| `dpw-shell.css` | Cinta superior, menú desplegable, login y tokens de tema. Todo con prefijo `dpw-`. |
| `dpw-shell.js` | Menú (`DPW.menu()`, `DPW.activo()`, `DPW.quien()`, `DPW.abrirMenu()/cerrarMenu()`), tema (`[data-dpw="tema"]`, `DPW.ponerTema()`, `DPW.alternarTema()`, evento `dpw:tema`), Instalar (`[data-dpw="instalar"]`, `DPW.pwa()`, `DPW.aviso`) y `DPW.escena()`. |
| `dpw-escenas.js` | Escenas del login: `bodega`, `patio`, `flujo`, `radar` y la franja `terminal`. |
| `dpw-mapa.js` | Escena `mapa` (Panamá y rutas a 14 puertos). Solo la cargan las apps que la usan (35 KB). |
| `plantilla.html` | Ejemplo completo y vista previa: `plantilla.html?escena=patio`, `&login=0`, `&tema=light`. |
| `assets/` | Logos para fondo claro y oscuro. |
| `pwa/` | `sw.js` y `manifest.webmanifest` de partida y `generar_iconos.py`, que crea los íconos de la app instalada (512, 192, Apple y favicon). |

En cada app, el kit se copia a una carpeta `dpw/` servida junto al `index.html` (en Next.js: `public/dpw/` para los scripts y logos, y `src/app/dpw-shell.css` importado en `layout.tsx`; la cinta y el menú van como componentes React con las mismas clases, ver `alertas-calidad-app/src/components/AppHeader.tsx` y `Portada.tsx`). Si se cambia el kit, se cambia aquí en HubApp y se vuelve a copiar a cada repo; no se edita la copia de una sola app.

## Reglas

1. **Sin íconos ni emojis.** Ni en botones, ni en el menú, ni en títulos, toasts o avisos. Solo texto en Barlow Condensed en mayúsculas. Se permiten los signos tipográficos `·`, `→ ←`, `×` (cerrar), `‹ ›`, `▼` para abrir y cerrar secciones desplegables, y los números. Los íconos SVG decorativos también quedan fuera; las escenas del login no son íconos, son ilustración.
2. **El login es igual en todas** (ver abajo). Lo único que cambia es la frase, la línea de apoyo y la escena animada.
3. **La escena animada la elige el usuario.** Antes de crear o cambiar el login de una app, pregúntale qué animación quiere y ofrécele dos o tres ideas relacionadas con lo que hace la app. No elijas tú.
4. **Navegación en el menú desplegable.** Toda sección de la app va como fila del menú lateral (botón de tres rayas a la izquierda de la cinta). Las vistas especiales (Insights, Vista TV, Reportes, Configuración) también. La cinta solo lleva Instalar, Claro/Oscuro, el rol y Salir.
5. **Tema claro y oscuro en todas**, con el botón de texto de la cinta (`Claro` / `Oscuro`, muestra a cuál cambia). Se guarda en `localStorage` con la clave común `dpw_tema` y vive en `<html data-theme="light|dark">`. Cada app elige su tema por defecto (Cotizador, Alertas y Control de Horas: claro; Inspección y Hub: oscuro). Las vistas de TV o piso de operación pueden quedarse oscuras, y la vista previa de documentos sigue siendo papel blanco.
6. **Botón Instalar en todas**: en la cinta y como píldora en el login. Aparece solo cuando el navegador permite instalar; en iPhone explica el paso manual. Cada app lleva `manifest.webmanifest`, `sw.js` y los íconos de `kit/pwa/`.
   **Ícono de la app instalada igual en todas**: fondo índigo `#1A1060`, logo DP World en blanco, línea verde `#00C389` y el nombre corto de la app en Barlow Condensed 800 (HORAS, RAMPAS, COTIZADOR, ALERTAS, PORTAL, LAST MILE). Se genera con `python3 kit/pwa/generar_iconos.py "NOMBRE" carpeta`; no se dibujan íconos a mano.
7. **Tipografía y color**: Barlow (cuerpo) y Barlow Condensed 700–800 en mayúsculas (títulos, etiquetas, botones). Índigo `#1A1060` (hover `#2A1F8F`), verde `#00C389` para acentos, ámbar `#f5a20b` advertencia, rojo `#E8003D` error. Fondo oscuro `#0d0b28`, superficies `#16143d` / `#1e1c50`; en claro, fondo `#F2F3F8` y tarjetas blancas.

## Escenas por app

| App | Escena | Frase del login |
|---|---|---|
| Last Mile | `mapa` + franja `terminal` | Conectamos cada entrega contigo. |
| Hub (portal) | `mapa` + franja `terminal` | Todas tus apps en un solo lugar. |
| Control de Horas | `bodega`: racks, montacargas que sube y baja pallets, línea de producción, barra del turno | Cada hora de la bodega cuenta. |
| Inspección de Contenedores (Control de Rampas) | `patio`: pilas de contenedores, grúa de patio que mueve uno, camión que entra | Cada contenedor, a tiempo. |
| Cotizador 3PL | `flujo`: Contenedor → Descargue → Almacén → Despacho con la unidad de cobro de cada uno | Cotiza cada servicio en minutos. |
| Alertas de Calidad | `radar`: plano de la bodega con pulsos; un punto pasa a ámbar | Detectamos a tiempo cada desvío. |

Para una app nueva: pregunta la animación (regla 3), dibújala como función nueva en `dpw-escenas.js` (viewBox 1000×380 para la escena, 1400×150 para la franja; la parte importante entre x≈300 y x≈760, que es lo que queda entre la frase y la tarjeta) y agrega su fila a esta tabla.

## Marcado

Copiar de `kit/plantilla.html`. Lo esencial:

```html
<!-- <head>: tema antes de pintar (cambia 'dark' por el tema por defecto de la app), manifiesto e íconos -->
<script>(function(){var t;try{t=localStorage.getItem('dpw_tema')}catch(e){}document.documentElement.setAttribute('data-theme',t==='light'||t==='dark'?t:'dark');})();</script>
<meta name="theme-color" content="#1A1060">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="dpw/pwa/favicon-32.png">
<link rel="apple-touch-icon" href="dpw/pwa/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="stylesheet" href="dpw/dpw-shell.css">

<!-- Login -->
<div class="dpw-login" id="dpwLogin">
  <button type="button" class="dpw-lg-install" data-dpw="instalar" hidden>Instalar app</button>
  <div class="dpw-lg-art" aria-hidden="true"><svg data-dpw-art></svg></div>
  <div class="dpw-lg-hero">
    <div class="dpw-lg-kick">DP World · Control de Horas</div>
    <h1 class="dpw-lg-h1"><span>Cada hora</span> <span>de la bodega</span> <em>cuenta.</em></h1>
    <p class="dpw-lg-lead">Turnos, tareas y productividad de la cuadrilla, en vivo.</p>
  </div>
  <svg class="dpw-lg-ground" data-dpw-ground aria-hidden="true"></svg>
  <div class="dpw-lg-card">
    <div class="dpw-lg-logo"><img src="dpw/assets/dpworld-logo-fondo-claro.png" alt="DP World">
      <div class="dpw-lg-app">Control de Horas</div><div class="dpw-lg-ref">DAL · Colón Logistics Park · Panamá</div></div>
    <div class="dpw-lg-err">Usuario o contraseña incorrectos</div>   <!-- .show para mostrarlo -->
    <div class="dpw-lg-fg"><label class="dpw-lg-lbl">Usuario</label><input class="dpw-lg-in"></div>
    <button class="dpw-lg-btn">Ingresar</button>
    <div class="dpw-lg-foot">Uso interno exclusivo · DP World Panamá</div>
  </div>
</div>

<!-- Cinta superior -->
<header class="dpw-hdr">
  <div class="dpw-hdr-l">
    <button class="dpw-burger" data-dpw="menu" aria-label="Abrir menú" aria-controls="dpwDrawer"><span></span><span></span><span></span></button>
    <div class="dpw-logo"><img src="dpw/assets/dpworld-logo-fondo-claro.png" alt="DP World"></div>
    <div><div class="dpw-title">DP WORLD</div><div class="dpw-sub">Control de Horas</div></div>
  </div>
  <div class="dpw-hdr-r">
    <button class="dpw-hbtn dpw-install dpw-hide-sm" data-dpw="instalar" hidden>Instalar</button>
    <button class="dpw-hbtn" data-dpw="tema">Claro</button>
    <span class="dpw-role dpw-hide-sm">Supervisor</span>
    <button class="dpw-salir">Salir</button>
  </div>
</header>

<!-- Menú desplegable -->
<div class="dpw-ov" id="dpwOv" data-dpw="menu-close" hidden></div>
<nav class="dpw-drawer" id="dpwDrawer" aria-label="Menú principal" aria-hidden="true">
  <div class="dpw-drawer-h">logo + título + <button class="dpw-close" data-dpw="menu-close" aria-label="Cerrar menú">×</button></div>
  <div class="dpw-who" id="dpwWho"></div>
  <div class="dpw-items" id="dpwItems"></div>
  <div class="dpw-drawer-f"><span></span><button class="dpw-salir">Salir</button></div>
</nav>

<script src="dpw/dpw-shell.js"></script>
<script src="dpw/dpw-escenas.js"></script>   <!-- y dpw/dpw-mapa.js si la escena es mapa -->
<script>
DPW.escena('bodega', document.getElementById('dpwLogin'));   // se pausa sola cuando el login se oculta
DPW.menu([
  {id:'turno',    label:'Turno',    on:()=>setNav('supervisor')},
  {id:'insights', label:'Insights', badge:3, on:()=>setNav('insights')},
  {id:'tv',       label:'Vista TV', hint:'pantalla completa', on:openDashboard},
  {id:'config',   label:'Configuración', group:'Administración', hidden:!esAdmin, on:abrirConfig}
], 'turno');                       // DPW.activo('insights') al cambiar de vista
DPW.quien('Sesión', 'Ana Pérez · Supervisor');
DPW.pwa('sw.js');                  // registra el service worker (copia de kit/pwa/sw.js en la raíz)
DPW.aviso = m => showToast(m);     // opcional: mensajes del kit en el toast de la app
</script>
```

- Tema y Instalar no llevan código propio: basta con los botones `data-dpw="tema"` y `data-dpw="instalar"`. Si la app necesita reaccionar al cambio de tema, escucha `document.addEventListener('dpw:tema', e => …)`.
- Cómo darle el segundo tema al contenido de una app: sus colores van en variables (`:root` con los del tema por defecto) y un bloque `html[data-theme="dark"]{…}` o `html[data-theme="light"]{…}` con los otros valores. Si una variable sirve a la vez de fondo y de texto (por ejemplo el índigo), sepárala en dos (`--blue` fondo, `--blue-t` texto). Los colores fijos en estilos en línea se corrigen con selectores de atributo (`[style*=";color:#1A1060"]`). Ejemplos: Cotizador (claro → oscuro), Inspección y Hub (oscuro → claro), Alertas (Tailwind: `@theme` apunta a variables `--dpw-c-*`).
- PWA: copia `kit/pwa/sw.js` a la raíz (cambia el nombre de `CACHE`) y `kit/pwa/manifest.webmanifest` (nombre, nombre corto y descripción de la app); los íconos van en `dpw/pwa/`.
- La suma de los `badge` del menú aparece sola sobre el botón de tres rayas.
- Apps sin usuarios (Hub, Alertas de Calidad): la tarjeta lleva el logo, el nombre y un solo botón `Entrar`; no se inventan campos de usuario.
- Móvil (≤ 820 px): el login apila frase → escena → tarjeta → franja, y la cinta esconde lo marcado con `dpw-hide-sm` en ≤ 560 px.

## Verificación

Antes de dar por hecho un cambio: abrir la app con Playwright en 1440×900 y 390×844, revisar el login (escena visible entre la frase y la tarjeta), entrar, recorrer cada pantalla en tema claro y en oscuro, recorrer cada fila del menú y confirmar que no hay errores en consola. Para el botón Instalar, simula el evento: `const e=new Event('beforeinstallprompt');e.prompt=()=>{};e.userChoice=Promise.resolve();dispatchEvent(e)` y comprueba que los botones `data-dpw="instalar"` se muestran. Buscar emojis que hayan quedado con:

```bash
python3 -c "import re,sys;s=open(sys.argv[1],encoding='utf-8').read();print(re.findall('[⌀-⏿☀-➿⬀-⯿\U0001F000-\U0001FAFF]',s))" index.html
```
