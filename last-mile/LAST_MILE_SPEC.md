# Last Mile — Especificación para integrar con Control de Rampas

Módulo de coordinación de transporte de contenedores (retiro de vacío → carga en Bodega DP World → entrega de lleno en terminal) para clientes 3PL, empezando por CERNAC. Su objetivo es reemplazar la coordinación manual que hoy se hace por correo y WhatsApp. El prototipo navegable está en `prototype/index.html`: es un solo archivo HTML/JS que guarda los datos en localStorage.

## Roles y visibilidad (muro de confidencialidad)

| Rol | Ve | Hace |
|---|---|---|
| Cliente (CERNAC) | Sus bookings, estado por contenedor, chofer y placa **como DP World**, pruebas | Crear booking (incluye detalle de carga), observar |
| Transportista subcontratado | Datos de transporte: número de booking, tamaño, cantidad, ventanas, patio y terminal, documentos operativos. **Nunca** el detalle de carga ni los datos comerciales del cliente | Confirmar disponibilidad (≤ 1 h), agendar hora de retiro, retiro de vacío, en tránsito, entregado lleno, devuelto, subir EIR. No cancela: avisa a coordinación |
| Bodega | Detalle de carga: SKU, descripción, instrucciones especiales | Marcar **Cargado en bodega** (sello, cajas, foto) |
| Admin DP World | Todo, incluida la identidad real del transportista | Aprobar o rechazar confirmaciones, asignar directo, reabrir, dividir por contenedor, corregir estados |

DP World es el transportista de cara al cliente: el cliente nunca ve el nombre del subcontratista.

