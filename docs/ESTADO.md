# ESTADO — Baigorria Industrial

> Foto de entrega + próxima acción. Se actualiza al cerrar cada sesión (ver `playbooks/00-como-trabajamos.md`).
> Última actualización: **2026-07-13** (kickoff Fase 2 — build).

---

## En una línea
**Baigorria dio el OK.** El Panel de Control (Nivel 1) está entregado y aceptado, corriendo localmente (web React + API Express + Postgres + mock-ISIS). Arranca el **Nivel 2 — Rediseño de la Restricción**: automatizaciones n8n, integración ISIS real, WhatsApp y deploy persistente.

## Objetivo de la etapa
Pasar de **demo** a **producción**: eliminar el trabajo manual (datos que entran solos, notificaciones que salen solas) y dejar el sistema desplegado y operable por el equipo.

## Posición en la escalera (ver `DOCUMENTO-MAESTRO.md §3`)
- Nivel 0 (Diagnóstico) ✅ · Nivel 1 (Panel de Control) ✅ **aceptado** · **Nivel 2 (Rediseño de la Restricción) ⏳ en curso** · Nivel 3 (Retainer) ⬜.

---

## Qué está HECHO
- **Sistema operativo del proyecto:** migrado al modelo de la Agencia — `DOCUMENTO-MAESTRO.md` + `REGISTRO-DECISIONES.md` + `playbooks/` (00-como-trabajamos, sesion-entrega, sesion-planificacion). Baigorria = **cliente #1 de la Agencia** (D18).
- **Modelo de datos canónico:** `docs/MODELO-DATOS.md` (Postgres, contrato adapter ISIS, reglas de limpieza).
- **Infra dev (docker-compose):** Postgres + n8n + mock-isis-api.
- **Datos cargados en Postgres:** 233 leads limpios + scoreados (3 test excluidos, 5 cierres "demo seasoning") + mock de clientes/artículos/stock/pedidos/ventas.
- **mock-isis-api:** sirve el contrato ISIS (`/isis/pedidos`, `/clientes`, etc.) + endpoints de mutación para demo en vivo.
- **API custom (`api/`):** Express + pg + auth JWT + roles reales. Florencia (ventas) ve todo; Martín (logística) NO ve facturación (sin `nro_factura`, 403 en leads/ventas). Seed: florencia/flor123, martin/martin123, admin/admin123.
- **Web custom (`web/`):** React+Vite+Tailwind branded #004C97. Login, layout por rol, Home (KPIs+funnel+Recharts), Leads, Pedidos, Clientes, Stock, Ventas.
- **Presentación cliente:** `presentacion/index.html` (deck sin precios) en Netlify: https://earnest-cassata-9af29a.netlify.app. Propuesta en `docs/PRESENTACION-PROYECTO.md`.
- **Conocimiento de dominio:** `docs/CONOCIMIENTO-BASE.md`.
- **Motor de entrega (agentes):** `plan`/`build`/`@executor`/`@reviewer` + comandos `/feature` y `/cerrar-sesion`. Guía en `docs/motor-de-entrega.md`.

### Fase 2 — build kickoff (13/07, verificado E2E contra el mock)
- **Motor de sync `api/sync-isis.js`:** lee el contrato adapter vía `ISIS_API_URL` (mock o ISIS real) y hace UPSERT idempotente. **Verificado:** un pedido cargado en ISIS aparece solo en Postgres, y el sync **preserva** los campos de logística (`prioridad_armado`, `notas`, `tipo_entrega`, `cantidad_bultos`). Plan completo en `docs/PLAN-FASE2.md`.
- **Modelo Fase 2:** `pedidos` con `tipo_entrega`, `cantidad_bultos` (dueño: logística) + `fecha_factura` (de ISIS). Migración idempotente `db/migrations/002-fase2-pedidos.sql`.
- **API:** logística edita entrega/bultos (PATCH); `/api/clientes` abierto a logística (sin montos); dashboard con **lead time de entrega** (todos los roles) y `facturacionMes` por último período con datos; usuarios **config-driven** (`api/users.json` + `.example`).
- **Web:** columnas Tipo entrega + Bultos en Pedidos (editables) y KPI "Lead time entrega". **QA visual OK:** Martín ve los campos y el KPI pero NO facturación; Florencia ve el dashboard completo; edición desde la UI persiste.
- **`.env.example`:** ampliado como contrato de integración (ISIS/Evolution/WhatsApp/Meta/JWT).

