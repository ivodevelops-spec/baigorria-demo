# CONOCIMIENTO BASE — Baigorria Industrial

> Documento madre con todo el conocimiento de dominio ordenado.
> Fuente consolidada de: AGENTS.md, MODELO-DATOS.md, PROYECTO.md, puntos-reunion-28-mayo-2026.md, ARCHITECTURE.md, estructura-bases-de-datos.md, explicacion-para-baigorria.md, PRESENTACION-PROYECTO.md, ESTADO.md, DECISIONES.md, mock-isis-api/data/articulos.json, db/init/01-schema.sql, scripts/gen-leads-seed.mjs.
> Fecha: 2026-06-29.

---

## 1. Qué fabrica Baigorria

Baigorria Industrial fabrica **bulones, espárragos** y **kits de seguridad** para bulonería.

| Categoría | Descripción |
|-----------|-------------|
| **Bulón** | Tornillo de sujeción con cabeza (hexagonal, etc.) y vástago roscado. Se usa con tuerca en el otro extremo. |
| **Espárrago** | Vástago roscado en ambos extremos, sin cabeza. Se enrosca en la pieza. Lleva tuerca del otro lado. |
| **Kit** | Juego de bulones/espárragos + tuercas para un vehículo o aplicación específica. |
| Tuerca | Se fabrica pero es complementaria. No es foco de búsqueda/leads. |

### Jerarquía de artículos (4 niveles)

```
Nivel 1: Categoría       → Bulón, Espárrago, Kit
Nivel 2: Subcategoría    → Bulón de rueda, Bulón de masa, Espárrago competición, etc.
Nivel 3: Tipo            → Liviano, Pesado, Standard, Reforzado, Doble cono, etc.
Nivel 4: Variante        → 12x1.50 zincado, 14x1.50 cincado, etc.
```

### Catálogo completo de subcategorías

| Categoría | Subcategoría | Tipos |
|-----------|-------------|-------|
| Bulón | Bulón de rueda | Liviano, Pesado |
| Bulón | Bulón de masa | Standard, Reforzado |
| Bulón | Bulón agricola | Standard, Reforzado |
| Espárrago | Espárrago competición | Doble cono, Tuerca alta |
| Espárrago | Espárrago industrial | Hexagonal, Cuadrado |
| Espárrago | Espárrago UTE | Standard |
| Tuerca | Tuerca rueda | Standard, Seguridad |
| Tuerca | Tuerca especial | Doble cono |
| Kit | Kit seguridad | Completo |

---

## 2. Keywords de búsqueda y términos de producto

> Estos términos representan cómo **los clientes buscan** los productos de Baigorria.
> Útiles para: clasificación de leads entrantes, campañas de ads, chatbot de WhatsApp, y detección de intención de compra.
> **Tuerca** queda excluida de las keywords de captura/clasificación (el foco comercial está en bulones y espárragos).

### 2.1 Genéricos de producto

```
bulón, bulones, bulón de rueda, bulón de masa, bulón rueda, bulón masa,
espárrago, espárragos, espárrago de rueda, espárrago competición, espárrago deportivo,
kit de bulones, kit de seguridad, bulonería, tornillo de rueda,
bulón para auto, bulón para camioneta, bulón automotor, bulón repuesto,
espárrago para auto, espárrago para camioneta, espárrago automotor,
medida de bulón, rosca de bulón, bulón 12x1.50, bulón 14x1.50
```

### 2.2 Automotor liviano — autos populares (Argentina)

> Formato: "bulón [marca/modelo]", "espárrago [marca/modelo]", "bulón de rueda [marca/modelo]"

| Marca | Modelos populares |
|-------|------------------|
| **Chevrolet** | Corsa, Classic, Onix, Prisma, Aveo, Cruze, Agile, Celta |
| **Peugeot** | 208, 308, 207 Compact, 206, 307, 408, Partner |
| **Volkswagen** | Gol, Fox, Suran, Voyage, Bora, Vento, Up, Polo |
| **Renault** | Clio, Sandero, Logan, Kangoo, Kwid, Megane, Fluence |
| **Fiat** | Palio, Cronos, Siena, Uno, Mobi, Argo, Strada, Fiorino |
| **Ford** | Ka, Fiesta, Focus, EcoSport, Ka+ |
| **Toyota** | Etios, Corolla, Yaris |
| **Citroën** | C3, C4, Berlingo, C-Elysee |
| **Otros** | Chery QQ, Lifan 320 |

