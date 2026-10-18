# Evidencias en Storage y borrado automático

Las fotos de inspección y el PDF se guardan en el bucket privado `evidencias` de Supabase Storage. En `operaciones.inspeccion` solo queda la ruta de cada archivo; nunca base64.

## Retención

| Carpeta | Contenido | Días |
|---|---|---|
| `fotos/` | Fotos de inspección (Control de Rampas) | 30 |
| `sello/` | Foto puerta + sello (Last Mile) | 30 |
| `eir/` | EIR de retiro y de entrega (Last Mile) | 30 |
| `pdf/` | PDF de inspección | 365 |

Para cambiar los días, edita la tabla `public.retencion_evidencias`. Es el único lugar donde se definen:

```sql
UPDATE public.retencion_evidencias SET dias = 60 WHERE prefijo = 'fotos/';
```

Cada noche se ejecutan dos tareas:

- **03:00 (hora de Panamá):** `limpiar_referencias_evidencias()` quita de `operaciones.inspeccion` las rutas vencidas y deja la marca `fotosPurgadas` / `pdfPurgado`.
- **03:15:** la Edge Function `purgar-evidencias` borra los archivos vencidos del bucket.

La función hace falta porque borrar filas de `storage.objects` con SQL no elimina el archivo: hay que usar la API de Storage.

## Qué hace la app

1. Al tomar una foto, la comprime en el teléfono (JPEG, máximo 1600 px; unos 100–400 KB).
2. Al guardar la inspección:
   - Sube las fotos a `fotos/AAAA/MM/DD/<operación>/`.
   - Genera el PDF y lo archiva en `pdf/…`, aunque no se comparta.
   - Guarda en la operación solo las rutas.
3. Desde el historial:
   - Si las fotos siguen en Storage, el PDF se vuelve a armar con ellas.
   - Si ya se purgaron, se entrega el PDF archivado.
4. Si no hay conexión con Storage, la inspección se guarda igual y avisa cuántos archivos no se respaldaron.

## Instalación (una sola vez, en este orden)

1. **SQL Editor:** ejecuta `supabase/retencion_evidencias.sql` hasta el paso 4 inclusive. Crea el bucket, las políticas, la tabla de retención y las funciones. Se puede volver a ejecutar sin problema.

2. **Edge Function**, con la CLI:
   ```bash
   supabase functions deploy purgar-evidencias --no-verify-jwt --project-ref nfqunrphpkopfodmcwar
   supabase secrets set PURGA_TOKEN=<token largo y aleatorio> --project-ref nfqunrphpkopfodmcwar
   ```
   También se puede hacer desde el panel:
   - *Edge Functions → Deploy a new function*: pega `supabase/functions/purgar-evidencias/index.ts` y desactiva *Enforce JWT verification*.
   - *Edge Functions → Secrets*: agrega `PURGA_TOKEN`.

3. **Vault:** en el SQL Editor guarda la URL del proyecto y el mismo token:
   ```sql
   SELECT vault.create_secret('https://nfqunrphpkopfodmcwar.supabase.co', 'project_url');
   SELECT vault.create_secret('<el mismo token>', 'purga_token');
   ```

4. **SQL Editor:** ejecuta el paso 5 de `retencion_evidencias.sql`. Activa `pg_cron` y `pg_net` y programa las dos tareas.

5. **Publica el nuevo `index.html`.** Si se publica antes del paso 1, las inspecciones se siguen guardando, pero sin respaldo de fotos ni de PDF.

## Comprobar

```sql
-- Ejecuciones programadas
SELECT jobname, status, start_time, return_message
  FROM cron.job_run_details JOIN cron.job USING (jobid)
 ORDER BY start_time DESC LIMIT 20;

-- Respuesta de la Edge Function ({"borrados": N})
SELECT status_code, content FROM net._http_response ORDER BY created DESC LIMIT 5;

-- Qué se borraría hoy (ejecutar como service_role, por ejemplo desde el SQL Editor)
SELECT * FROM public.evidencias_vencidas(50);
```

## Pendientes

- **Seguridad:** el bucket usa el mismo modelo que las tablas (rol `anon`). La app puede subir y leer, pero no borrar. Al pasar a Supabase Auth hay que cambiar las políticas a reglas por rol.
- **Inspecciones anteriores a este cambio:** no tienen fotos guardadas en Supabase, porque la app nunca las envió a la base. No hay nada que migrar.
