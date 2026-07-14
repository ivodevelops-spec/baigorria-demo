# Baigorria Industrial — Sistema de Gestión Comercial
## Propuesta integral del proyecto

> Documento para Baigorria Industrial. Junio 2026.
> Incluye: qué es, cómo se integra, **qué necesitamos de ustedes**, plazos, costos y presupuesto.

---

## 1. Resumen ejecutivo

**El problema.** El equipo comercial pierde entre 2 y 4 horas por día en tareas operativas que no venden: mandar facturas a mano, avisar estados de pedidos, copiar pedidos del ERP a un Excel, responder leads que no aplican al negocio. Ese tiempo debería estar en la calle vendiendo.

**La solución.** Un **tablero web único** (se abre desde el navegador, sin instalar nada) donde el equipo ve sus leads y pedidos en un solo lugar, con **avisos automáticos por WhatsApp** a los clientes y **datos que entran solos** desde el ERP ISIS — sin copiar y pegar.

**El objetivo, en una línea:** sacarle al equipo las tareas repetitivas para que venda más, sin tocar la base de datos ni el ERP.

---

## 2. Qué van a tener (módulos)

| Módulo | Para quién | Qué resuelve |
|--------|-----------|--------------|
| **Inicio / Dashboard** | Todos | KPIs del negocio de un vistazo: leads, pedidos activos, facturación, embudo de ventas |
| **Leads** | Ventas | Todos los leads de Meta/Google, **clasificados por prioridad (score)**, con filtros y seguimiento |
| **Pedidos** | Ventas + Logística | Pedidos que **aparecen solos desde ISIS**; Martín asigna prioridad de armado con un clic |
| **Clientes** | Ventas | Ficha de cada cliente con sus datos |
| **Stock** | Todos | Disponibilidad por tipo de artículo |
| **Ventas** | Ventas / Admin | Facturación mensual por cliente |

**Acceso por roles (importante):** cada persona ve solo lo suyo.
- **Florencia (ventas):** leads, clientes, pedidos, facturación, todo.
- **Martín (logística):** pedidos y stock, **sin ver facturación** (resuelve el pedido de que logística no vea datos sensibles).
- **Administrador:** todo.

---

## 3. Cómo funciona por dentro (arquitectura)

Todo corre en un servidor propio (los datos son 100% de Baigorria, exportables siempre).

```
   Meta/Google Ads ─┐
                    ▼
   ERP ISIS ─► [ Capa de integración (modular) ] ─► Base de datos ─► Tablero web
                    ▲                                                    │
                    └──────────── Automatizaciones (n8n) ───► WhatsApp / Email
```

- **Tablero web:** aplicación a medida (React), con la marca de Baigorria. No depende de licencias de terceros.
- **Base de datos:** PostgreSQL (robusta, estándar, respaldos diarios).
- **Motor de automatización:** n8n (conecta todo y ejecuta los avisos automáticos).
- **WhatsApp:** vía Evolution API. **Email:** vía servicio SMTP.
- **ISIS como capa modular y reemplazable:** el sistema **nunca toca ISIS directo**; habla con una "capa traductora". Si mañana cambian de ERP, se cambia esa capa y el resto sigue igual. **Esto los desata de depender de ISIS para siempre.**

---

## 4. Las automatizaciones (el corazón del ahorro de tiempo)

| Automatización | Qué hace | Cuándo |
|----------------|----------|--------|
| **Pedido aparece solo** | El pedido cargado en ISIS aparece en el tablero sin copiar/pegar | cada 5 min |
| **Captura de leads** | El lead de Meta/Google entra solo, ya clasificado, y avisa al vendedor | al instante |
| **Aviso de estado por WhatsApp** | "Tu pedido fue facturado / despachado" al cliente, automático | al cambiar el estado |
| **Factura PDF por WhatsApp** | Busca el PDF de la factura y lo manda al cliente solo | al facturar |
| **Seguimiento de leads** | Recordatorio automático a los leads que no respondieron | 24h y 72h |
| **Reporte semanal** | Resumen de la semana por email | lunes |

---

## 5. Plan de integración y plazos

> Avanzamos **peldaño por peldaño**: primero lo que no depende de nadie, después lo que necesita accesos.

| Fase | Entregable | Depende de | Plazo estimado |
|:----:|-----------|-----------|:--------------:|
| **0 — Demo** | Tablero web funcional con leads reales + datos de ejemplo | — | **✅ Listo (para evaluar)** |
| **1 — Puesta en marcha** | Deploy en servidor + dominio + accesos del equipo | VPS + dominio | Semana 1 |
| **2 — Integración ISIS** | Pedidos/clientes/stock **reales** entrando solos | Acceso del proveedor ISIS | Semanas 2–4 |
| **3 — WhatsApp** | Avisos automáticos + factura PDF al cliente | N° WhatsApp Business | Semanas 4–6 |
| **4 — Automatización de leads** | Captura, seguimiento y reporte semanal | Acceso a Meta Ads | Semanas 5–7 |
| **5 — Capacitación + Go-live** | Equipo entrenado, sistema en producción | Todo lo anterior | Semana 7–8 |

