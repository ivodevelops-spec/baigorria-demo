# PLAN — Fase 2 · Rediseño de la Restricción

> **Kickoff de producción.** Traduce el relevamiento del 13/07/2026 (ver `dossier.md`) y el `DOCUMENTO-MAESTRO.md §5.2/§9` a workstreams ejecutables, separando **lo que se construye YA** (contra el mock) de **lo BLOQUEADO por el cliente**.
> **Fecha:** 2026-07-13. **Estado:** Sprint 1 (WS1/WS2/WS3/WS4 + `.env`) **construido y verificado E2E contra el mock**. Secuencia OK del fundador: **deploy al final, se sigue local** (D26). Bloqueados (WS2 real/WS5/WS6) a la espera de inputs del cliente.

---

## 0. Objetivo de la Fase 2

Eliminar el trabajo manual entre el ERP/las fuentes y la operación comercial:
- Que los pedidos **entren solos** al tablero (restricción #1: "los datos no circulan").
- Que las **notificaciones salgan solas** (estado/factura por WhatsApp).
- Unificar las **fuentes dispersas** (ISIS + muchos Google Sheets + BD de picking).
- Migrar el proceso de **logística** de Sheets al CRM y dejar el sistema **desplegado y operable** por el equipo.

---

## 1. Foto real del código (as-built, verificado 13/07)

> Corrige los docs obsoletos: el stack **NO es NocoDB**. Es custom. Ignorar `README.md`, `GUIA-IMPLEMENTACION.md` y `ARCHITECTURE.md` donde mencionen NocoDB/Listmonk/`crm/`.

| Componente | Estado real |
|---|---|
| `api/server.js` | Express single-file (161 líneas). JWT + 3 roles. 10 endpoints. `pg` crudo. **Nunca lee del mock-ISIS** (solo Postgres). |
| `web/` | React+Vite+Tailwind v4+Recharts. 7 páginas. Gating por rol en 3 capas (nav / render / API). |
| `db/` | Schema canónico completo (6 tablas + vista `leads_scored` + triggers). Seeds: 236 leads reales + mock ISIS. |
| `mock-isis-api/` | **Contrato adapter COMPLETO** (`GET /isis/{pedidos,clientes,articulos,stock,ventas}` + POST/PATCH). Puerto 4000, dockerizado. |
| `docker-compose.yml` | Dev only: Postgres 16 + n8n + mock-isis. Sin Caddy/prod. |
| `scripts/` | `gen-isis-seed.mjs`, `gen-leads-seed.mjs` (referencia de sync). `setup-nocodb.mjs` es legacy. |
| `n8n/` | **VACÍO.** Cero workflows. |
| Deploy | **Inexistente.** No hay `setup.sh`/`Caddyfile`/`compose.prod.yml`/PM2. Corre local vía túnel. |

---

## 2. Workstreams

Estado: 🟢 se construye ya (contra el mock) · 🔒 bloqueado por input del cliente · 🟡 mixto (scaffolding ya, wiring bloqueado).

### WS0 · Deploy persistente 🟡
VPS Hetzner CAX21 + Caddy (SSL) + `compose.prod.yml` + arranque persistente (PM2/systemd) + `docs/DEPLOY.md`. Dominio `crm.baigorriaindustrial.com`.
- **Ya:** escribir todos los artefactos de deploy.
- **Bloqueado:** ejecución → necesita **acceso al VPS + DNS apuntado**.

### WS1 · Live-sync mock-ISIS → Postgres 🟢
Workflow n8n que hace poll del contrato cada N min y **UPSERT** por clave natural, **preservando `prioridad_armado` y `notas`** (dueño: Martín; ver `MODELO-DATOS.md §3/§7`). Es la historia insignia: **"el pedido aparece solo"**.
- **Verificación:** POST un pedido al mock → aparece en la UI de Pedidos sin tocar nada en < N min.

### WS2 · Adapter ISIS real 🟡
`IsisProvider` con el **mismo contrato** del mock, endpoint por variable de entorno (`ISIS_API_URL`).
- **Ya:** esqueleto + mapeo de campos + validación contra el contrato.
- **Bloqueado:** wiring → necesita la **API de ISIS (Florencia)**. Al llegar: se cambia una env var.

### WS3 · Modelo de datos Fase 2 🟢
- Nuevas columnas en `pedidos`: `tipo_entrega` (retiro / expresa / flete Baigorria), `cantidad_bultos`.
- Migrar el proceso de logística (nro cliente, pedido, cantidades, tipo de despacho, bultos) de Sheets al CRM.
- Cambiar métrica **"ticket promedio" → "lead time de entrega"** (calculado desde fecha de factura).
- Fix: `facturacionMes` hardcodea `'2026-06'` → dinámico.
- **REVISABLE:** los campos exactos de logística se confirman con Martín.

### WS4 · Roles y equipo 🟢
- Estructura real: **3 vendedores + 1 administración + 1 vendedora online** (rol `ventas`) + **2 expedición** (rol `logistica`, solo consulta). Florencia y Martín = `ventas` (full access). Admin = Ivo.
- Logística NO ve facturación/precios/montos (regla firme) pero **sí** ve pedidos, stock y clientes en modo lectura.
- Usuarios demo genéricos por rol (`ventas`/`logistica`/`admin`). En producción, cuentas individuales por persona.
- **Bloqueado parcial:** nombres/emails reales del equipo.

### WS5 · WhatsApp 🔒
Número de empresa **genérico** (nuevo) + **multi-vendedor** + posible chatbot. Notificaciones por cambio de estado + **factura PDF automática** al facturar.
- **Ya:** esqueleto de workflow n8n + seams de env (`EVOLUTION_API_URL`, `EVOLUTION_INSTANCE`, `EVOLUTION_KEY`).
- **Bloqueado:** número(s) de WhatsApp, instancia Evolution, y **ruta al servidor de PDFs** de factura.

### WS6 · Censo de fuentes + tableros de Martín 🔒
Censar todas las BDs (mayoría Google Sheets + BD de picking), decidir cuáles se integran, y replicar en el CRM los tableros que Martín arma a mano.
- **Bloqueado:** **reunión técnica con Martín**.

### WS7 · Captura Meta + follow-up + reporte semanal 🟢
Workflows n8n: captura de leads Meta → Postgres, seguimiento 24h/72h, reporte semanal por email.
- **Bloqueado parcial:** Meta Verify Token + Lead Access (dossier los marca pendientes).

### WS8 · Métricas antes/después + capacitación/go-live 🟡
Caso insignia (maestro §10). Se instrumenta durante el build; se cierra en go-live.

---

## 3. Secuencia propuesta (Sprint 1 — todo lo desbloqueado)

Orden recomendado (zero-regret, sirve para cualquier camino posterior):

1. **WS1** live-sync contra mock — la demo "aparece solo" + **WS2** esqueleto del adapter con endpoint por env var.
2. **WS3** schema + UI: `tipo_entrega`, `cantidad_bultos`, lead time, mes dinámico.
3. **WS4** roles multi-usuario + logística lectura de clientes.
4. **WS0** artefactos de deploy escritos y listos para correr cuando llegue el acceso al VPS.
5. **`.env.example`** ampliado = el contrato de todo lo que hay que enchufar (WS2/WS5).

Cada paso se implementa en pasos chicos y verificables (playbook `sesion-entrega.md`) y pasa por el gate del `@reviewer` antes de cerrar.

---

## 4. Lo que necesito (para desbloquear)

### Del cliente (Florencia / Martín)
- [ ] **API de ISIS**: URL base, método de auth, endpoints disponibles y mapeo de campos → destraba WS2.
- [ ] **Ruta / acceso al servidor de PDFs** de factura → destraba WS5 (factura automática).
- [ ] **Número(s) de WhatsApp de empresa** (nuevo genérico) + cuántos para multi-vendedor → destraba WS5.
- [ ] **Evolution API**: instancia/URL/API key (o confirmar que la hosteamos nosotros) → destraba WS5.
- [ ] **Reunión técnica con Martín**: censo de Sheets + BD picking + tableros a replicar + campos exactos de logística → destraba WS6 y confirma WS3.
- [ ] **Roles reales**: nombre/email/rol de los 3 vendedores + admin + online + 2 logística → completa WS4.
- [ ] **Meta Ads**: Verify Token del webhook + Lead Access configurado → completa WS7.

### Del fundador (Ivo)
- [ ] **Acceso al VPS Hetzner** (IP + SSH) o confirmar que lo aprovisiono yo → destraba ejecución de WS0.
- [ ] **DNS** `crm.baigorriaindustrial.com` apuntado al VPS.
- [ ] Confirmar para producción las keys que el dossier marca ✅ (Resend, Anthropic).

---

## 5. Decisiones abiertas (REVISABLE)

- **Motor de sync:** workflow n8n vs script Node+cron. **Recomiendo n8n** (visible, encaja con el retainer de Nivel 3). → REVISABLE.
- **Definición de lead time:** `fecha_pedido → fecha de factura` como primer proxy (dato disponible). Ajustar con Martín si quieren `→ despacho`. → REVISABLE.
- **Multi-vendedor WhatsApp:** ¿un número por vendedor o uno de empresa con ruteo? Depende de Evolution + decisión comercial. → ABIERTO.
