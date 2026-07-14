# Estructura de Bases de Datos — Baigorria Industrial
## Cómo se relacionan todas las fuentes de datos

---

## 1. Las 7 fuentes de datos

Según la reunión del 28/05, Baigorria maneja 7 bases distintas:

| # | Base | Dueño / Ubicación | Qué contiene | Actualmente en CRM |
|---|------|-------------------|-------------|:------------------:|
| **A** | **ERP ISIS** | Servidor local Windows | Facturación, pedidos, clientes, stock, artículos, contabilidad (AFIP, IIBB) | NO — pendiente acceso |
| **B** | **Drive de pedidos** | Google Sheets (Martín) | Vista reducida de pedidos para interacción ventas-logística: nro pedido, cliente, fecha, kilos, prioridad, estado | NO — pendiente |
| **C** | **Base de ventas** | Base de Ivo | Venta mensual al detalle: artículo × artículo, cliente × cliente, unidades, kilos, precios, costos, geolocalización | NO — pendiente |
| **D** | **Leads (Meta/Google)** | CRM actual | 236 leads captados de campañas | SI — ya existe |
| **E** | **Base de clientes** | ERP ISIS | Provincia, localidad, datos de contacto. Pivotea con ventas. | NO — simulado |
| **F** | **Base de tipo de cambio** | Banco Central / Ivo | Cotización diaria | NO — Fase 3 |
| **G** | **Base de jerarquía de artículos** | ERP ISIS | 4 niveles: Categoría → Subcategoría → Tipo → Variante | NO — simulado |

---

## 2. Qué datos viven en cada base

### A — ERP ISIS (servidor local Windows)

Es la base maestra de la operación. Contiene:

```
ERP ISIS
├── Pedidos
│   ├── nro_pedido
│   ├── cliente_id → Clientes
│   ├── fecha_pedido
│   ├── articulos (ítems del pedido)
│   ├── kilos_total
│   ├── estado (En proceso / Terminado / Facturado / Despachado)
│   ├── retira_local (Si/No)
│   ├── nro_factura (cuando se factura)
│   └── ruta_pdf (donde se guarda la factura en el servidor local)
│
├── Clientes
│   ├── id
│   ├── nombre / razón social
│   ├── CUIT
│   ├── provincia
│   ├── localidad
│   ├── teléfono
│   └── email
│
├── Artículos (jerarquía 4 niveles)
│   ├── código
│   ├── categoría (Bulón, Tuerca, Espárrago...)
│   ├── subcategoría (Bulón de masa, Bulón de rueda...)
│   ├── tipo (Liviano, Pesado, Standard, Reforzado...)
│   ├── variante específica (12x1.50 cincado...)
│   └── unidad_medida (kg / unidad)
│
├── Stock (agregado por nivel 2 o 3, NO por SKU)
│   ├── artículo_id
│   ├── kilos_disponibles
│   ├── unidades_disponibles
│   └── estado (Disponible / Bajo stock / Sin stock)
│
├── Facturación
│   ├── nro_factura
│   ├── pedido_id
│   ├── cliente_id
│   ├── fecha
│   ├── monto_total
│   └── archivo_pdf (ruta en servidor local)
│
└── Contable (NO se toca en este sistema)
    ├── AFIP
    ├── Ingresos Brutos
    └── Fórmulas de producción
```

### B — Drive de pedidos (Google Sheets, Martín)

Es una **vista reducida** que se nutre automáticamente del ERP con un query. Solo tiene lo que ventas y logística necesitan para interactuar:

```
Drive "Pedidos"
├── nro_pedido
├── cliente (nombre)
├── fecha_pedido
├── kilos_total
├── estado (En proceso / Terminado / Facturado / Despachado)
├── prioridad_armado (Alta / Media / Baja)  ← la asigna logística A MANO
└── retira_local (Si / No)
```

**No tiene datos de costos, precios ni facturación.** Eso lo ve solo administración.

### C — Base de ventas (Ivo)

Trackea toda la venta al detalle. Es la más completa:

```
Base de Ventas (Ivo)
├── Período (mensual)
├── Artículo (código / descripción)
├── Cliente (nombre)
├── País / Código de país
├── Geolocalización
├── Unidades vendidas
├── Kilos vendidos
├── Precio de venta
├── Venta total
├── Costo de material
├── Costo de tratamiento
├── Caja (margen)
├── Precio en dólares
├── Costo en dólares
├── Lista de precios (online / offline)
├── Canal de venta
├── Objetivo mercado interno
└── Objetivo mercado externo
```

---

## 3. Cómo se relacionan entre sí

