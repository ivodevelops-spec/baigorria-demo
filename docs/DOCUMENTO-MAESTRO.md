# DOCUMENTO-MAESTRO — Baigorria Industrial *(cliente #1 de la Agencia)*

> **Propósito:** documento de referencia del proyecto. El código, las entregas y las decisiones se derivan de acá. Ante cualquier duda de rumbo, volver a este documento. Las decisiones y su porqué viven en `REGISTRO-DECISIONES.md`.
> **Estado:** entregable. Nivel 1 (Panel de Control) ✅ aceptado; arrancando Nivel 2 (Rediseño de la Restricción).
> **Actualizado:** 2026-07-09.

---

## 1. Ficha del cliente

| Campo | Valor |
|---|---|
| Empresa | Baigorria Industrial |
| Rubro | Fábrica de bulones, tuercas, espárragos |
| Geografía | Villa Mercedes, San Luis, Argentina |
| Contactos | **Florencia** (ventas) · **Martín** (gerencia) |
| Tamaño | Pyme industrial con operación establecida |
| ERP | **ISIS** (servidor local Windows) |
| Dato clave | Corren campañas de **Meta/Google Ads** que generan leads entrantes |
| Modalidad comercial | Cliente puntual. Precio: **USD 800** llave en mano (50% al inicio, 50% al entregar) |
| Dev | Ivo Paolantonio + Ruffo |
| Referente de entrega | Ivo Paolantonio |

---

## 2. Diagnóstico: lo que encontramos

### 2.1 El dolor de la operación (reunión 28/05/2026)

- **Mandar facturas a mano** a cada cliente (tiempo del vendedor).
- **Copiar pedidos del ERP a un Excel** para que Martín sepa qué armar.
- **Responder leads que no aplican** al negocio (sin clasificación).
- **Nadie ve el estado de las cosas** sin preguntarle a alguien.

El "para qué" de fondo: **vender más y cobrar antes** (cash flow). Florencia quiere estar en la calle vendiendo, no en tareas operativas.

### 2.2 Mapa de la operación (actual — antes)

```
Meta/Google Ads ─► leads entrantes (sin captura automática)
ERP ISIS ─► pedidos (Martín los copia manual a un Excel)
         ─► facturas PDF (Florencia las manda una por una por WhatsApp)
         ─► stock (no visible sin entrar al ERP)

Todo pegado con: una persona + Excel + WhatsApp manual.
```

### 2.3 Restricción actual (Goldratt)

> **Los datos no circulan.** Los pedidos no entran solos al tablero, las notificaciones no salen solas. Cada movimiento requiere que una persona haga algo manual. **Esa es la restricción #1.**

---

## 3. Posición en la escalera de la Agencia

La Agencia define 4 niveles de entrega (Diagnóstico → Panel de Control → Rediseño de la Restricción → Sistema Operativo):

| Nivel | Servicio | Estado |
|:---:|---|---|
| 0 | **Diagnóstico Operativo** | ✅ Hecho (implícito en la reunión del 28/05 y la demo) |
| 1 | **Panel de Control** | ✅ **Entregado y aceptado** — Dashboard + Leads + Pedidos + Clientes + Stock + Ventas funcionando localmente con mock-ISIS |
| 2 | **Rediseño de la Restricción** | ⏳ **En curso** — Automatizaciones n8n, integración ISIS real, WhatsApp, deploy persistente |
| 3 | **Sistema Operativo / Retainer** | ⬜ Pendiente — Mantenimiento, cadencia de métricas, próxima restricción |

**Lógica de la escalera:** el Nivel 1 generó la confianza (panel tangible, todo visible). Ahora el Nivel 2 es el trabajo pesado: eliminar el trabajo manual. El Nivel 3 es la recurrencia.

---

## 4. Transformación (antes → después)

| Dimensión | ANTES | DESPUÉS |
|---|---|---|
| **Pedidos** | Martín copia de ISIS a un Excel; asigna prioridad de cabeza | Pedidos aparecen solos en el tablero; prioridad con un clic; historia visible |
| **Leads** | Entran sin clasificar; Florencia responde a mano incluso los que no aplican | Captura automática, clasificados por score, solo los que aplican llegan al vendedor |
| **Facturas** | Florencia busca cada PDF y lo manda por WhatsApp uno a uno | El sistema busca el PDF y lo manda solo al cambiar a "Facturado" |
| **Estados** | El cliente llama para preguntar; Florencia busca en el ERP | Aviso automático por WhatsApp: "Tu pedido fue facturado / despachado" |
| **Visibilidad** | Nadie ve nada sin preguntarle a alguien | Dashboard con KPIs, funnel de leads, pedidos activos, facturación — cada rol ve lo suyo |
| **Dependencia** | Todo depende de que Florencia o Martín estén encima | El sistema corre solo; las personas supervisan y venden |

### Métricas objetivo del caso (a capturar en go-live)

