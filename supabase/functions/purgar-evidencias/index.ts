// Borra del bucket "evidencias" los archivos que superaron su retención
// (tabla public.retencion_evidencias). La llama pg_cron cada noche.
// Desplegar con: supabase functions deploy purgar-evidencias --no-verify-jwt
// Secreto requerido: supabase secrets set PURGA_TOKEN=<mismo valor que en Vault>
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'evidencias';
const LOTE_CONSULTA = 1000; // nombres por consulta
const LOTE_BORRADO = 100;   // archivos por llamada a remove()
const MAX_VUELTAS = 20;     // tope por ejecución (20.000 archivos)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const token = Deno.env.get('PURGA_TOKEN');
  if (!token || req.headers.get('x-purga-token') !== token) {
    return json({ error: 'No autorizado' }, 401);
  }

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  let borrados = 0;
  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const { data, error } = await sb.rpc('evidencias_vencidas', { limite: LOTE_CONSULTA });
    if (error) return json({ error: error.message, borrados }, 500);
    const nombres = (data ?? []).map((r: { nombre: string }) => r.nombre);
    if (!nombres.length) break;

    for (let i = 0; i < nombres.length; i += LOTE_BORRADO) {
      const lote = nombres.slice(i, i + LOTE_BORRADO);
      const { error: e } = await sb.storage.from(BUCKET).remove(lote);
      if (e) return json({ error: e.message, borrados }, 500);
      borrados += lote.length;
    }
    if (nombres.length < LOTE_CONSULTA) break;
  }

  return json({ borrados });
});
