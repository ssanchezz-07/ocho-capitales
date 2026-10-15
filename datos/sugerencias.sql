-- Ocho Capitales · tabla de sugerencias (Cloudflare D1). Crear una vez:
--   npx wrangler d1 create ocho-capitales
--   npx wrangler d1 execute ocho-capitales --remote --file datos/sugerencias.sql
CREATE TABLE IF NOT EXISTS sugerencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  texto TEXT NOT NULL,
  pagina TEXT,
  hermandad TEXT,
  huella TEXT,
  estado TEXT DEFAULT 'nueva'
);
CREATE INDEX IF NOT EXISTS sugerencias_fecha ON sugerencias (fecha);
CREATE INDEX IF NOT EXISTS sugerencias_huella ON sugerencias (huella, fecha);