## Booking (campos)
- Ventana de retiro de vacío (desde/hasta) y patio
- Ventana de entrega de lleno (desde/hasta) y terminal (MIT, CCT, PPC)
- **Número de booking** (encabezado principal, justo después de las ventanas)
- **Tamaño de contenedor** (20' DV, 40' DV, 40' HC, 20'/40' RF): define el chasis
- Cantidad, naviera, documentos (booking, release)
- Detalle de carga (solo bodega y admin): SKU, descripción, cajas por contenedor, instrucciones especiales

## Navegación
- **Menú ☰** en el encabezado: panel lateral de izquierda a derecha con las secciones del rol, sus contadores, la sesión, «Reiniciar demo» y «Salir». El encabezado muestra la sección actual («Last Mile · Calendario»).
- **Secciones desplegables** en todas las vistas (bodega: en cola, en rampa, próximas cargas, cargados y sellados; transportista: disponibles, esperando aprobación, mis operaciones; admin; reportes). Se abre la primera con contenido y se recuerda lo que el usuario deja abierto.
- El **cliente** ve sus bookings en tres secciones: programando transporte, en operación y completados.

## Aprobación por excepción y cancelaciones
- Al confirmar, el transportista ve las reglas antes de enviar. **Se aprueba sola** si cumple todas: documentos vigentes, capacidad (cabezales comprometidos en la ventana ≤ flota), desempeño de 90 días ≥ mínimo en retiro y entrega, equipo compatible (RF requiere genset), carga general y máx. 2 transportistas por booking. Si falla alguna, va a «Por aprobar» con los motivos.
- El admin puede **revertir** una aprobación automática durante unos minutos; ve los **posibles no-show** (cita sin retiro pasadas N horas) y la configuración (encendido/apagado, umbrales y teléfono de coordinación).
- **El transportista no cancela desde la app**: ve «¿Problema con este viaje?» con llamada y WhatsApp a coordinación. DP World cancela o reasigna desde el detalle del booking indicando el **origen** (el transportista avisó / detectado por DP World) y el motivo; se republica con reloj corto o se asigna directo a otro transportista, y queda como incidencia del transportista.
- **El cliente** puede cancelar contenedores que aún no se retiraron; los retirados se gestionan como incidencia.
- **Reportes**: incidencias por cada 100 contenedores, separadas por origen, y cancelaciones por transportista.
- Valores de ejemplo: desempeño mínimo 95 %, revertir 15 min, no-show 3 h, republicar 30 min, teléfono `+507 6000-0000` (por definir).

## Flujo y estados (por contenedor)
`publicado → confirmado (por aprobar) → asignado → retiro de vacío → cargado en bodega → en tránsito → entregado lleno → devuelto`

- Publicación con dos modos: **Directo** (a un proveedor preferido) o **Abierto** (todos lo ven y el primero que confirma se lo queda).
- El transportista tiene **1 hora** para confirmar. Al vencer el plazo se avisa al admin, que asigna directo o reabre otra hora.
- Si el proveedor preferido rechaza, el booking pasa a modo abierto y el reloj se reinicia.
- Confirmación parcial permitida: los contenedores sobrantes siguen publicados.
- **Aprobación por excepción**: automática si cumple las reglas; el admin revisa solo lo que falla y puede revertir lo automático por unos minutos.
- Asignación por booking completo por defecto, con opción de dividir por contenedor.

| Estado | Lo marca | Datos o prueba |
|---|---|---|
| Retiro de vacío | Transportista | N° contenedor, chofer, placa, EIR retiro |
| Cargado en bodega | Bodega | N° sello, cajas, foto puerta + sello |
| En tránsito | Transportista | — |
| Entregado lleno | Transportista | EIR entrega |
| Devuelto | Transportista | — |

El admin puede corregir cualquier estado.

## Integración con Control de Rampas (este repo)

Control de Rampas (`index.html` + Supabase: `clientes`, `operaciones`, `bitacora`) ya cubre la vida del contenedor desde la bodega hasta el puerto:
`ESPERA_RAMPA → EN_RAMPA → PEND_INSP → INSPECCIONADO → PROXIMO → P20/P50/P100 → BUFFER_POST → ESPERA_TRANS → ESPERA_DOCS → TRANSITO → EN_PUERTO → EIR`

Last Mile agrega **lo que pasa antes**: el booking del cliente, la publicación a transportistas, la confirmación en 1 h, la aprobación y el retiro de vacío. Propuesta: **un solo sistema** en el que el booking crea las operaciones `SALIDA`.

### Equivalencia de estados
| Last Mile | Control de Rampas |
|---|---|
| publicado / confirmado / asignado | (nuevo, en tabla `bookings`; la operación aún no existe) |
| retiro de vacío | crear `operaciones` tipo `SALIDA`, estado `ESPERA_RAMPA` |
| (en bodega) | `EN_RAMPA → PEND_INSP → INSPECCIONADO → PROXIMO → P20/P50/P100` |
| cargado en bodega | `BUFFER_POST` (sello registrado) |
| en tránsito | `ESPERA_TRANS / ESPERA_DOCS → TRANSITO` |
| entregado lleno | `EN_PUERTO → EIR` |
| devuelto | (nuevo, opcional: cierre de chasis) |

### Cómo lo simula el prototipo
- **Login por rol** (usuarios de prueba con contraseña `demo`): `cernac` (cliente), `bodega`, `costa` / `istmo` / `caribe` (cada transportista) y `admin`. Cada sesión activa solo las vistas de su rol.
- **Bodega** entra a *Bookings* (sección previa: en cola de rampa, en rampa, próximas cargas con detalle de carga, y cargados y sellados) y de ahí a *Rampas*, que usa el mismo muelle de Control de Rampas (CLP, 6 rampas, buffer de 16).
- **Retiro de vacío** (transportista) → el contenedor entra solo a la cola (`ESPERA_RAMPA`). Bodega le asigna rampa → `PEND_INSP` → inspección → `P20/P50/P100` → **Cerrar y sellar** (sello, cajas y foto) → `BUFFER_POST`, que es lo que el cliente ve como «Cargado en bodega». Ya no se marca a mano en Last Mile.
- **En tránsito, entregado lleno y devuelto** los marca el transportista.
- El admin ve el panel y también Rampas.
- **Bookings en filas desplegables**, ordenadas por **fecha de prioridad**: el **desde** de la ventana vigente: retiro de vacío mientras queden contenedores sin retirar; después, entrega de lleno. La fila muestra desde y hasta, y si la ventana empieza, está abierta (cuándo cierra) o cerró. Ámbar si empieza en menos de 24 h o está abierta; rojo si cerró sin completarse. Los completados van al final.
- Cada fila muestra el **tracking de 8 etapas** (publicado → devuelto) con cuántos contenedores hay en cada una: ✓ verde = etapa superada por todos; ámbar = en espera; azul = en curso; verde = entregado. Al desplegar se ven ventanas, carga, contenedores y acciones.

### Cambios de datos propuestos (Supabase)
```sql
CREATE TABLE transportistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL, usuario TEXT UNIQUE, activo BOOLEAN DEFAULT TRUE,
  flota INT, chasis TEXT, preferido BOOLEAN DEFAULT FALSE
);
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  numero TEXT NOT NULL, naviera TEXT, tamano TEXT NOT NULL, cantidad INT NOT NULL,
  retiro_desde TIMESTAMPTZ, retiro_hasta TIMESTAMPTZ, patio TEXT,
  entrega_desde TIMESTAMPTZ, entrega_hasta TIMESTAMPTZ, terminal TEXT,
  modo TEXT DEFAULT 'abierto', directo_a UUID REFERENCES transportistas(id),
  publicado_en TIMESTAMPTZ DEFAULT NOW(),
  carga JSONB,          -- SKU, descripción, instrucciones: SOLO bodega/admin
  documentos JSONB, creado_en TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE confirmaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id), transportista_id UUID REFERENCES transportistas(id),
  cantidad INT, unidades INT, nota TEXT,
  estado TEXT DEFAULT 'pendiente', -- pendiente | aprobada | rechazada
  creado_en TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE operaciones ADD COLUMN booking_id UUID REFERENCES bookings(id);
ALTER TABLE operaciones ADD COLUMN transportista_id UUID REFERENCES transportistas(id);
ALTER TABLE operaciones ADD COLUMN chofer TEXT, ADD COLUMN placa TEXT, ADD COLUMN pruebas JSONB DEFAULT '[]'::jsonb;
```

### Roles
Hoy existen `cliente` y `supervisor`. Hay que agregar `transportista` (solo datos de transporte) y `admin` (aprobaciones). `supervisor` hace de **bodega**: ve `bookings.carga` y opera las rampas.

### Pendiente de seguridad (importante)
Las políticas RLS actuales son `Allow all ... TO anon` y las contraseñas de `clientes` se guardan en texto plano. Antes de exponer la app a transportistas externos hay que pasar a Supabase Auth y escribir políticas RLS por rol. Sin eso, el muro de confidencialidad (el transportista no ve la carga y el cliente no ve al subcontratista) no se cumple a nivel de datos.

### Evidencias (fotos, EIR, sello)
Se guardan en el bucket privado `evidencias` de Supabase Storage (carpetas `fotos/`, `sello/`, `eir/` y `pdf/`), con borrado automático por antigüedad: 30 días las fotos, la foto del sello y los EIR; 365 días el PDF de inspección. La tabla solo guarda la ruta. Ver `supabase/README_retencion.md`.

### Orden sugerido
1. Tablas `transportistas`, `bookings` y `confirmaciones`, más las columnas nuevas en `operaciones`.
2. Vista **Cliente**: crear booking y ver su estado (reutilizando el login de clientes actual).
3. Vista **Transportista**: bandeja, confirmación con reloj de 1 h y marcado de retiro, tránsito y entrega.
4. Vista **Admin**: aprobaciones y alertas de vencimiento.
5. Retiro de vacío → crea la `operaciones` SALIDA en `ESPERA_RAMPA` (aparece sola en el tablero de rampas).
6. Supabase Auth + RLS por rol.

## Marca
Misma línea gráfica que Control de Rampas y las demás apps DP World: tema oscuro único con los tokens de `:root` (`--bg #0d0b28`, `--surf #16143d`, `--card #1e1c50`, `--primary #3E3C90`, `--green #00C389`, `--red #E8003D`, `--amber #f5a20b`, `--blue #0099e6`), Barlow Condensed para títulos, etiquetas y botones (en mayúsculas) y Barlow para el cuerpo, radios `--r 10px` / `--r2 6px`, y cabecera blanca con el logo.

Colores de estado: verde = completado/OK, ámbar = pendiente/espera, rojo = vencido/error, azul = en curso/tránsito.

**Una sola hoja de estilos:** `dpworld.css` (raíz del repo) la comparten `index.html` y `prototype/index.html`. El prototipo reutiliza las clases de Rampas (`.hdr`, `.tabs/.tab`, `.stats/.sbox`, `.psect-*`, `.btn-p`, `.cli-badge`, `.abox`, `.flbl/.fin`, `.htab`, `.mclose`, `.toast`); lo exclusivo de Last Mile está al final de la hoja, bajo `.lm`. Al integrar el módulo en `index.html` basta con envolver sus vistas en un contenedor `.lm`: no hay que copiar CSS.

## Documentos de apoyo
- `docs/Descripcion_Funciones_Coordinador_Last_Mile.docx`: funciones del coordinador manual (20 pasos), perfil, comparativo con la app e indicadores.
- Comparativo de acciones que requieren una persona: **17 tipos sin app frente a 4 con app** (aprobar, incidencias, conciliación, indicadores).

## Calendario (cliente, transportista, bodega y admin)
Semana por horas (05:00–22:00, hora de Panamá), con navegación anterior / Hoy / siguiente:
- **Franja de ventanas**: retiro de vacío y entrega de lleno de cada booking sobre la línea de tiempo de la semana.
- **Vistas**: en PC, semana por defecto con selector «Semana / Día»; en celular, siempre un día (tira de 7 días con puntos de actividad y ventanas del día con su barra horaria).
- **Turnos agrupados**: los turnos de un booking que empiezan a la misma hora se muestran en un solo bloque («11:00 R1–R6 · 6 cont.»); al tocarlo se ve el detalle por contenedor.
- **Cita de retiro** (transportista): hora exacta de retiro, obligatoriamente dentro de la ventana; se agenda para N contenedores y se puede reprogramar o quitar. Si cambia, los turnos de rampa de esos contenedores se liberan.
- **Turno de rampa** (bodega): rampa, inicio y duración por contenedor con cita. Se rechaza si la rampa ya está ocupada en ese horario o si empieza antes del retiro agendado; avisa si termina cerca del cierre de la entrega.
- **Cliente**: solo consulta, como «Retiro programado» y «Carga en bodega» (sin nombre del subcontratista). **Admin**: vista completa.
- Pendientes con contador en la pestaña: retiros sin hora (transportista) y llegadas sin turno (bodega).

Datos: `contenedor.cita = {at, by}` y `contenedor.turno = {at, rampa, dur}`. En Supabase: columnas `cita_retiro`, `turno_rampa`, `turno_inicio`, `turno_duracion` en `operaciones` (o tabla `citas`), con una restricción que impida turnos solapados en la misma rampa.

## Configuración
- **Ubicación:** menú ☰ → Configuración, para todos los roles.
- **Apariencia:** tema oscuro o claro. Se guarda por dispositivo. El tablero de rampas sigue oscuro en los dos temas.
- **Administración (solo admin):** clientes, transportistas y usuarios.
  - **Crear y editar.** Clientes: nombre, siglas, contacto. Transportistas: flota, chasis, reefer, vigencia y nota de documentos. Usuarios: usuario, nombre, rol, empresa y contraseña.
  - **Dar de baja.** Bloquea el acceso y saca al transportista de preferido, asignaciones y avisos nuevos. Conserva su historial para los reportes. Si se da de baja la empresa, sus usuarios tampoco pueden entrar.
  - **Eliminar.** Solo se permite si no tiene historial ni usuarios.
  - **Reglas.** Nadie se elimina ni se da de baja a sí mismo. Siempre queda al menos un admin y un transportista activos.
- **Bookings por cliente.** Cada cliente ve solo sus bookings (`clientId`). Los avisos llegan a todos los usuarios activos de esa empresa.
- **Definitiva.** Las contraseñas pasan a Supabase Auth, cifradas. El usuario crea la suya desde un enlace y el admin solo puede restablecerla.

## Notificaciones push
- **Instalable (PWA):** `manifest.json` + `sw.js` en `last-mile/prototype/`. En Android y PC el push funciona desde el navegador; en iPhone (iOS 16.4+) solo con la app agregada a la pantalla de inicio. La app muestra esos pasos cuando detecta un iPhone sin instalar.
- **Activación:** menú ☰ → Notificaciones → *Activar*. El permiso se pide con un toque del usuario y queda por usuario y dispositivo.
- **Qué se avisa:**
  - Transportistas: booking nuevo, reabierto o republicado; aprobación o rechazo; aprobación revertida; turno de rampa; contenedor sellado; reasignación; cancelación del cliente.
  - Admin: confirmación por revisar, aprobación automática, booking vencido sin confirmar, cancelación del cliente.
  - Bodega: cita de retiro y vacío en cola de rampa.
  - Cliente: transporte asignado, retiro, cargado y sellado, tránsito, entrega y devolución.
- Quien hace la acción no recibe el aviso. Tocar el aviso abre el booking.
- **Prototipo:** el aviso lo muestra el service worker del mismo dispositivo para los usuarios que activaron ahí sus avisos; el texto incluye "Para: …".
- **Producción:**
  1. Generar las llaves VAPID: la pública va en la app y la privada como secreto de Supabase.
  2. Crear la tabla `push_subs` (usuario, rol, suscripción).
  3. Un database webhook por evento llama a una Edge Function, que envía con `web-push` a las suscripciones de los destinatarios. `sw.js` ya atiende el evento `push`.

## Reportería (admin)
Sección **Reportes** del admin, con filtro de período (30 días, 90 días, este mes, todo; se cuenta por el inicio de la ventana de retiro):
- **Cumplimiento** contra meta, con semáforo (✓ Cumple / ▲ Bajo meta, hasta 5 puntos bajo la meta / ✕ Crítico): confirmados ≤ 1 h, retiro en ventana, entrega en ventana, pruebas completas (EIR retiro, foto del sello y EIR entrega).
- **Desempeño por transportista**: contenedores, TEU, los mismos cuatro indicadores, rechazos y asignaciones directas por no confirmar a tiempo.
- **Volumen y tendencia**: contenedores por semana y desglose por naviera, terminal y tamaño.
- **Excel** con cuatro hojas: Resumen, Por transportista, Por semana y Detalle por contenedor.

Para medir, cada contenedor guarda la fecha y hora en que llegó a cada estado (`c.t`). En Supabase equivale a una tabla de eventos de estado o a columnas de timestamp en `operaciones`. El prototipo trae unas 11 semanas de historial de ejemplo archivado, que solo se usa en Reportes.
Incidencias y conciliación semanal todavía no se capturan; la pantalla lo indica en lugar de inventar cifras.

## KPIs propuestos
Bookings confirmados ≤ 1 h (≥ 95 %), retiro en ventana (≥ 98 %), entrega en ventana (100 %), pruebas completas (100 %), incidencias por cada 100 contenedores, conciliación semanal a tiempo.