> La Fase 2 es la de mayor valor y la que **depende del proveedor de ISIS**. Cuanto antes se gestione ese acceso, antes arranca.

---

## 6. ⭐ QUÉ NECESITAMOS DE USTEDES (para facilitar la integración)

Esto es lo más importante: **sin estos accesos, las fases reales no pueden avanzar.** Listado completo:

### 6.1 ERP ISIS (lo crítico)
- [ ] **Contacto del proveedor de ISIS** y su compromiso de habilitar la integración.
- [ ] **Acceso de solo lectura** (API REST preferida; o vistas SQL vía VPN/SSH) con:
  - **Pedidos:** nro, cliente, fecha, kilos, estado, retira/no, nro de factura.
  - **Clientes:** id, nombre, CUIT, provincia, localidad, teléfono, email.
  - **Artículos:** código, categoría, subcategoría, tipo, descripción, unidad.
  - **Stock:** artículo, kilos, unidades, estado.
- [ ] **Ruta de red** donde ISIS guarda los **PDF de factura** + cómo se nombran (ej. `{nro_factura}.pdf`).

### 6.2 WhatsApp
- [ ] Un **número de teléfono dedicado** para WhatsApp Business (no el personal de nadie).
- [ ] Confirmación de que **pueden mandar mensajes a clientes** por ese canal.

### 6.3 Meta / Google Ads (leads)
- [ ] Acceso a la **página de Facebook / formularios de leads** para conectar la captura automática.

### 6.4 Infraestructura
- [ ] Un **servidor (VPS)** — lo damos de alta nosotros o lo proveen ustedes — y un **dominio** (ej. `crm.baigorriaindustrial.com`).

### 6.5 Datos y negocio
- [ ] **Lista de vendedores** y cómo se asignan.
- [ ] **Reglas de prioridad de armado** y qué leads consideran "que aplican" al negocio.
- [ ] Si quieren integrarlas: la **base de ventas** y el **Drive de pedidos** de Martín.
- [ ] **Logo y colores oficiales** (ya usamos el azul institucional #004C97).

### 6.6 Personas de contacto
- [ ] Un **referente de negocio** (Florencia / Martín) y, si hay, un **referente técnico** del lado de ustedes para coordinar accesos.

> Mientras se gestionan estos accesos, nosotros avanzamos con todo lo que **no** depende de ellos.

---

## 7. Costos mensuales de operación (a cargo del cliente)

| Concepto | Proveedor | Costo aprox. |
|----------|-----------|:------------:|
| Servidor (VPS) | Hetzner | ~USD 7/mes |
| Dominio | — | ~USD 1/mes |
| WhatsApp (hosting Evolution) | — | ~USD 5/mes |
| Email | Resend (plan free) | USD 0 |
| **Total infraestructura** | | **~USD 13/mes** |

---

## 8. Presupuesto

> **Propuesta a confirmar.** Modalidad: llave en mano + servicio mensual opcional.

### 8. Implementación (pago único, llave en mano)
Incluye: sistema a medida completo, integración con ISIS, automatizaciones, WhatsApp, capacitación y **30 días de garantía**.

| Concepto | Monto |
|----------|:--------------:|
| **Desarrollo e implementación** | **USD 800** |
| Forma de pago | 50% al inicio · 50% al entregar |

> **Nota interna (no para el cliente):** el precio de lista absorbe la comisión del 25–30% del canal de venta. A USD 800 con 30% de comisión, el neto es ~USD 560. Ajustable según tu margen objetivo.

### Qué NO incluye
- Hardware/servidores físicos (se usa VPS).
- Migración de datos históricos más allá de lo acordado.
- Funciones fuera del alcance de este documento (se cotizan aparte).

---

## 9. Garantías y propiedad

- **Los datos son 100% de Baigorria** y exportables (CSV/JSON) en cualquier momento.
- Los PDF de factura **nunca se almacenan** en el servidor: se leen, se envían por WhatsApp y se descartan.
- Credenciales (ISIS, WhatsApp, etc.) guardadas como variables de entorno, nunca en código.
- **30 días de garantía** post-entrega: corrección de errores sin costo.

---

## 10. Próximos pasos

1. **Ver la demo** (les pasamos el acceso web).
2. Confirmación y seña (50%).
3. **Gestionar el acceso a ISIS** con el proveedor (lo antes posible — es lo que destraba todo).
4. Puesta en marcha por fases (sección 5).
5. Capacitación y go-live.

---

*Preparado por Ivo Paolantonio · ivopaolantoniopersonal@gmail.com · +54 9 11 3117-4279*