- **Horas/día recuperadas** por Florencia (tareas operativas → cero).
- **Tiempo desde pedido cargado en ISIS hasta que aparece en el tablero** (target: < 5 min).
- **Tasa de respuesta a leads** (hoy: manual y lenta; target: respuesta automática + follow-up a 24h/72h).
- **% de facturas enviadas automáticamente** (target: 100% de las que tienen PDF en la ruta de ISIS).

---

## 5. Alcance de la solución

### 5.1 Módulos (Panel de Control — Nivel 1 ✅)

| Módulo | Para quién | Función |
|---|---|---|
| **Inicio / Dashboard** | Todos | KPIs, funnel de leads, pedidos activos, facturación — de un vistazo |
| **Leads** | Ventas | Leads clasificados por score, filtros, seguimiento, estado editable |
| **Pedidos** | Ventas + Logística | Pedidos con prioridad de armado editable, estados, filtro por cliente/estado |
| **Clientes** | Ventas | Ficha con datos (nombre, CUIT, provincia, localidad, teléfono, email) |
| **Stock** | Todos | Disponibilidad por tipo de artículo |
| **Ventas** | Ventas / Admin | Facturación mensual por cliente |

### 5.2 Automatizaciones (Nivel 2 — en curso)

| Automatización | Qué hace | Estado |
|---|---|---|
| **Sync ISIS → tablero** | Pedidos cargados en ISIS aparecen solos (n8n poll o push) | ⏳ mock andando; falta real |
| **Captura de leads** | Lead de Meta/Google entra, se clasifica, avisa al vendedor | ⏳ |
| **Aviso de estado por WhatsApp** | "Tu pedido fue facturado / despachado" al cliente | ⏳ |
| **Factura PDF por WhatsApp** | Busca el PDF y lo manda al cliente automáticamente | ⏳ |
| **Seguimiento de leads** | Recordatorio a leads que no respondieron (24h / 72h) | ⏳ |
| **Reporte semanal** | Resumen de la semana por email | ⏳ |

---

## 6. Stack y arquitectura técnica

### Stack canónico

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | **React + Vite + Tailwind v4 + Recharts** | `web/` · branded azul **#004C97** |
| Backend/API | **Node + Express + pg** | `api/` · auth JWT + roles |
| Base de datos | **PostgreSQL 16** | Modelo canónico en `MODELO-DATOS.md` |
| Automatización | **n8n** | Captura leads, sync ISIS, notificaciones, reportes |
| WhatsApp | **Evolution API** | (NO Cloud API directo) |
| Email | **Listmonk** | Feature futura |
| ERP (mock) | **mock-isis-api** | `mock-isis-api/` · simula la capa ISIS en dev/demo |
| Reverse proxy | **Caddy** | En deploy productivo |
| Dev/deploy | **Docker / docker-compose** | Infra local; deploy VPS |
| Demo pública | **cloudflared** (túnel gratis) | URLs temporales |

### Arquitectura

```
Meta/Google Ads ─┐
                 ▼
ERP ISIS ─► [ capa adapter modular ] ─► PostgreSQL ─► API (Express) ─► Web (React)
   (mock-isis-api en dev)               ▲
                                        └── n8n (automatizaciones) ──► WhatsApp / Email
```

- **ISIS = capa externa, modular y reemplazable** (patrón adapter). El sistema nunca habla con ISIS directo; consume un contrato API normalizado (`MODELO-DATOS.md §7`). En dev/demo lo sirve `mock-isis-api`; en prod, el ISIS real; a futuro, su reemplazo — sin tocar el resto.
- **Roles:** `ventas` (equipo comercial, ve todo), `logistica` (expedición, sin facturación ni precios), `admin` (gerencia, ve todo).

### No usar nunca

- **NocoDB** — descartado (licencia Enterprise gatea roles por columna y branding).
- **TypeScript** — JavaScript plano, sin excepciones.

---

## 7. Roles y reglas de negocio

| Rol | Quiénes | Ve facturación | Acceso |
|---|---|---|---|---|
| `ventas` | Florencia, Martín, equipo comercial | ✅ Sí | Leads, Clientes, Pedidos, Stock, Ventas — TODO |
| `logistica` | Equipo de expedición (2 usuarios) | ❌ No | Pedidos, Stock, Clientes (solo lectura). No ve `nro_factura`, Ventas, ni montos (403). |
| `admin` | Ivo | ✅ Sí | TODO |

### Reglas del dominio (de `CONOCIMIENTO-BASE.md`)

- **Estados de pedido:** En proceso → Terminado → Facturado → Despachado. "Retira por local" = no se despacha.
- **Jerarquía de artículos:** 4 niveles (Categoría → Subcategoría → Tipo → Variante). Stock agregado por nivel, no por SKU.
- **Clientes target de Baigorria:** buloneras (principal), casas de repuestos, ferreterías, distribuidores.
- **Leads: IN** captura/orden/calificación de los que ya entran por Meta/Google. **OUT** generación de demanda (no es el foco).

---

## 8. Reglas de oro (no-negociables)

