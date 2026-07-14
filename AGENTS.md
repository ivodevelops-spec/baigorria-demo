# AGENTS.md — Baigorria Industrial

> Este repo es un proyecto de entrega de **Hermes** (Automation Agency).
> El dossier operativo vive en `dossier.md` — es la **fuente de verdad** sobre etapa, necesidades, credenciales y pendientes. Leelo al arrancar.

## Al arrancar una sesión
1. Leé `dossier.md` — sabé en qué etapa está el cliente, qué falta, qué credenciales hay.
2. Leé `GUIA-IMPLEMENTACION.md` — pasos técnicos de deploy.
3. Leé `docs/ARCHITECTURE.md` — diseño del sistema.

## Al cerrar una sesión — OBLIGATORIO
**Actualizá `dossier.md`** con lo que cambió:
- Objetivos completados → marcalos `[x]`
- Entregables nuevos → agregalos
- Cambio de etapa → actualizá el campo `Etapa` y `Próxima acción`
- Credenciales recibidas → marcalas
- Agregá entrada en `Historial de etapas`

**Esto no es opcional. El portal de Hermes lee de acá. Si no actualizás, el CEO vuela a ciegas.**

## Convenciones técnicas
- JavaScript plano (no TypeScript). React funcional con hooks.
- NO agregar comentarios salvo pedido explícito.
- SQL: `snake_case`; `created_at`/`updated_at` con defaults.
- Secretos por variables de entorno, nunca en código.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

## Stack del proyecto
- VPS: Hetzner CAX21 (Ubuntu 22.04)
- Reverse proxy: Caddy (SSL automático)
- DB: PostgreSQL + Redis
- Automatización: n8n (webhooks → CRM → WhatsApp → Email)
- CRM/Dashboard: NocoDB
- Email: Listmonk
- WhatsApp: Evolution API
- Deploy: `setup.sh` (un comando instala todo)
