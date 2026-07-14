# Modelo de Datos Canónico — Baigorria Industrial

> **Fuente única de verdad del esquema.** Reemplaza y reconcilia los esquemas en conflicto de
> `ARCHITECTURE.md §5` y la (obsoleta) `ESPECIFICACION-TECNICA.md §4`.
> Stack: **PostgreSQL 16**. La UI es **NocoDB** (solo lectura/edición visual, el equipo NO toca SQL).
> Fecha: 2026-06-24.

---

## 0. Principios

- `snake_case` para tablas y columnas.
- Toda tabla lleva `created_at` y `updated_at` con defaults.
- Las sincronizaciones desde la **capa ISIS** (ver §7) usan **UPSERT** (`INSERT ... ON CONFLICT DO UPDATE`) → idempotencia.
- El **lead_score NO se persiste**: se calcula en una vista (`leads_scored`). Si se edita el lead, el score se recalcula solo.
- `clientes`, `articulos`, `stock`, `pedidos`, `ventas_mensuales` **provienen de la capa ISIS** (mock en la demo). `leads` proviene de Meta/Google.

---

## 1. Origen de cada tabla

| Tabla | Origen real (producción) | En la demo |
|-------|--------------------------|------------|
| `leads` | Meta/Google Ads → n8n | **236 leads reales migrados** |
| `clientes` | ISIS (adapter) | Mock |
| `articulos` | ISIS (adapter) | Mock |
| `stock` | ISIS (adapter) | Mock |
| `pedidos` | ISIS (adapter) | Mock (con sync simulado) |
| `ventas_mensuales` | Base de Ivo (adapter) | Mock |

---

## 2. Tabla `leads`

Anclada al **esquema real** del `leads.db` (incluye `producto` y `notas` que estaban en la base real), con limpieza (ver §6).

```sql
CREATE TABLE leads (
  id                SERIAL PRIMARY KEY,
  fecha_ingreso     TIMESTAMPTZ,                 -- parseado de 'fecha' (DD/MM/YYYY H:MM)
  nombre            TEXT,
  apellido          TEXT,
  email             TEXT,
  telefono          TEXT,                         -- solo dígitos, con código país (ej. 549114...)
  empresa           TEXT,
  rubro             TEXT,                         -- normalizado (ver §6.2)
  producto          TEXT,
  provincia         TEXT,
  compra_estimada   TEXT,
  observaciones     TEXT,
  origen            TEXT,                         -- 'Campaña Mayorista 2026', 'Meta Ads', ...
  plataforma        TEXT,                         -- 'Meta', 'Google'
  estado            TEXT DEFAULT 'Nuevo',         -- ver §6.3
  contactado        BOOLEAN DEFAULT FALSE,
  fecha_contacto    DATE,                         -- best-effort, NULL si no parsea
  vendedor          TEXT,                         -- limpiado (ver §6.4)
  comentarios       TEXT,
  proveedor_actual  TEXT,
  potencial         TEXT,
  venta_concretada  BOOLEAN DEFAULT FALSE,
  fecha_venta       DATE,
  dolor             TEXT,                         -- limpiado: NULL si era nombre de vendedor (§6.5)
  chat_history      JSONB,                        -- futuro (IA WhatsApp); hoy vacío
  es_test           BOOLEAN DEFAULT FALSE,        -- marca leads de prueba (§6.1)
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_estado ON leads(estado);
CREATE INDEX idx_leads_rubro  ON leads(rubro);
```

---

## 3. Tablas desde ISIS (mock en la demo)

```sql
CREATE TABLE clientes (
  id                 SERIAL PRIMARY KEY,
  isis_id            TEXT UNIQUE,                 -- id en el ERP, clave del UPSERT
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

CREATE TABLE articulos (
  id            SERIAL PRIMARY KEY,
  codigo        TEXT UNIQUE,                      -- clave del UPSERT
  categoria     TEXT,                             -- N1: Bulón, Tuerca, Espárrago, Kit
  subcategoria  TEXT,                             -- N2
  tipo          TEXT,                             -- N3
  descripcion   TEXT,                             -- N4 (variante)
  unidad_medida TEXT DEFAULT 'kg',                -- kg | unidad | kit
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stock (
  id                    SERIAL PRIMARY KEY,
  articulo_codigo       TEXT REFERENCES articulos(codigo),
  kilos_disponibles     REAL DEFAULT 0,
  unidades_disponibles  INTEGER DEFAULT 0,
  estado                TEXT DEFAULT 'Disponible', -- Disponible | Bajo stock | Sin stock
  ubicacion             TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pedidos (
  id                      SERIAL PRIMARY KEY,
  nro_pedido              TEXT UNIQUE,            -- clave del UPSERT
  cliente_isis_id         TEXT REFERENCES clientes(isis_id),
  cliente_nombre          TEXT,                  -- denormalizado para la UI
  fecha_pedido            DATE,
  kilos_total             REAL,
  estado                  TEXT DEFAULT 'En proceso', -- En proceso|Terminado|Facturado|Despachado
  prioridad_armado        TEXT DEFAULT 'Media',  -- Alta|Media|Baja  (lo escribe Martín en NocoDB)
  retira_local            BOOLEAN DEFAULT FALSE,
  nro_factura             TEXT,
  ruta_pdf                TEXT,                  -- ruta del PDF en servidor ISIS (futuro)
  notificado_facturado    BOOLEAN DEFAULT FALSE,
  notificado_despachado   BOOLEAN DEFAULT FALSE,
  notas                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ventas_mensuales (
  id               SERIAL PRIMARY KEY,
  cliente_isis_id  TEXT REFERENCES clientes(isis_id),
  periodo          TEXT,                          -- 'YYYY-MM'
  total_facturado  REAL,
  kilos_vendidos   REAL,
  ticket_promedio  REAL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cliente_isis_id, periodo)
);
```

