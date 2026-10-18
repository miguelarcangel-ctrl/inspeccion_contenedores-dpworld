-- ═══════════════════════════════════════════════════════════════════
-- Evidencias en Supabase Storage + borrado automático por antigüedad
-- Ejecutar en el SQL Editor de Supabase (una sola vez), después de
-- supabase_setup.sql. Pasos 1 a 4 se pueden repetir sin problema.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Bucket privado para fotos, PDF y EIR (máx. 10 MB por archivo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('evidencias', 'evidencias', false, 10485760,
        ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 2. Permisos del bucket. Mismo modelo que el resto de la app (rol anon):
--    puede subir, leer y reemplazar, pero NO borrar; solo la purga
--    programada (service_role) borra.
--    PENDIENTE DE SEGURIDAD: al pasar a Supabase Auth, cambiar "TO anon"
--    por políticas por rol, igual que en las tablas.
DROP POLICY IF EXISTS "evidencias: subir" ON storage.objects;
DROP POLICY IF EXISTS "evidencias: leer" ON storage.objects;
DROP POLICY IF EXISTS "evidencias: reemplazar" ON storage.objects;
CREATE POLICY "evidencias: subir" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'evidencias');
CREATE POLICY "evidencias: leer" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'evidencias');
CREATE POLICY "evidencias: reemplazar" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'evidencias');

-- 3. Retención por carpeta del bucket. ÚNICO lugar donde se cambian los días.
CREATE TABLE IF NOT EXISTS public.retencion_evidencias (
  prefijo TEXT PRIMARY KEY,               -- carpeta dentro del bucket
  dias INT NOT NULL CHECK (dias > 0),
  descripcion TEXT
);
INSERT INTO public.retencion_evidencias (prefijo, dias, descripcion) VALUES
  ('fotos/', 30,  'Fotos de inspección (Control de Rampas)'),
  ('sello/', 30,  'Foto puerta + sello (Last Mile)'),
  ('eir/',   30,  'EIR de retiro y de entrega (Last Mile)'),
  ('pdf/',   365, 'PDF de inspección')
ON CONFLICT (prefijo) DO NOTHING;
-- Sin políticas: la app (anon) no puede leer ni cambiar la retención.
ALTER TABLE public.retencion_evidencias ENABLE ROW LEVEL SECURITY;

-- 4a. Archivos vencidos según la retención de su carpeta (lo usa la Edge Function)
CREATE OR REPLACE FUNCTION public.evidencias_vencidas(limite INT DEFAULT 1000)
RETURNS TABLE (nombre TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT o.name
    FROM storage.objects o
    JOIN public.retencion_evidencias r ON o.name LIKE r.prefijo || '%'
   WHERE o.bucket_id = 'evidencias'
     AND o.created_at < now() - make_interval(days => r.dias)
   ORDER BY o.created_at
   LIMIT limite;
$$;
REVOKE ALL ON FUNCTION public.evidencias_vencidas(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evidencias_vencidas(INT) TO service_role;

-- 4b. Quita de operaciones.inspeccion las rutas de fotos y PDF vencidos,
--     para que la app no intente abrir archivos ya borrados. Deja la marca
--     fotosPurgadas / pdfPurgado. Se conservan respuestas, resultado,
--     inspector, fecha y comentarios.
CREATE OR REPLACE FUNCTION public.limpiar_referencias_evidencias()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  dias_fotos INT := (SELECT dias FROM public.retencion_evidencias WHERE prefijo = 'fotos/');
  dias_pdf   INT := (SELECT dias FROM public.retencion_evidencias WHERE prefijo = 'pdf/');
  n_fotos INT := 0;
  n_pdf   INT := 0;
BEGIN
  IF dias_fotos IS NOT NULL THEN
    UPDATE public.operaciones
       SET inspeccion = (inspeccion - 'itemFotos' - 'globalFotos')
                        || jsonb_build_object('fotosPurgadas', now())
     WHERE (inspeccion ? 'itemFotos' OR inspeccion ? 'globalFotos')
       AND COALESCE((inspeccion->>'fecha')::timestamptz, creado_en)
           < now() - make_interval(days => dias_fotos);
    GET DIAGNOSTICS n_fotos = ROW_COUNT;
  END IF;
  IF dias_pdf IS NOT NULL THEN
    UPDATE public.operaciones
       SET inspeccion = (inspeccion - 'pdf')
                        || jsonb_build_object('pdfPurgado', now())
     WHERE inspeccion ? 'pdf'
       AND COALESCE((inspeccion->>'fecha')::timestamptz, creado_en)
           < now() - make_interval(days => dias_pdf);
    GET DIAGNOSTICS n_pdf = ROW_COUNT;
  END IF;
  RETURN jsonb_build_object('inspecciones_sin_fotos', n_fotos, 'inspecciones_sin_pdf', n_pdf);
END;
$$;
REVOKE ALL ON FUNCTION public.limpiar_referencias_evidencias() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.limpiar_referencias_evidencias() TO service_role;

-- ═══════════════════════════════════════════════════════════════════
-- 5. Programación diaria (03:00 y 03:15 hora de Panamá = 08:00/08:15 UTC)
--    Antes de ejecutar este bloque:
--    a) Desplegar la Edge Function (ver supabase/README_retencion.md).
--    b) Guardar en Vault la URL del proyecto y el token de la purga
--       (el mismo valor que el secreto PURGA_TOKEN de la función):
--         SELECT vault.create_secret('https://<ref>.supabase.co', 'project_url');
--         SELECT vault.create_secret('<token largo y aleatorio>', 'purga_token');
-- ═══════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Quitar de la base las rutas vencidas
SELECT cron.schedule('evidencias-limpiar-referencias', '0 8 * * *',
  $$SELECT public.limpiar_referencias_evidencias()$$);

-- Borrar los archivos vencidos de Storage (vía Edge Function: borrar filas
-- de storage.objects con SQL NO elimina el archivo; hay que usar la API)
SELECT cron.schedule('evidencias-purgar-archivos', '15 8 * * *', $$
  SELECT net.http_post(
    url     := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/purgar-evidencias',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-purga-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'purga_token')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$$);

-- Revisar ejecuciones:  SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- Respuestas de la función: SELECT * FROM net._http_response ORDER BY created DESC LIMIT 20;
-- Cambiar días (ej. fotos a 60): UPDATE public.retencion_evidencias SET dias = 60 WHERE prefijo = 'fotos/';
