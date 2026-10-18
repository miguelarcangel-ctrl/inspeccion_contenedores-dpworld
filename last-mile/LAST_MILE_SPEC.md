# Last Mile — Especificación para integrar con Control de Rampas

Módulo de coordinación de transporte de contenedores (retiro de vacío → carga en Bodega DP World → entrega de lleno en terminal) para clientes 3PL, empezando por CERNAC. Su objetivo es reemplazar la coordinación manual que hoy se hace por correo y WhatsApp. El prototipo navegable está en `prototype/index.html`: es un solo archivo HTML/JS que guarda los datos en localStorage.

## Roles y visibilidad (muro de confidencialidad)

| Rol | Ve | Hace |
|---|---|---|
| Cliente (CERNAC) | Sus bookings, estado por contenedor, chofer y placa **como DP World**, pruebas | Crear booking (incluye detalle de carga), observar |
| Transportista subcontratado | Datos de transporte: número de booking, tamaño, cantidad, ventanas, patio y terminal, documentos operativos. **Nunca** el detalle de carga ni los datos comerciales del cliente | Confirmar disponibilidad (≤ 1 h), retiro de vacío, en tránsito, entregado lleno, devuelto, subir EIR |
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

## Flujo y estados (por contenedor)
`publicado → confirmado (por aprobar) → asignado → retiro de vacío → cargado en bodega → en tránsito → entregado lleno → devuelto`

- Publicación con dos modos: **Directo** (a un proveedor preferido) o **Abierto** (todos lo ven y el primero que confirma se lo queda).
- El transportista tiene **1 hora** para confirmar. Al vencer el plazo se avisa al admin, que asigna directo o reabre otra hora.
- Si el proveedor preferido rechaza, el booking pasa a modo abierto y el reloj se reinicia.
- Confirmación parcial permitida: los contenedores sobrantes siguen publicados.
- **Aprobación del admin obligatoria** antes de que el booking quede asignado en firme.
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
- **Bookings en filas desplegables**, ordenadas por **fecha de prioridad**: el **inicio de la ventana de retiro de vacío** mientras queden contenedores sin retirar; después, el fin de la ventana de entrega. Los completados van al final. Ámbar si el retiro empieza en menos de 24 h o la ventana ya está abierta; rojo si la ventana cerró con contenedores sin retirar (o si venció la entrega).
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

## KPIs propuestos
Bookings confirmados ≤ 1 h (≥ 95 %), retiro en ventana (≥ 98 %), entrega en ventana (100 %), pruebas completas (100 %), incidencias por cada 100 contenedores, conciliación semanal a tiempo.
