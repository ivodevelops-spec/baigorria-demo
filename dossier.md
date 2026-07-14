# Dossier — Baigorria Industrial · Cliente #1

> Datos verificados en `https://baigorriaindustrial.com/` (julio 2026).
> **Última actualización:** 14/07/2026 (martes) — deploy demo a Render listo.

| Campo | Valor |
|---|---|
| **Slug** | baigorria |
| **Rubro** | Fabricación de bulones, espárragos, tuercas y piezas especiales (automotor, agrícola, transporte pesado, industrial) |
| **Geografía** | Caseros, Buenos Aires, Argentina (2 plantas). Oficina Madrid, España. |
| **Desde** | 1961 (+60 años) |
| **Contacto** | Florencia (ventas) · Martín (logística) |
| **Email** | contacto@baigorriaindustrial.com |
| **Teléfono** | +54 9 11 4750-7556 |
| **Web** | https://baigorriaindustrial.com/ |
| **Origen** | Red caliente |
| **Precio** | ARS 800.000 (propuesta original) |
| **Etapa** | **2 · Rediseño de la Restricción** — Fase 1 en producción. Fase 2 (integración ERP ISIS) en **relevamiento**. |
| **Próxima acción** | Backbone Fase 2 construido y verificado contra el mock. Falta del cliente: **API de ISIS** (Florencia) → enchufar `ISIS_API_URL`; **reunión técnica con Martín** (censo Sheets/picking + campos exactos de logística); **WhatsApp/Evolution + ruta de PDFs**. |
| **Deploy** | VPS Hetzner CAX21 (Ubuntu 22.04) · `crm.baigorriaindustrial.com` |

---

## Hechos de la empresa (scrapeo web)

- Fabrican desde **diámetros de 4mm a 22mm** y desde **6mm a 210mm de largo**.
- **Certificación ISO 9001** vigente. En proceso de **ISO-TS 16949** (automotriz).
- **Exportan a 8+ países**: Alemania, España, Italia, Polonia, Sudáfrica, Chile, Estados Unidos, Ecuador.
- **2 plantas en Caseros:** Planta Industrial (Escultor Santiago Parodi 3864) + Ventas/Expedición (Gral. Manuel Belgrano 3024). También oficina en Madrid.
- Líneas de producto: **espárragos** (milimétrico, combinado, pulgada), **bulones** (liviano, maza, pesado), **tuercas** (cónica, cromada, hexagonal), **piezas especiales** (industrial, herrajes, competición).
- Procesos: estampado en frío, roscado por laminación, tratamientos térmicos, recubrimientos superficiales (zincado, deltaproteckt, dacromet, cromado, fosfatizado, ennegrecido).
- Tienen **tienda virtual** activa y blog técnico (ensayos de niebla salina, dureza de grados, etc.).
- Participan en ferias internacionales: Automechanika Buenos Aires/Frankfurt, Wire & Tube Düsseldorf, Fastener Fair Stuttgart.

---

## Necesidades detectadas (del catálogo)

| Familia | Necesidad | ¿Cubierta? |
|---|---|---|
| A · No veo nada | Dashboard de KPIs | ✅ NocoDB (Fase 1) |
| | Control de accesos por rol | ✅ NocoDB |
| | Web responsive | ✅ CRM web |
| B · Datos no circulan | Conector / adapter | ⬜ ERP ISIS (Fase 2 — en relevamiento) |
| | Base unificada | ✅ PostgreSQL |
| | Sync automático | ⬜ Pendiente Fase 2 |
| C · Todo a mano | Notificaciones automáticas | ⬜ Pendiente Fase 2 (facturas por WhatsApp) |
| | Captura + scoring de leads | ✅ Meta Ads webhook → n8n (Fase 1) |
| | Follow-up automático | ✅ n8n (Fase 1) |
| | Reportes automáticos | ✅ n8n → email semanal (Fase 1) |
| D · Dependencia | Registro / historial | ✅ CRM + n8n logs |

---

## Restricción #1
**Los datos no circulan entre el ERP ISIS y el CRM.** Pedidos no entran solos al tablero, notificaciones de facturación no salen solas. Cada movimiento entre ERP y operación comercial requiere que una persona haga algo manual.

---

## Dolor en palabras del cliente
"No sé qué pasa en mi empresa sin preguntarle a alguien. Mando facturas a mano una por una. Los leads entran sin clasificar. Quiero estar en la calle vendiendo, no haciendo tareas operativas."

---

## Objetivos
- [x] Que los leads de Meta/Google se capturen automáticamente (Fase 1 ✅)
- [x] Dashboard centralizado de leads y pedidos (Fase 1 ✅)
- [x] WhatsApp bot y email marketing automático (Fase 1 ✅)
- [ ] Que los pedidos del ERP ISIS aparezcan solos en el tablero (Fase 2 — relevamiento)
- [ ] Que las facturas se manden automáticamente por WhatsApp (Fase 2 — relevamiento)
- [ ] Que Martín pueda ver prioridades sin depender de un Excel/Sheets (Fase 2 — relevamiento)