### 2.3 Automotor pesado / camionetas populares (Argentina)

| Marca | Modelos populares |
|-------|------------------|
| **Toyota** | Hilux, SW4 |
| **Ford** | Ranger, F-100 |
| **Volkswagen** | Amarok |
| **Chevrolet** | S10, Trailblazer |
| **Nissan** | Frontier, Navara |
| **Renault** | Duster Oroch, Alaskan |
| **Fiat** | Toro |
| **RAM** | 1500, 2500 |

### 2.4 Términos combinados de alto tráfico

```
bulón Peugeot 208, bulón Peugeot 308, bulón Peugeot 207, bulón Peugeot 206,
bulón Corsa, bulón rueda Corsa, bulón Classic, bulón Chevrolet Corsa,
bulón Gol, bulón VW Gol, bulón rueda Gol, bulón rueda Gol Trend,
bulón Fiat Palio, bulón Sandero, bulón Renault Clio, bulón Ford Ka,
bulón Hilux, bulón rueda Hilux, bulón Toyota Hilux,
bulón Ranger, bulón rueda Ranger, bulón Ford Ranger,
bulón Amarok, bulón rueda Amarok, bulón S10, bulón Frontier,
espárrago Corsa, espárrago Gol, espárrago Peugeot,
espárrago Hilux, espárrago Ranger, espárrago Amarok,
bulón 4x4, bulón rueda 4x4, bulón camioneta 4x4,
repuestos bulonería, bulonería automotor, bulonería auto,
venta de bulones, fábrica de bulones, bulones por mayor
```

### 2.5 Contextos fuera de automotor

```
bulón agricola, bulón para maquinaria agricola, bulón sembradora, bulón tractor,
espárrago agricola, espárrago tractor,
bulón grado 5, bulón grado 8, bulón reforzado,
bulón cincado, bulón zincado, bulón galvanizado,
bulón industrial, espárrago industrial, bulonería industrial,
bulón UTE, espárrago UTE, tornillería industrial,
kit seguridad bulonería, kit 12 medidas, bulones seguridad,
competición, deportivo, doble cono, espárrago competición
```

---

## 3. Clientes y rubros

### ¿Quién compra los productos de Baigorria?

| Prioridad | Rubro | Score base | Descripción |
|:---------:|-------|:----------:|-------------|
| **1** | Bulonera | +30 | Principal target. Revendedores especializados en bulonería. |
| **2** | Distribuidor | +30 | Distribuidores mayoristas de ferretería industrial. |
| **3** | Mayorista | +30 | Grandes compradores industriales. |
| **4** | Industria/Agro | +30 | Fábricas que consumen bulonería como insumo. |
| **5** | Casa de repuestos | +18 | Repuesteras de automotor (autos, camionetas, camiones). |
| **6** | Ferretería | +18 | Ferreterías de barrio o industriales. |
| **7** | Taller | +18 | Talleres mecánicos, de chapa y pintura. |
| **8** | Gomería | 0 | Baja prioridad, compra volúmenes chicos. |
| **9** | Particular | 0 | Consumidor final. Generalmente no califica. |

---

## 4. Scoring de leads

> El score es una vista SQL (`leads_scored`) — no se persiste, se recalcula al vuelo.

```sql
Score = rubro (max 30) + empresa (10) + email (10) + teléfono (10) + compra_estimada (20) + provincia (10)
```

| Puntaje | Clasificación | Acción recomendada |
|:-------:|:------------:|-------------------|
| 70–100 | Hot | Llamar en < 2 horas |
| 40–69 | Tibio | Llamar en < 24 horas |
| 0–39 | Frío | Contactar si hay disponibilidad |