```
                    ┌──────────────────┐
                    │   ERP ISIS (A)   │
                    │  Servidor local  │
                    └───┬──────┬───────┘
                        │      │
           query SQL    │      │  query SQL
           (vista       │      │  (vista
           reducida)    │      │  clientes,
                        │      │  artículos,
                        ▼      │  stock)
              ┌───────────┐    │
              │  Drive    │    │
              │  Sheets   │    │
              │  (B)      │    │
              │  Martín   │    │
              └───────────┘    │
                               │
    ┌─────────────────┐        │        ┌──────────────────┐
    │  Base de Ventas │        │        │  Meta / Google   │
    │  (C) Ivo        │        │        │  Leads (D)       │
    └────────┬────────┘        │        └────────┬─────────┘
             │                 │                 │
             │     ┌───────────┴───────────┐     │
             │     │                       │     │
             ▼     ▼                       ▼     ▼
        ┌──────────────────────────────────────────┐
        │          CRM UNIFICADO                   │
        │          (PostgreSQL)                    │
        │                                          │
        │  leads      ← de Meta/Google (D)        │
        │  pedidos    ← de ERP ISIS (A)            │
        │  clientes   ← de ERP ISIS (A)            │
        │  articulos  ← de ERP ISIS (A)            │
        │  stock      ← de ERP ISIS (A)            │
        │  ventas     ← de Base Ivo (C)            │
        │  prioridad  ← de Drive Sheets (B)        │
        │                                          │
        └──────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  NocoDB / CRM    │
                  │  (interfaz)      │
                  │  Florencia y     │
                  │  Martín lo ven   │
                  └──────────────────┘
```

---

## 4. El flujo real de datos

### 4.1 ¿Quién escribe qué?

| Dato | Lo escribe | Dónde se origina |
|------|-----------|-----------------|
| Pedido nuevo | ERP ISIS | El vendedor carga el pedido en ISIS |
| Estado del pedido | ERP ISIS | Cambia cuando facturación emite factura o logística arma |
| Factura PDF | ERP ISIS | Se genera al facturar, se guarda local |
| Prioridad de armado | **Martín (logística)** | La asigna en el Drive o en el CRM |
| "Retira por local" | ERP ISIS | Se marca al crear el pedido |
| Datos del cliente | ERP ISIS | Se cargan una sola vez |
| Stock agregado | ERP ISIS | Se actualiza con cada movimiento |
| Ventas mensuales | **Base de Ivo** | Cálculo mensual offline |
| Leads | Meta/Google Ads | Automático vía webhook |
| Calificación del lead | **IA (Claude) + vendedor** | El bot de WhatsApp califica; el vendedor ajusta |

### 4.2 ¿Quién lee qué?

| Persona | Necesita ver | De qué base viene |
|---------|-------------|------------------|
| **Florencia** (ventas) | Leads nuevos, pedidos activos, estados, notificaciones | Leads (D) + Pedidos (A) |
| **Martín** (logística) | Pedidos con prioridad, kilos, estado de armado | Pedidos (A) + Drive (B) |
| **Administración** | Facturación, costos, contabilidad | ERP ISIS (A) — NO en este sistema |

---

## 5. La arquitectura de sync

Cada base externa tiene su propio script de sincronización:

```
cron cada 5 min
     │
     ├── sync-isis-pedidos.py   →  Lee vista de pedidos del ERP
     │                            → UPSERT en tabla pedidos del CRM
     │
     ├── sync-isis-clientes.py  →  Lee vista de clientes del ERP
     │                            → UPSERT en tabla clientes del CRM
     │
     ├── sync-isis-stock.py     →  Lee vista de stock del ERP
     │                            → UPSERT en tabla stock del CRM
     │
     ├── sync-drive.py          →  Lee Google Sheets de Martín
     │                            → UPSERT prioridad_armado en pedidos
     │
     └── sync-ventas.py         →  Lee base de Ivo
                                  → UPSERT en tabla ventas_mensuales
```

### Principio clave: idempotencia

Todos los sync usan **UPSERT** (INSERT ... ON CONFLICT DO UPDATE). Si un registro ya existe, se actualiza; si no, se inserta. No se crean duplicados aunque el script corra 100 veces.

### Separación clara

| Capa | Tecnología | Responsabilidad |
|------|-----------|----------------|
| **Fuentes** | ISIS, Sheets, base Ivo | Generan los datos |
| **Sync** | Scripts Python cada 5 min | Transportan los datos |
| **Destino** | PostgreSQL (o SQLite en dev) | Almacena todo en un solo lugar |
| **UI** | NocoDB / CRM custom | Muestra los datos — solo lectura |

---

## 6. Hoy vs Mañana

| Tabla | Hoy (demo) | Mañana (producción) |
|-------|-----------|-------------------|
| `leads` | 236 leads reales | Sigue igual (ya viene de Meta) |
| `pedidos` | 5 pedidos fake en SQLite | Sync desde vista ISIS → PostgreSQL |
| `clientes` | 12 clientes fake en SQLite | Sync desde vista ISIS → PostgreSQL |
| `articulos` | 15 artículos fake en SQLite | Sync desde vista ISIS → PostgreSQL |
| `stock` | 15 registros fake en SQLite | Sync desde vista ISIS → PostgreSQL |
| `ventas_mensuales` | 30 registros fake en SQLite | Sync desde base de Ivo → PostgreSQL |

**La interfaz no cambia.** Solo cambia de dónde vienen los datos. El CRM lee de la misma tabla, venga de un seed SQLite o de un sync de ISIS.
