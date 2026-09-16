-- DP World Panamá — Control de Rampas
-- Ejecutar en Supabase SQL Editor: https://nfqunrphpkopfodmcwar.supabase.co/project/default/sql

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  usuario TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operaciones (
  id TEXT PRIMARY KEY,
  bodega TEXT NOT NULL,
  rampa TEXT,
  tipo TEXT NOT NULL,
  contenedor TEXT NOT NULL,
  tipo_contenedor TEXT,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT,
  transportista TEXT,
  estado TEXT NOT NULL DEFAULT 'ESPERA_RAMPA',
  inspeccion_completa BOOLEAN DEFAULT FALSE,
  inspeccion JSONB,
  log_ops JSONB DEFAULT '[]'::jsonb,
  sello TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bitacora (
  id BIGSERIAL PRIMARY KEY,
  op_id TEXT,
  contenedor TEXT,
  cliente_nombre TEXT,
  evento TEXT NOT NULL,
  usuario TEXT,
  rol TEXT,
  datos JSONB,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE operaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitacora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all clientes" ON clientes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operaciones" ON operaciones FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all bitacora" ON bitacora FOR ALL TO anon USING (true) WITH CHECK (true);

-- Habilitar realtime para operaciones
ALTER PUBLICATION supabase_realtime ADD TABLE operaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