## Qué FALTA (próximos pasos — Nivel 2)
1. **Scheduling del sync** en el deploy (cron / n8n / PM2 corriendo `sync-isis.js --loop`). El motor ya está; falta el disparador persistente.
2. **Integración ISIS real** (🔒 bloqueada: falta la API de ISIS — la manda Florencia). Al llegar: cambiar `ISIS_API_URL`.
3. Workflows n8n: captura Meta, notificaciones WhatsApp + factura PDF, seguimiento de leads, reporte semanal.
4. **WhatsApp Evolution** (🔒 avisos + factura PDF) — falta número de empresa + instancia + ruta de PDFs.
5. **Censo de fuentes (Sheets + picking) y tableros de Martín** (🔒 reunión técnica con Martín).
6. **Deploy persistente** (VPS + dominio) — **diferido** por decisión del fundador (D26); se sigue local.
7. **Capacitación + go-live** y **captura de métricas antes/después** (caso insignia).

## Cómo levantar todo (local, Windows)
```
# 1. Infra (Postgres + n8n + mock-isis)
docker compose up -d
# 2. Datos (si Postgres está vacío): generar seeds y cargarlos
node --experimental-sqlite scripts/gen-leads-seed.mjs   # -> db/migrations/leads-seed.sql
node scripts/gen-isis-seed.mjs                           # -> db/migrations/isis-seed.sql
#   docker cp ... + psql -f  (ver historial; cargan schema vía db/init/)
# 3. API
cd api && npm install && node server.js        # :3001
# 3b. Sync ISIS -> Postgres (una pasada; agregar --loop para poll cada 5 min)
cd api && node sync-isis.js                     # usa ISIS_API_URL (default mock :4000)
# 4. Web
cd web && npm install && npm run dev           # :5173 (proxy /api -> :3001)
# 5. (Demo pública) túnel
cloudflared tunnel --url http://localhost:5173
```

## URLs / accesos (temporales)
- Demo app: túnel cloudflared a :5173 (URL cambia en cada arranque).
- Deck: Netlify (https://earnest-cassata-9af29a.netlify.app) o túnel a :8090.
- Logins: florencia/flor123 · martin/martin123 · admin/admin123.

## Notas / gotchas
- **NO** matar todos los procesos node desde un comando (aborta la herramienta opencode). Frenar por puerto (`:3001`, `:5173`) o por PID específico.
- Docker Desktop se colgó una vez (engine 500 en el pipe); se resolvió relanzándolo. Si `docker ps` se cuelga, relanzar Docker Desktop.
- `api/sync-isis.js` usa defaults de PG que matchean el docker-compose (localhost:5432 / baigorria). `api/users.json` está gitignored (tiene passwords); el template es `api/users.example.json`.
- Vite necesita `server.allowedHosts: true` para servir por túnel.
- Documentos viejos parcialmente desactualizados: `ARCHITECTURE.md`, `PROYECTO.md`, `README.md` (describen NocoDB); `ESPECIFICACION-TECNICA.md` marcado OBSOLETO. El norte vigente es `DOCUMENTO-MAESTRO.md`.

## Próxima acción
El backbone de Fase 2 está listo y verificado contra el mock. Desbloqueos pendientes del cliente: **API de ISIS** (Florencia) → enchufar `ISIS_API_URL`; **reunión técnica con Martín** (censo de Sheets/picking + campos exactos de logística); **WhatsApp/Evolution + ruta de PDFs**. Con eso se sigue por los workflows n8n (WhatsApp/notificaciones) y el scheduling del sync. Deploy: diferido (D26).
