-- Esquema canónico de Baigorria (base: baigorria).
-- Ver docs/MODELO-DATOS.md para la justificación de cada decisión.

-- ── Trigger genérico para updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── leads (origen: Meta/Google → n8n) ──────────────────────────────────────
CREATE TABLE leads (
  id                SERIAL PRIMARY KEY,
  fecha_ingreso     TIMESTAMPTZ,
  nombre            TEXT,
  apellido          TEXT,
  email             TEXT,
  telefono          TEXT,
  empresa           TEXT,
  rubro             TEXT,
  producto          TEXT,
  provincia         TEXT,
  compra_estimada   TEXT,
  observaciones     TEXT,
  origen            TEXT,
  plataforma        TEXT,
  estado            TEXT DEFAULT 'Nuevo',
  contactado        BOOLEAN DEFAULT FALSE,
  fecha_contacto    DATE,
  vendedor          TEXT,
  comentarios       TEXT,
  proveedor_actual  TEXT,
  potencial         TEXT,
  venta_concretada  BOOLEAN DEFAULT FALSE,
  fecha_venta       DATE,
  dolor             TEXT,
  chat_history      JSONB,
  es_test           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_leads_estado ON leads(estado);
CREATE INDEX idx_leads_rubro  ON leads(rubro);
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── clientes (origen: ISIS adapter) ────────────────────────────────────────
CREATE TABLE clientes (
  id                 SERIAL PRIMARY KEY,
  isis_id            TEXT UNIQUE,
  nombre             TEXT,
  cuit               TEXT,
  rubro              TEXT,
  provincia          TEXT,
  localidad          TEXT,
  telefono           TEXT,
  email              TEXT,
  vendedor_asignado  TEXT,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── articulos (origen: ISIS adapter) ───────────────────────────────────────
CREATE TABLE articulos (
  id            SERIAL PRIMARY KEY,
  codigo        TEXT UNIQUE,
  categoria     TEXT,
  subcategoria  TEXT,
  tipo          TEXT,
  descripcion   TEXT,
  unidad_medida TEXT DEFAULT 'kg',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trg_articulos_updated BEFORE UPDATE ON articulos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── stock (origen: ISIS adapter) ───────────────────────────────────────────
CREATE TABLE stock (
  id                    SERIAL PRIMARY KEY,
  articulo_codigo       TEXT REFERENCES articulos(codigo),
  kilos_disponibles     REAL DEFAULT 0,
  unidades_disponibles  INTEGER DEFAULT 0,
  estado                TEXT DEFAULT 'Disponible',
  ubicacion             TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trg_stock_updated BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── pedidos (origen: ISIS adapter; prioridad_armado/notas: Martín en NocoDB) ─
CREATE TABLE pedidos (
  id                      SERIAL PRIMARY KEY,
  nro_pedido              TEXT UNIQUE,
  cliente_isis_id         TEXT REFERENCES clientes(isis_id),
  cliente_nombre          TEXT,
  fecha_pedido            DATE,
  kilos_total             REAL,
  estado                  TEXT DEFAULT 'En proceso',
  prioridad_armado        TEXT DEFAULT 'Media',
  retira_local            BOOLEAN DEFAULT FALSE,
  tipo_entrega            TEXT,
  cantidad_bultos         INTEGER,
  nro_factura             TEXT,
  fecha_factura           DATE,
  ruta_pdf                TEXT,
  notificado_facturado    BOOLEAN DEFAULT FALSE,
  notificado_despachado   BOOLEAN DEFAULT FALSE,
  notas                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ventas_mensuales (origen: base de Ivo adapter) ─────────────────────────
CREATE TABLE ventas_mensuales (
  id               SERIAL PRIMARY KEY,
  cliente_isis_id  TEXT REFERENCES clientes(isis_id),
  periodo          TEXT,
  total_facturado  REAL,
  kilos_vendidos   REAL,
  ticket_promedio  REAL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cliente_isis_id, periodo)
);

-- ── vista de scoring (no se persiste; excluye leads de test) ────────────────
CREATE VIEW leads_scored AS
SELECT l.*,
  LEAST(100,
      CASE
        WHEN lower(l.rubro) ~ '(bulonera|distribuidor|mayorista|industria|agro)' THEN 30
        WHEN lower(l.rubro) ~ '(ferreteria|ferretería|repuestos|taller)'         THEN 18
        ELSE 0
      END
    + CASE WHEN COALESCE(l.empresa,'')         <> '' THEN 10 ELSE 0 END
    + CASE WHEN COALESCE(l.email,'')           <> '' THEN 10 ELSE 0 END
    + CASE WHEN COALESCE(l.telefono,'')        <> '' THEN 10 ELSE 0 END
    + CASE WHEN COALESCE(l.compra_estimada,'') <> '' THEN 20 ELSE 0 END
    + CASE WHEN lower(COALESCE(l.provincia,'')) ~ '(buenos|caba|capital)' THEN 10 ELSE 0 END
  ) AS lead_score
FROM leads l
WHERE l.es_test = FALSE;