---

## Stack técnico (del build)

| Herramienta | Rol |
|---|---|
| **VPS Hetzner CAX21** | Servidor (Ubuntu 22.04, 4 vCPU, 8 GB RAM) |
| **Caddy** | Reverse proxy + SSL automático |
| **PostgreSQL** | Base de datos principal |
| **Redis** | Cache y cola de mensajes |
| **n8n** | Motor de automatización (webhooks → CRM → WhatsApp → Email) |
| **NocoDB** | CRM + dashboard de pedidos |
| **Listmonk** | Email marketing y secuencias automáticas |
| **Evolution API** | WhatsApp Business API (mensajería + chatbot) |

---

## Credenciales y accesos necesarios del cliente

> Marcar ✅ cuando el cliente las entregó.

### Cuentas y servicios
- [x] Acceso a Meta Business Suite (para webhook de leads)
- [x] Número de WhatsApp Business (Florencia / empresa)
- [ ] Acceso al ERP ISIS (API — la manda Florencia)
- [ ] Ruta de red / servidor donde se guardan los PDFs de factura (ISIS)
- [ ] Número de WhatsApp **genérico de empresa** (nuevo, no el personal de un vendedor)
- [ ] Dominio `crm.baigorriaindustrial.com` configurado

### APIs y claves
- [x] WhatsApp Business API (Evolution API)
- [x] Resend SMTP (API key para emails transaccionales)
- [x] Anthropic API key (Claude Haiku para calificación de leads)
- [ ] Meta Ads: Verify Token del webhook + Lead Access configurado

### Personas y contactos
- [x] Florencia: acceso al CRM, responde leads calificados
- [x] Martín: acceso al dashboard de pedidos y stock
- [ ] Proveedor de ISIS: credenciales de acceso (usuario/contraseña o IP autorizada)

---

## Registro de entregables

| Entregable | Fecha | Estado |
|---|---|---|
| Fase 1: CRM + Captura Leads (Meta/Google) | Julio 2026 | ✅ Producción |
| Fase 1: WhatsApp Bot + Email Marketing (Listmonk) | Julio 2026 | ✅ Producción |
| Fase 1: Dashboard de pedidos (NocoDB) | Julio 2026 | ✅ Producción |
| Fase 1: Deploy VPS Hetzner (Caddy + n8n + PostgreSQL + Redis) | Julio 2026 | ✅ Producción |
| Fase 2: Integración ERP ISIS (adapter) | 13/07/2026 | 🟡 Motor de sync construido y verificado contra mock; falta API real (Florencia) |
| Fase 2: Sync automático de pedidos ERP → CRM | 13/07/2026 | 🟡 `api/sync-isis.js` verificado E2E contra mock ("el pedido aparece solo") |
| Fase 2: Campos de logística + lead time + roles multi-usuario | 13/07/2026 | 🟡 Construido y con QA visual contra mock |
| Fase 2: Notificaciones WhatsApp por cambio de estado/facturación | — | ⬜ Relevamiento |
| Métricas antes/después (caso insignia) | — | ⬜ Pendiente |

---

## Registro de reuniones

| Fecha | Tipo | Resumen |
|---|---|---|
| Julio 2026 | Sesiones de desarrollo | Construcción Fase 1: CRM, captura leads, WhatsApp bot, email, deploy VPS. |
| 13/07/2026 (lunes) | Relevamiento Fase 2 | Con Florencia. Se relevan: integración ERP ISIS, múltiples bases de datos (mayoría Google Sheets), WhatsApp por vendedor, roles/permisos por equipo, campos de logística. Se define reunión técnica pendiente con Martín. Detalle abajo. |

---

## Relevamiento Fase 2 — Reunión 13/07/2026

### 1. Bases de datos (¿cuántas?)
- Hay **muchas BDs dando vueltas**, la mayoría **Google Sheets**. Cantidad exacta **por definir** con Martín.
- Además de las Sheets: la **BD del sistema (ISIS)** y la **BD de picking**.
- **Pendiente:** censar todas las fuentes y decidir cuáles se integran al CRM.