> **Nota de ownership (resuelve el hueco H2/H3):** `estado` lo manda **ISIS** (se sobrescribe en cada sync).
> `prioridad_armado` y `notas` los escribe **Martín en NocoDB** y la capa de sync NO los pisa (el UPSERT
> excluye esas columnas del `DO UPDATE`). Así no hay conflicto de fuente de verdad.

---

## 4. Scoring de leads (vista, no se persiste)

Reglas portadas del CRM viejo, calibradas a los **rubros reales normalizados**.

```sql
CREATE VIEW leads_scored AS
SELECT l.*,
  LEAST(100,
      CASE
        WHEN lower(l.rubro) ~ '(bulonera|distribuidor|mayorista|industria|agro)' THEN 30
        WHEN lower(l.rubro) ~ '(ferreteria|repuestos|taller)' THEN 18
        ELSE 0
      END
    + CASE WHEN COALESCE(l.empresa,'')   <> '' THEN 10 ELSE 0 END
    + CASE WHEN COALESCE(l.email,'')     <> '' THEN 10 ELSE 0 END
    + CASE WHEN COALESCE(l.telefono,'')  <> '' THEN 10 ELSE 0 END
    + CASE WHEN COALESCE(l.compra_estimada,'') <> '' THEN 20 ELSE 0 END
    + CASE WHEN lower(COALESCE(l.provincia,'')) ~ '(buenos|caba|capital)' THEN 10 ELSE 0 END
  ) AS lead_score
FROM leads l
WHERE l.es_test = FALSE;
```

Clasificación UI: `>= 70` 🔥 hot · `40-69` tibio · `< 40` frío.

> **Hueco H6 (recordatorio de producto):** el score solo ahorra tiempo si hay **política de acción**
> (ej. frío → secuencia automática, no se llama). Eso es decisión comercial, no técnica.

---

## 5. Mapa de normalización de `rubro`

| Slug real en la base | Valor canónico | Score |
|----------------------|----------------|:-----:|
| `bulonera` | Bulonera | +30 |
| `industria/agro` | Industria/Agro | +30 |
| `casa_de_repuestos` | Casa de repuestos | +18 |
| `particular` | Particular | 0 |
| (vacío) | Sin definir | 0 |
| `<test lead...>` | — (se marca `es_test=TRUE`) | excluido |

---

## 6. Reglas de limpieza en la migración (236 leads reales)

1. **Leads de test:** las 3 filas con `rubro` = `<test lead...>` → `es_test = TRUE` (excluidas de KPIs/score/demo).
2. **Rubro:** aplicar el mapa de §5.
3. **Estado:** se preservan los valores reales `Nuevo`, `Sin contactar`, `Esperando rta`, `En seguimiento`, `Contactado`. Se agregan al enum `Cerrado` y `Perdido` para el futuro. (No hay cierres aún → la "tasa de cierre" en la demo es 0% real; **no inventar**.)
4. **Vendedor:** valores que son fechas (`14/04/26`, `06/04/26`) → `NULL`. Válidos: Carlos, Diego, Angel.
5. **Dolor contaminado:** si `dolor` coincide con un nombre de vendedor (Carlos/Diego/Angel) → `NULL` (era ruido de una migración vieja).
6. **`fecha` → `fecha_ingreso`:** parsear `DD/MM/YYYY H:MM` a `TIMESTAMPTZ`.
7. **`contactado` / `venta_concretada`:** texto `'Si'` → `TRUE`, resto → `FALSE`.
8. **Teléfono:** dejar solo dígitos (ya viene casi limpio, ej. `549114...`).

---

## 7. Capa ISIS (adapter modular)

El sistema **nunca consulta ISIS directo**. Consume un **contrato API JSON normalizada**:

```
GET /isis/pedidos      → [{ nro_pedido, cliente_isis_id, cliente_nombre, fecha_pedido,
                            kilos_total, estado, retira_local, nro_factura, ruta_pdf }]
GET /isis/clientes     → [{ isis_id, nombre, cuit, rubro, provincia, localidad, telefono, email }]
GET /isis/articulos    → [{ codigo, categoria, subcategoria, tipo, descripcion, unidad_medida }]
GET /isis/stock        → [{ articulo_codigo, kilos_disponibles, unidades_disponibles, estado, ubicacion }]
GET /isis/ventas       → [{ cliente_isis_id, periodo, total_facturado, kilos_vendidos, ticket_promedio }]
```

- **Demo:** `MockProvider` (servicio `mock-isis-api`) sirve este contrato con los datos mock.
- **Producción:** `IsisProvider` implementa el mismo contrato contra la API real de ISIS.
- **Futuro:** si se reemplaza ISIS, se cambia el provider sin tocar el resto.
- La capa de sync (n8n) llama el contrato cada N min y hace **UPSERT** por la clave natural
  (`nro_pedido`, `isis_id`, `codigo`, `(cliente_isis_id, periodo)`), preservando las columnas
  editadas por el equipo (ver nota de ownership en §3).