**Bonus de provincia:** Buenos Aires, CABA, Capital Federal → +10 puntos.

**Leads de test:** marcados con `es_test = TRUE`, excluidos de KPIs y scoring.

---

## 5. Estados de un pedido

```
En proceso → Terminado → Facturado → Despachado
```

| Estado | Significado | Quién lo cambia |
|--------|------------|-----------------|
| En proceso | Se está armando en el depósito | ISIS / Logística |
| Terminado | Armado completo, esperando facturación | Logística |
| Facturado | Factura emitida, listo para despacho | Administración (ISIS) |
| Despachado | Enviado al cliente | Administración (ISIS) |

- **Retira por local:** el cliente viene a buscarlo → no se despacha.
- **Prioridad de armado:** Alta / Media / Baja → la asigna Martín (logística). No la pisa ISIS.

---

## 6. Roles y permisos

| Rol | Quiénes | Ve | NO ve |
|-----|---------|----|-------|
| **ventas** | Florencia, Martín, equipo comercial | Leads, pedidos, clientes, stock, ventas, facturación | — |
| **logistica** | Equipo de expedición (2 usuarios) | Pedidos (con prioridad), stock, clientes | Facturación (nro_factura, ventas, montos) |
| **admin** | Ivo | Todo | — |

**Regla de negocio clave:** El equipo de logística (expedición) no debe ver datos de facturación — pedido explícito de Florencia (C#64 de la reunión del 28/05).

---

## 7. Geografía relevante

Provincias con mayor densidad de leads y clientes en la base real (236 leads):

- **Buenos Aires** — mayor volumen, +10 bonus en scoring
- **CABA** — alta densidad, +10 bonus
- Córdoba, Santa Fe, Entre Ríos, Mendoza, Tucumán, Chaco, Corrientes, Salta, Neuquén

---

## 8. Fuentes de datos

| Fuente | Origen | Tabla(s) en Postgres |
|--------|--------|---------------------|
| Meta/Google Ads | Webhook → n8n | `leads` |
| ERP ISIS (adapter) | Polling cada 5 min | `clientes`, `articulos`, `stock`, `pedidos` |
| Base de ventas (Ivo) | Sync manual/periódico | `ventas_mensuales` |
| Drive de pedidos (Martín) | Google Sheets | `pedidos.prioridad_armado`, `pedidos.notas` |

> **ISIS es una capa modular y reemplazable** (patrón adapter). El sistema nunca habla con ISIS directo: consume un contrato API JSON normalizado. Si se cambia de ERP, se cambia esa capa y el resto sigue igual.

---

## 9. Stack tecnológico (resumen)

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + Tailwind v4 + Recharts (#004C97) |
| Backend | Node + Express + pg |
| Base de datos | PostgreSQL 16 |
| Automatización | n8n |
| WhatsApp | Evolution API |
| Email | Listmonk (a futuro) |
| ERP (demo) | mock-isis-api |
| Reverse proxy | Caddy |

---

## 10. Glosario rápido

| Término | Significado |
|---------|------------|
| **Bulón** | Tornillo con cabeza y vástago roscado. Se usa con tuerca. |
| **Espárrago** | Vástago roscado en ambos extremos. Se enrosca en la pieza y se ajusta con tuerca. |
| **Bulón de rueda** | Bulón que fija la rueda al cubo/masa del vehículo. |
| **Bulón de masa** | Bulón que fija la masa/cubo al chasis. |
| **Bulón agricola** | Bulón para maquinaria agrícola (medidas en pulgadas). |
| **Doble cono** | Tipo de espárrago con forma cónica en ambos extremos. Usado en competición. |
| **Cincado / Zincado** | Tratamiento anticorrosivo superficial. |
| **Galvanizado** | Tratamiento anticorrosivo más pesado (para exterior). |
| **Grado 5 / Grado 8** | Clasificación de resistencia del bulón (norma SAE). |
| **Medida** | Formato diámetro × paso de rosca (ej. 12x1.50 = 12 mm diámetro, 1.50 mm paso). |
| **Kit de seguridad** | Juego de bulones/espárragos antirrobo. |