### 2. ERP ISIS
- **Florencia manda la API de ISIS.** ⬜ Pendiente de recibir.
- Es el conector/adapter de Fase 2 (la restricción #1: datos que no circulan).

### 3. Facturas
- **¿Dónde se guardan?** A definir. Posibilidad de **conectarse al servidor** donde están los PDFs.
- Bloquea el objetivo "facturas automáticas por WhatsApp".

### 4. WhatsApp
- El número actual de la empresa es de **un vendedor** (personal), no genérico.
- Quieren un **número específico de empresa**. Posible **chatbot** sobre ese número.
- Quieren **disponibilidad de números para varios vendedores**, no uno solo.

### 5. Logística (observaciones)
- Trabajar campos de info: **tipo de entrega** (retiro / expresa / flete Baigorria), **cantidad de cajas o bultos**, etc.
- Cambiar la métrica **"ticket promedio" → "lead time de entrega"**.
- El lead time se puede calcular tomando la **fecha de factura**.

### 6. Gestión de equipos y roles
- **Ventas:** 3 vendedores + 1 administración + 1 vendedora del canal online.
- **Logística:** 2 usuarios, **solo consulta**. **No** deben ver facturación / precios / montos. Deben poder acceder al resto.
  - Hoy usan un **Drive/Sheet** donde cargan: número de cliente, pedido, cantidades, tipo de despacho, cantidad de bultos.
  - **Migrar ese proceso de Sheets al propio CRM.**
- **Gerencia / Admin:** acceso total.

### 7. Martín y los tableros (reunión pendiente)
- Martín arma **tableros personalizados en Google Sheets** a partir de esas hojas para hacer búsquedas específicas.
- **Reunión técnica pendiente con Martín** para: definir qué BDs integrar, qué tableros existen y cómo replicarlos en el CRM.

### Pendientes que dependen del cliente
- [ ] API de ISIS (Florencia)
- [ ] Ubicación / acceso al servidor de facturas PDF
- [ ] Definir número de WhatsApp de empresa (nuevo, genérico)
- [ ] Agendar reunión técnica con Martín (censo de BDs + tableros)

---

## Historial de etapas

| Fecha | Etapa | Notas |
|---|---|---|
| Julio 2026 | 1 · Fase 1 en producción | CRM, captura leads, WhatsApp bot, email, deploy VPS. Sistema Fase 1 operativo. |
| 13/07/2026 | 2 · Rediseño de la Restricción | Kickoff Fase 2 (ERP ISIS). Relevamiento con Florencia. Fase 2 en relevamiento; falta API ISIS y reunión con Martín. |
| 13/07/2026 | 2 · Rediseño de la Restricción — build | Backbone Fase 2 construido y verificado E2E contra el mock: motor de sync ISIS→Postgres (`api/sync-isis.js`), campos de logística (tipo_entrega/bultos), lead time, roles multi-usuario, UI. Plan en `docs/PLAN-FASE2.md`. Desbloqueos pendientes: API ISIS, reunión Martín, WhatsApp/PDFs. |
| 14/07/2026 | 2 · Verificación pre-demo | Sistema local levantado y verificado. **HALLAZGO CRÍTICO:** Los leads entran a Google Sheets (https://docs.google.com/spreadsheets/d/1OooiJFo9_VlUDKn-VL6GjG04PO0NxywuxFvNuhye0Us) pero NO se replican al CRM. Informe ejecutivo creado (`docs/INFORME-CLIENTE.md`). Documentación técnica de la integración Sheets→CRM en `docs/ESTADO-LEADS-INTEGRACION.md`. Pendiente: migración de leads reales del Sheet al CRM + deploy de demo para el cliente. |
| 14/07/2026 | 2 · Deploy listo | Código subido a GitHub (`ivodevelops-spec/baigorria-demo`, branch `main`). `render.yaml` configurado con todas las env vars. Guía `DEPLOY-AHORA.md` creada. **Solo falta que Ivo cree la DB + Web Service en Render (~10 min).** |

---

## Notas
- La Fase 1 está en producción y funcionando. El sistema está documentado en `GUIA-IMPLEMENTACION.md` (547 líneas, paso a paso para deploy y mantenimiento).
- La Fase 2 (ERP ISIS + notificaciones) requiere que el cliente entregue la **API de ISIS** (la manda Florencia) y acceso al servidor de facturas. Sin eso no se puede avanzar.
- Fase 2 abarca más que ISIS: **censar y decidir qué bases de datos integrar** (la mayoría Google Sheets + BD de picking), **migrar el proceso de logística de Sheets al CRM**, **roles/permisos por equipo** y **WhatsApp multi-vendedor**. Depende de la reunión técnica con Martín.
- **CRÍTICO (14/07):** Detectado que los leads entran a Google Sheets pero NO se replican al CRM. Se necesita decisión del cliente: Opción A (Sheet + sync automático) u Opción B (webhook directo Meta→CRM). Ver `docs/ESTADO-LEADS-INTEGRACION.md`.
- La presentación visual está en `D:\Programación\Baigorria\presentacion\index.html`.
- Empresa grande, con certificación ISO, exportación internacional. Potencial de caso insignia fuerte para Hermes.