- **R1 — El equipo NO toca la base de datos.** Todo vía la UI web. Si requiere SQL, no es la solución.
- **R2 — Data ownership.** Datos exportables; PDFs de factura nunca se almacenan (se leen, envían, descartan); credenciales en variables de entorno, nunca en código.
- **R3 — MVP first.** Lo mínimo que resuelva el problema. Si se puede con un workflow de n8n, no se hace con código.
- **R4 — Cliente puntual.** No sobre-invertir en multi-tenant/replicabilidad; pragmático para cerrar este cliente.
- **R5 — Notificaciones proactivas.** Canal primario WhatsApp (Evolution API), respaldo email.

---

## 9. Plan de ejecución (por restricciones)

> Ordenado por Goldratt: atacamos **una restricción a la vez**, empezando por la que destraba todo lo demás.

| Fase | Restricción a atacar | Entregable | Depende de | Estado |
|:---:|---|-----------|:---:|---|
| 0 | **Demo funcional** | Tablero con leads reales + mock-ISIS | — | ✅ Listo |
| 1 | **Sistema vivo (deploy)** | VPS + dominio + accesos del equipo | VPS + dominio | ⏳ |
| 2 | **Datos entran solos** | n8n live-sync: mock → UI ("el pedido aparece solo") | mock-ISIS | ⏳ |
| 3 | **Integración ISIS real** | Pedidos/clientes/stock reales desde ISIS | Proveedor ISIS | 🔒 Bloqueado |
| 4 | **Notificaciones salen solas** | WhatsApp (avisos + factura PDF) | Evolution API + nro WhatsApp Business | ⏳ |
| 5 | **Leads solos** | Captura Meta + clasificación + seguimiento | Acceso Meta Ads | ⏳ |
| 6 | **Capacitación + Go-live** | Equipo entrenado, sistema en producción | Todo lo anterior | ⬜ |

**🔒 Bloqueo principal:** la integración ISIS real (Fase 3) depende del proveedor de ISIS. Cuanto antes se gestione ese acceso, antes avanza. **Acción pendiente del cliente:** gestionar contacto con el proveedor.

---

## 10. Métricas del caso insignia *(para la Agencia)*

> El maestro de la Agencia (§3.5, §7) exige que cada caso deje un antes/después **medido**. Estas son las métricas objetivo para cuando Baigorria esté en producción.

| Métrica | Cómo se mide | Target |
|---|---|---|
| Horas/día recuperadas por Florencia | Encuesta post go-live + estimación de tareas automatizadas | ≥ 2 hs/día |
| Latencia pedido ISIS → tablero | Timestamp de llegada al endpoint menos timestamp de ISIS | < 5 min |
| Facturas enviadas automáticamente | Conteo de facturas con PDF detectado vs. enviadas | 100% de las detectadas |
| Leads calificados automáticamente | Leads entrantes con score asignado vs. total | 100% de los entrantes |
| Tiempo hasta respuesta al lead | Timestamp de lead creado vs. primer contacto automático | < 5 min |

> **Acción pendiente (dueño: dev):** capturar estas métricas efectivas en go-live. Son la materia prima del caso insignia.

---

## Apéndice A: Estructura del repo

```
baigorria/
├── AGENTS.md                  # puntero corto + convenciones no-negociables
├── opencode.json              # config opencode (model + instructions)
├── .opencode/                 # agentes (plan/executor/reviewer) + commands
├── docker-compose.yml         # infra dev: Postgres + n8n + mock-isis-api
├── api/                       # Express + pg + auth/roles
├── web/                       # React + Vite + Tailwind
├── mock-isis-api/             # mock del ERP (contrato adapter)
├── db/
│   ├── init/                  # schema Postgres (00-databases, 01-schema)
│   └── migrations/            # seeds (gitignored, PII)
├── scripts/                   # generadores, serve-deck, etc.
├── presentacion/              # deck HTML para el cliente (PII gitignored)
├── docs/
│   ├── playbooks/             # 00-como-trabajamos + sesion-entrega + sesion-planificacion
│   ├── DOCUMENTO-MAESTRO.md   # ← este archivo (el norte)
│   ├── REGISTRO-DECISIONES.md # ← bitácora de decisiones
│   ├── ESTADO.md              # ← foto de entrega + próxima acción
│   ├── CONOCIMIENTO-BASE.md   # dominio de negocio del cliente
│   ├── motor-de-entrega.md    # agentes como palanca IA
│   ├── MODELO-DATOS.md        # esquema canónico + contrato ISIS
│   └── PRESENTACION-PROYECTO.md / otros
└── crm/leads.db               # datos reales (gitignored)
```

## Apéndice B: Cómo levantar (local, Windows)

```
# 1. Infra
docker compose up -d
# 2. API
cd api && npm install && node server.js          # :3001
# 3. Web
cd web && npm install && npm run dev             # :5173
# 4. (Demo) túnel
cloudflared tunnel --url http://localhost:5173
```

## Apéndice C: Accesos (dev, temporales)

| Usuario | Rol | Password |
|---|---|---|
| ventas | ventas | ventas123 |
| logistica | logistica | logistica123 |
| admin | admin | admin123 |

---

*Cualquier pregunta de rumbo: empezar por acá.*
