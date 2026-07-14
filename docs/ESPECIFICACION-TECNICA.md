> ⚠️ **OBSOLETO — PENDIENTE DE REESCRITURA (2026-06-24).**
> Este documento describe el CRM custom (Node+Express+SQLite) que fue **eliminado** en el reset de producción.
> La arquitectura canónica pasó a ser **NocoDB + PostgreSQL + n8n + Listmonk + Caddy** (ver `AGENTS.md` y `docs/ARCHITECTURE.md`).
> Hay que reescribir este archivo para reflejar el nuevo stack. La lógica de negocio que sigue siendo válida
> (scoring de leads, deduplicación, delays humanizados de WhatsApp, reporte semanal) se conserva pero ahora vive en **workflows de n8n / columnas calculadas de NocoDB**, no en `server.js`.

---

# Especificación Técnica
## Baigorria Industrial — Sistema de Gestión Comercial

**Versión:** 2.0 — Documento para el equipo de desarrollo
**Fecha:** Junio 2026
**Autor:** Ivo Paolantonio

---

## 0. Sobre este documento

### 0.1 Audiencia

Este documento está dirigido al **equipo de programación** que va a implementar, mantener o extender el sistema. Asume conocimiento de Node.js, SQL, n8n y APIs REST. No es un documento para el cliente final.

### 0.2 Cómo leerlo

Cada decisión técnica está vinculada a un **punto del cliente** (extraído de la reunión del 28/05/2026). Esto garantiza que nada se construye "porque sí": todo responde a una necesidad real expresada por Florencia o Martín.

- `[C#42]` = Punto 42 de la reunión: *"Lo que me preocupa más que la base de datos es la interfaz de interacción con los datos"*
- `[C#72]` = Punto 72: *"Que el equipo comercial tenga más tiempo disponible para hacer otras cosas"*

### 0.3 Glosario

| Término | Significado |
|---------|------------|
| **ISIS** | ERP del cliente. Servidor Windows local. Contiene pedidos, clientes, stock, facturación. |
| **Lead** | Consulta comercial que entra por Meta Ads o Google Ads. |
| **Score** | Puntaje 0-100 que clasifica la calidad de un lead. |
| **Sync** | Proceso de copia de datos desde una fuente externa hacia la base del CRM. |
| **n8n** | Motor de automatización que ejecuta workflows (webhooks, WhatsApp, email). |
| **UPSERT** | Operación SQL que inserta o actualiza según exista el registro. |
| **Evolution API** | Middleware que conecta n8n con WhatsApp Business. |

---

## 1. Contexto del Cliente

### 1.1 Quién es Baigorria Industrial

Fábrica argentina de bulones, tuercas y espárragos. Sus clientes son buloneras, casas de repuestos, ferreterías y distribuidores mayoristas. Operan con un ERP llamado ISIS instalado en un servidor Windows local. Generan leads mediante campañas de Meta Ads y Google Ads.

### 1.2 Roles del equipo

| Persona | Rol | Qué necesita ver | Punto Cliente |
|---------|-----|-----------------|:------------:|
| Florencia | Ventas / coordinación | Leads, pedidos activos, notificaciones | C#42, C#61 |
| Martín | Logística / depósito | Pedidos con prioridad, kilos, estado de armado | C#44, C#62 |
| Administración | Facturación y contabilidad | ERP ISIS — NO este sistema | C#21, C#63 |

### 1.3 Lo que el cliente dijo — puntos de diseño

**Problema central:**
- C#72: *"Que el equipo comercial tenga más tiempo disponible para hacer lo estratégico"*
- C#74: *"Ellos son más efectivos en términos de cash flow"*
- C#6: *"Necesitamos que salgan a la calle"*

**Sobre la interfaz:**
- C#42: *"Lo que me preocupa más que la base de datos es la interfaz de interacción con los datos"*
- C#79: *"Cómo interactúo con los datos sin entrar a toquetear la base"*
- C#43: No quieren "toquetear la base"

**Sobre los pedidos:**
- C#44: Que el sistema notifique automáticamente cambios de estado
- C#45: Por WhatsApp
- C#47-49: Adjuntar facturas PDF en WhatsApp
- C#38: Ya probaron un botón manual y quieren que sea automático

**Sobre los leads:**
- C#50-54: Necesitan filtrar mejor qué leads aplican al negocio
- C#52: *"Ubicarnos mucho mejor en los límites de qué armar y qué normar"*

**Sobre la arquitectura:**
- C#58: *"Armalo chico, como una propuesta MVP"*
- C#59: *"Con que resuelva una parte quizás ya es un montón"*
- C#60: *"Peldaño por peldaño"*

---

## 2. Decisiones de Arquitectura (ADR)

Cada decisión está justificada con el punto del cliente que la motiva y la razón técnica.

### ADR-001: Servidor único Node.js + SQLite para el CRM

**Decisión:** Un solo archivo `server.js` que contiene backend (Express), base de datos (better-sqlite3) y frontend (HTML inline). Sin frameworks de frontend, sin PostgreSQL en desarrollo.

**Por qué:**
- **Cliente:** C#58-60 pide MVP chico, peldaño por peldaño. C#42 pide interfaz simple.
- **Técnico:** SQLite no requiere instalación ni configuración. Un solo archivo es más fácil de auditar, copiar y deployar. El HTML inline evita CORS, simplifica el deploy y permite que cualquier developer entienda el sistema completo en una sola lectura.
- **Migración futura:** Cuando se necesite PostgreSQL para producción multi-cliente, solo cambia la capa de datos (`better-sqlite3` → `pg`). La interfaz no se toca.

### ADR-002: HTML inline en vez de archivos separados

**Decisión:** El frontend completo está dentro de una variable `HTML` (template literal) en `server.js`. No hay archivos `.html` ni bundlers.

**Por qué:**
- **Cliente:** C#42-43 pide interfaz simple, sin complejidad innecesaria.
- **Técnico:** Un solo archivo = un solo deploy. Cero configuración de static files. Las variables de plantilla (`${...}`) se interpolan en el servidor. El frontend es vanilla JS sin dependencias.
- **Trade-off:** El archivo es grande (~1100 líneas). Se acepta porque la complejidad está en la lógica de negocio, no en la toolchain.

### ADR-003: Lead scoring server-side, no en base de datos

**Decisión:** El score de cada lead se calcula con la función `scoreLead(l)` en cada request, no se persiste en la tabla.

**Por qué:**
- **Cliente:** C#50-54 pide clasificación de leads. C#53: *"están respondiendo a una cantidad muy grande de leads que no están ajustados a nuestro negocio"*
- **Técnico:** El score es derivado (función pura de los campos del lead). No necesita almacenarse porque cambia si se edita el lead. Recalcular en cada GET garantiza que siempre está actualizado. Si se necesitara persistir (ej. para analytics históricos), se agrega un campo calculado en el SELECT.

### ADR-004: Polling cada 5 minutos para ISIS, no webhooks

**Decisión:** Un script cron (n8n o Python) consulta el ERP ISIS cada 5 minutos. No se usa webhook.

**Por qué:**
- **Cliente:** C#17-19: ISIS es un servidor local Windows, no cloud. C#19: *"las integraciones son desarrollos por API o por JSON. Nos generan tablas que son vistas"*
- **Técnico:** Un servidor Windows local no puede recibir webhooks desde internet sin exponer puertos (riesgo de seguridad). El polling desde el VPS hacia ISIS (vía VPN o SSH tunnel) es más seguro. 5 minutos de latencia es aceptable para pedidos (C#38-40).

### ADR-005: Datos demo como seed en el código

**Decición:** Los datos de demostración (clientes, artículos, stock, ventas) se insertan al iniciar el servidor si las tablas están vacías. No hay archivos `.sql` ni scripts de seed separados.

**Por qué:**
- **Cliente:** C#58-60 pide MVP. Necesitan ver el sistema funcionando ANTES de tener acceso a ISIS.
- **Técnico:** El seed en el código garantiza que cualquier developer que clone el repo y ejecute `node server.js` tiene un sistema completamente funcional con datos coherentes. Las tablas se crean, se pueblan y las relaciones (FK) se establecen automáticamente.

### ADR-006: Una sola tabla `leads`, sin separación por origen

**Decisión:** Todos los leads (Meta, Google, manuales) van a la misma tabla `leads`. El campo `origen` y `plataforma` los diferencian.

**Por qué:**
- **Cliente:** C#42 pide una sola interfaz para ver todo.
- **Técnico:** Una tabla unificada simplifica consultas, scoring, analytics y la UI. Si en el futuro los leads de Meta necesitan campos distintos a los de Google, se agregan columnas nullable. No justifica complejidad de herencia o tablas separadas para ~200 registros.

### ADR-007: WhatsApp via Evolution API (no directo a Meta)

**Decición:** Los mensajes de WhatsApp se envían a través de Evolution API, que actúa como middleware entre n8n y WhatsApp Business Cloud API.

**Por qué:**
- **Cliente:** C#45 pide WhatsApp como canal primario.
- **Técnico:** Evolution API simplifica el manejo de instancias, webhooks entrantes y formato de mensajes. Abstrae los cambios de versión de la API de Meta. El costo es mínimo y evita tener que manejar tokens de Meta directamente en cada workflow.

### ADR-008: Frontend vanilla JS, sin React/Vue

**Decición:** El frontend usa JavaScript plano con manipulación directa del DOM. No hay frameworks, no hay bundlers, no hay node_modules para el cliente.

**Por qué:**
- **Cliente:** C#42: *"lo que me preocupa más que la base de datos es la interfaz"* — no pide un SPA, pide algo funcional.
- **Técnico:** Para un CRUD de tablas con filtros, un framework es overkill. El JS vanilla pesa 0 bytes de dependencias, carga instantáneo, y cualquier developer puede mantenerlo. Si el cliente pide interactividad avanzada en el futuro, se migra a React/Vue sin tocar el backend.

---

## 3. Estructura del Proyecto

```
baigorria/
├── crm/                                # Código fuente del CRM
│   ├── server.js                       # ★ ARCHIVO PRINCIPAL: Express + SQLite + HTML
│   ├── leads.db                        # Base de datos SQLite (NO versionar, se regenera)
│   ├── package.json                    # Dependencias: express, better-sqlite3, cors
│   ├── page.html                       # Versión standalone del frontend (backup/demo)
│   └── import-sheets.js                # Script legacy: importación desde Google Sheets
│
├── n8n/
│   └── workflows/                      # Workflows exportados de n8n (JSON)
│       ├── baigorria-captura-leads.json    # Webhook Meta → CRM + Listmonk + WhatsApp
│       ├── baigorria-ia-whatsapp.json      # IA de conversación (Claude) → califica leads
│       ├── baigorria-seguimiento.json      # Recordatorios automáticos 24h y 72h
│       └── baigorria-reporte-semanal.json  # Reporte semanal automático por email
│
├── scripts/                            # Scripts de sincronización y utilidades
│   ├── sync-isis.py                    # (PENDIENTE) Sync ERP ISIS → SQLite/PostgreSQL
│   └── backup.sh                       # Backup diario de la base de datos
│
├── config/
│   └── templates/                      # Templates de email para Listmonk
│
├── docs/                               # Documentación
│   ├── ESPECIFICACION-TECNICA.md       # ← Este documento
│   ├── PROYECTO.md                     # Documento de proyecto (para el cliente)
│   ├── ARCHITECTURE.md                 # Arquitectura con diagramas C4
│   ├── estructura-bases-de-datos.md    # Mapa de las 7 fuentes de datos
│   ├── explicacion-para-baigorria.md   # Explicación en lenguaje no técnico
│   └── puntos-reunion-28-mayo-2026.md  # 79 puntos extraídos de la reunión
│
├── MVP/                                # Material de presentación
│   ├── presentacion.html               # Presentación visual con capturas
│   └── screen 1-9.PNG                  # Capturas de pantalla del CRM
│
├── ecosystem.config.js                 # Configuración de PM2
├── AGENTS.md                           # Reglas para agentes de IA
├── README.md                           # Documentación de entrada al repo
└── setup.sh                            # (PENDIENTE) Script de instalación para VPS
```

---

## 4. Modelo de Datos

### 4.1 Tabla `leads`

Registra cada consulta comercial que ingresa al sistema.

| Columna | Tipo SQLite | Origen | Descripción | Punto Cliente |
|---------|:----------:|--------|-------------|:------------:|
| `id` | INTEGER PK | Auto | Identificador único | — |
| `nombre` | TEXT | Formulario Meta/Google | Nombre del contacto | C#42 |
| `apellido` | TEXT | Formulario Meta/Google | Apellido | — |
| `email` | TEXT | Formulario | Email (usado para deduplicación) | — |
| `telefono` | TEXT | Formulario | WhatsApp / teléfono (formato variable) | — |
| `empresa` | TEXT | Formulario | Nombre de la empresa o comercio | — |
| `rubro` | TEXT | Formulario (dropdown) | Bulonera, Ferretería, Casa de repuestos, etc. | C#50 |
| `provincia` | TEXT | Formulario | Provincia / localidad combinada | — |
| `compra_estimada` | TEXT | Formulario | Estimación de compra mensual (texto libre) | — |
| `observaciones` | TEXT | Formulario | Campo libre del lead | — |
| `origen` | TEXT | Webhook metadata | "Meta Ads", "Google Ads", "Manual" | — |
| `plataforma` | TEXT | Webhook metadata | "Meta", "Google" | — |
| `estado` | TEXT | Manual / Workflow | "Sin contactar", "Esperando rta", "Contactado", "Cerrado", "Perdido" | C#44 |
| `contactado` | TEXT | Manual | "Si" / vacío | — |
| `fecha_contacto` | TEXT | Manual | Fecha de último contacto | — |
| `vendedor` | TEXT | Manual | Vendedor asignado | C#64 |
| `comentarios` | TEXT | Manual / Workflow | Notas del vendedor o del bot de IA | C#42 |
| `proveedor_actual` | TEXT | Manual | Proveedor actual del lead (dato comercial) | — |
| `potencial` | TEXT | Manual | "Si" / "No" / vacío | C#52 |
| `venta_concretada` | TEXT | Manual | "Si" / "No" / vacío | — |
| `fecha_venta` | TEXT | Manual | Fecha de cierre | — |
| `dolor` | TEXT | Formulario / Migración | Pain point del lead (problema que quiere resolver) | C#42 |
| `chat_history` | TEXT | Workflow IA | Historial JSON de conversación WhatsApp | C#41 |
| `fecha` | TEXT | Auto | Timestamp de creación (datetime local) | — |

**Índices implícitos:** `id` (PK). No hay índices adicionales — el volumen actual (~200 registros) no lo justifica.

**Migraciones:** Las columnas nuevas se agregan con `ALTER TABLE ADD COLUMN` al iniciar el servidor (línea 28-40 de server.js). Es idempotente: si la columna ya existe, no hace nada.

### 4.2 Tabla `pedidos`

Registra los pedidos sincronizados desde el ERP ISIS. En modo demo, se puebla con datos de ejemplo.

| Columna | Tipo SQLite | Origen | Descripción | Punto Cliente |
|---------|:----------:|--------|-------------|:------------:|
| `id` | INTEGER PK | Auto | Identificador | — |
| `nro_pedido` | TEXT UNIQUE | ERP ISIS | Número de pedido (ej. "PED-1042") | C#30-34 |
| `cliente` | TEXT | ERP ISIS | Nombre del cliente (denormalizado para legacy) | — |
| `cliente_id` | INTEGER | Migración | FK a `clientes.id` (agregado en v2) | C#61-62 |
| `fecha_pedido` | TEXT | ERP ISIS | Fecha del pedido (YYYY-MM-DD) | C#44 |
| `kilos_total` | REAL | ERP ISIS | Kilos totales del pedido | C#44 |
| `estado` | TEXT | ERP ISIS | "En proceso", "Terminado", "Facturado", "Despachado" | C#30-34 |
| `prioridad_armado` | TEXT | Manual (Martín) | "Alta", "Media", "Baja" | C#24-25 |
| `retira_local` | TEXT | ERP ISIS | "Si" / "No" | C#35 |
| `nro_factura` | TEXT | ERP ISIS | Número de factura (cuando está facturado) | C#47 |
| `notificado_facturado` | TEXT | Workflow | Marca si ya se envió WhatsApp de facturación | C#38-40 |
| `notificado_despachado` | TEXT | Workflow | Marca si ya se envió WhatsApp de despacho | C#44 |
| `notas` | TEXT | Manual | Notas libres sobre el pedido | C#42 |
| `created_at` | TEXT | Auto | Timestamp de creación | — |
| `updated_at` | TEXT | Auto | Timestamp de última modificación | — |

### 4.3 Tabla `clientes`

| Columna | Tipo SQLite | Origen | Descripción |
|---------|:----------:|--------|-------------|
| `id` | INTEGER PK | Auto | Identificador |
| `nombre` | TEXT | ERP ISIS / Manual | Razón social o nombre comercial |
| `cuit` | TEXT | ERP ISIS | CUIT (formato XX-XXXXXXXX-X) |
| `rubro` | TEXT | ERP ISIS / Manual | Rubro del cliente |
| `provincia` | TEXT | ERP ISIS | Provincia |
| `localidad` | TEXT | ERP ISIS | Localidad |
| `telefono` | TEXT | ERP ISIS / Manual | Teléfono de contacto |
| `email` | TEXT | ERP ISIS / Manual | Email de contacto |
| `vendedor_asignado` | TEXT | Manual | Vendedor responsable de la cuenta |

### 4.4 Tabla `articulos`

Jerarquía de 4 niveles (C#15). Estándar de la industria de bulonería.

| Columna | Tipo | Descripción |
|---------|:----:|-------------|
| `id` | INTEGER PK | Identificador |
| `codigo` | TEXT UNIQUE | Código único (ej. "BUL-RDA-001") |
| `categoria` | TEXT | Nivel 1: Bulón, Tuerca, Espárrago, Kit |
| `subcategoria` | TEXT | Nivel 2: Bulón de rueda, Bulón de masa, etc. |
| `tipo` | TEXT | Nivel 3: Liviano, Pesado, Standard, Reforzado |
| `descripcion` | TEXT | Nivel 4: Descripción larga con medidas |
| `unidad_medida` | TEXT | "kg", "unidad", "kit" |

### 4.5 Tabla `stock`

Stock agregado (C#11). No está a nivel SKU individual, sino por tipo de artículo.

| Columna | Tipo | Descripción |
|---------|:----:|-------------|
| `id` | INTEGER PK | Identificador |
| `articulo_id` | INTEGER FK | FK a `articulos.id` |
| `kilos_disponibles` | REAL | Kilos en stock (para artículos que se miden por peso) |
| `unidades_disponibles` | INTEGER | Unidades en stock (para artículos que se miden por unidad) |
| `estado` | TEXT | "Disponible", "Bajo stock", "Sin stock" |
| `ubicacion` | TEXT | Ubicación física en el depósito |

### 4.6 Tabla `ventas_mensuales`

| Columna | Tipo | Descripción |
|---------|:----:|-------------|
| `id` | INTEGER PK | Identificador |
| `cliente_id` | INTEGER FK | FK a `clientes.id` |
| `periodo` | TEXT | "YYYY-MM" |
| `total_facturado` | REAL | Total facturado en el período |
| `kilos_vendidos` | REAL | Kilos vendidos en el período |
| `ticket_promedio` | REAL | Ticket promedio por operación |

---

## 5. API Reference

Base URL: `http://localhost:8080`

### 5.1 Leads

#### `POST /api/leads`
Crea un lead nuevo. Usado por el webhook de n8n.

**Request:**
```json
{
  "nombre": "Carlos",
  "apellido": "García",
  "email": "carlos@bulonera.com",
  "telefono": "11-5555-1234",
  "empresa": "Bulonera Central",
  "rubro": "Bulonera",
  "provincia": "Buenos Aires",
  "origen": "Meta Ads",
  "plataforma": "Meta",
  "estado": "Sin contactar"
}
```

**Response `201`:** (no se usa status code explícito, devuelve 200)
```json
{
  "id": 237,
  "score": 80,
  "nombre": "Carlos",
  ...
}
```

**Response (duplicado):**
```json
{
  "duplicate": true,
  "existing_id": 15,
  "message": "Lead duplicado — ya existe con ID 15"
}
```

**Lógica de deduplicación:** Si el email (normalizado a minúsculas, sin espacios) ya existe, o si el teléfono (solo dígitos, últimos 8) ya existe, se rechaza la inserción y se devuelve el ID del lead existente. [C#79: no duplicar trabajo]

#### `GET /api/leads`
Lista todos los leads, ordenados por ID descendente.

**Query params:**
| Param | Tipo | Ejemplo |
|-------|------|---------|
| `estado` | string | `Sin contactar` |
| `rubro` | string | `Bulonera` |
| `vendedor` | string | `Carlos` |
| `q` | string | Búsqueda en nombre, apellido, empresa, email, teléfono |

**Response:** Array de objetos lead, cada uno con campo `score` calculado.

#### `GET /api/leads/by-phone/:phone`
Busca un lead por teléfono. Usado por el workflow de IA de WhatsApp para identificar al lead que está escribiendo.

**Lógica:** Normaliza el teléfono (quita espacios, guiones, paréntesis) y busca por los últimos 8 dígitos. Esto tolera diferencias de formato (con/sin código de país, con/sin 9 para móviles argentinos).

#### `PATCH /api/leads/:id`
Actualiza campos de un lead. Usado por la UI (edición inline) y por los workflows.

**Request:** JSON con los campos a modificar.
```json
{ "estado": "Contactado", "vendedor": "Carlos" }
```

**Response:**
```json
{ "ok": true }
```

### 5.2 Pedidos

#### `GET /api/pedidos`
Lista todos los pedidos, ordenados por fecha descendente.

**Query params:** `estado`, `prioridad`

#### `PATCH /api/pedidos/:id`
Actualiza campos de un pedido. Actualiza automáticamente `updated_at`.

### 5.3 Clientes

#### `GET /api/clientes`
Lista todos los clientes ordenados por nombre.

### 5.4 Artículos

#### `GET /api/articulos`
Lista todos los artículos ordenados por categoría, subcategoría, tipo.

### 5.5 Stock

#### `GET /api/stock`
Lista el stock con JOIN a la tabla de artículos para mostrar código y descripción.

**Response incluye:** Campos de `stock` + `categoria`, `subcategoria`, `tipo`, `articulo_desc`, `codigo`, `unidad_medida` de `articulos`.

### 5.6 Ventas

#### `GET /api/ventas`
Lista ventas mensuales con JOIN a clientes. Ordenado por período descendente, total facturado descendente.

### 5.7 Dashboard

#### `GET /api/dashboard`
Devuelve datos agregados para la pantalla de inicio.

**Response:**
```json
{
  "kpis": {
    "leadsTotal": 236,
    "leadsHot": 48,
    "pedidosTotal": 5,
    "pedidosActivos": 2,
    "clientesTotal": 12,
    "stockKilos": 1591,
    "facturacionMes": 2500000
  },
  "leadsPrioritarios": [ ... ],
  "pedidosRecientes": [ ... ]
}
```

**Lógica:**
- `leadsHot`: leads con estado "Sin contactar" o "Esperando rta"
- `leadsPrioritarios`: últimos 5 leads abiertos con score ≥ 40
- `pedidosActivos`: pedidos en estado "En proceso" o "Terminado"

---

## 6. Flujos de Datos

### 6.1 Captura de Lead (Meta Ads → CRM)

```
1. Usuario completa formulario en Facebook/Instagram
2. Meta envía webhook a: POST https://n8n.baigorriaindustrial.com/webhook/meta-leads
3. n8n workflow "baigorria-captura-leads" parsea el JSON
4. n8n normaliza el teléfono: quita 0 inicial, agrega prefijo 9 para móviles argentinos
5. POST http://localhost:8080/api/leads → guarda en leads.db
6. POST http://localhost:9000/api/subscribers → suscribe a Listmonk (lista ID 1)
7. Si tiene teléfono, calcula delay humanizado (2-4 min en horario hábil, o hasta 9am siguiente)
8. Envía WhatsApp con catálogo PDF al lead via Evolution API
9. Envía WhatsApp al vendedor con los datos del nuevo lead
```

**Horario hábil para WhatsApp:** 9:00 a 21:00 (hora Argentina). Fuera de ese horario, el mensaje se retiene hasta las 9:00 del día siguiente con offset random de 5-15 minutos para evitar parecer automatizado.

### 6.2 Sync ERP ISIS → CRM

```
1. Script cron (n8n workflow o Python) se ejecuta cada 5 minutos
2. Conecta a ISIS via SSH tunnel o VPN
3. Ejecuta SELECT en vistas de solo lectura del ERP
4. Para cada registro: UPSERT en la tabla correspondiente del CRM
5. Si el pedido cambió de estado → dispara lógica de notificación
```

**UPSERT en SQLite:**
```sql
INSERT INTO pedidos (nro_pedido, cliente, ...) VALUES (?, ?, ...)
ON CONFLICT(nro_pedido) DO UPDATE SET estado=excluded.estado, ...;
```

**Marcador de agua:** El script guarda el último `updated_at` procesado. En cada ejecución, solo consulta registros modificados después de esa fecha. Esto minimiza la carga sobre ISIS.

### 6.3 Notificación de Pedido Facturado

```
1. sync-isis.py detecta que un pedido pasó a estado "Facturado"
2. Actualiza el registro en el CRM
3. Busca el PDF: \\servidor-local\facturas\{nro_factura}.pdf
4. Envía WhatsApp via Evolution API con:
   - Mensaje: "Tu pedido #XXX fue facturado por $X. Se despachará en los próximos días."
   - Adjunto: el PDF de la factura
5. Marca notificado_facturado = true para no enviar dos veces
```

**Manejo de errores:**
- Si el PDF no existe → envía el mensaje sin adjunto + log de warning
- Si WhatsApp falla → reintenta 3 veces con backoff exponencial
- Si ISIS no está disponible → el script termina sin error, espera al próximo ciclo

### 6.4 Conversación IA por WhatsApp

```
1. Evolution API recibe mensaje de WhatsApp del lead
2. Webhook POST /wa-incoming en n8n
3. n8n filtra: solo mensajes de texto, no del propio bot, no eventos de sistema
4. Busca el lead en CRM por teléfono: GET /api/leads/by-phone/{numero}
5. Si el lead está en estado "Contactado", "Cerrado" o "Perdido" → no responde
6. Construye contexto: últimos 10 mensajes del chat_history
7. POST a Claude (Anthropic) con system prompt de asistente de Baigorria
8. Claude responde y clasifica: "CALIFICADO", "DESCALIFICADO", o respuesta normal
9. Delay humanizado de 5-20 segundos
10. Envía respuesta por WhatsApp
11. Actualiza chat_history en el CRM
12. Si calificó → cambia estado a "Esperando rta" + notifica al vendedor
13. Si descalificó → cambia estado a "Perdido"
```

---

## 7. Integraciones Externas

### 7.1 WhatsApp Business (via Evolution API)

| Parámetro | Valor |
|-----------|-------|
| Base URL | Configurada en variable de entorno `EVOLUTION_API_URL` |
| Instance | `EVOLUTION_INSTANCE` |
| API Key | `EVOLUTION_API_KEY` |
| Rate limit | 80 mensajes/segundo (Meta) |
| Adjuntos | PDF hasta 100 MB |

**Endpoints usados:**
- `POST /message/sendText/{instance}` — enviar texto
- `POST /message/sendMedia/{instance}` — enviar PDF/imagen

### 7.2 Meta Ads (Facebook Leads)

| Parámetro | Valor |
|-----------|-------|
| Webhook URL | `https://n8n.{dominio}/webhook/meta-leads` |
| Verify token | `META_VERIFY_TOKEN` |
| Método | POST |
| Content-Type | application/json |

### 7.3 Email (Resend SMTP)

| Parámetro | Valor |
|-----------|-------|
| Host | smtp.resend.com |
| Puerto | 587 |
| Auth | API Key (`RESEND_API_KEY`) |
| TLS | Requerido |

### 7.4 Claude IA (Anthropic)

| Parámetro | Valor |
|-----------|-------|
| Endpoint | `https://api.anthropic.com/v1/messages` |
| Modelo | `claude-haiku-4-5-20251001` |
| API Key | `ANTHROPIC_API_KEY` |
| System prompt | Asistente de Baigorria Industrial para calificación de leads |

---

## 8. Frontend

### 8.1 Arquitectura del HTML

El frontend está empaquetado en una sola variable `HTML` (template literal de JavaScript) dentro de `server.js`. Se sirve en `GET /`.

**Estructura:**
```
HTML
├── <style> (CSS custom properties, dark/light theme)
├── .header (marca, stats, botón de tema)
├── .toolbar (búsqueda, filtros de leads)
├── .tabs (9 botones de navegación)
├── #view-home (dashboard KPIs + leads prioritarios + últimos pedidos)
├── #view-tabla (tabla de leads con scores y edición inline)
├── #view-kanban (vista kanban por columnas de estado)
├── #view-pedidos (tabla de pedidos con filtros y edición)
├── #view-clientes (tabla de clientes)
├── #view-articulos (tabla de artículos con jerarquía)
├── #view-stock (tabla de stock con JOIN a artículos)
├── #view-ventas (tabla de ventas mensuales)
├── #view-analytics (KPIs, funnel, insights)
└── <script> (toda la lógica JS)
```

### 8.2 Sistema de Tabs

Cada tab se activa con `switchTab(name, btn)`:
- Remueve clase `active` de todas las vistas
- Agrega clase `active` a la vista seleccionada
- Dispara la función de carga correspondiente (`loadHome()`, `loadPedidos()`, etc.)

**Tab inicial:** `home` (se llama `loadHome()` al cargar la página).

### 8.3 Tema Claro/Oscuro

Implementado con CSS custom properties y toggle en localStorage.

```css
:root { --bg: #0d1117; --text: #e6edf3; ... }  /* Tema oscuro (default) */
body.light { --bg: #f5f6fa; --text: #1f2328; ... }  /* Tema claro */
```

El botón cambia la clase `light` en `<body>` y persiste la preferencia en `localStorage`.

### 8.4 Funciones JavaScript principales

| Función | Disparador | Qué hace |
|---------|-----------|----------|
| `load()` | onload, setInterval 15s, filtros | Carga leads con filtros |
| `loadHome()` | switchTab('home') | Carga dashboard KPIs |
| `loadPedidos()` | switchTab('pedidos'), filtros | Carga pedidos con filtros |
| `loadClientes()` | switchTab('clientes') | Carga tabla de clientes |
| `loadArticulos()` | switchTab('articulos') | Carga catálogo de artículos |
| `loadStock()` | switchTab('stock') | Carga stock con JOIN |
| `loadVentas()` | switchTab('ventas') | Carga ventas mensuales |
| `renderKanban()` | switchTab('kanban') | Renderiza vista kanban |
| `renderAnalytics()` | switchTab('analytics') | Renderiza analytics |
| `upd(id, field, value)` | onChange en selects | Actualiza un campo de lead |
| `updPed(id, field, value)` | onChange en selects | Actualiza un campo de pedido |
| `editCell(el, id, field)` | onClick en celdas | Edición inline de lead |
| `editCellPed(el, id, field)` | onClick en celdas | Edición inline de pedido |
| `scoreLead(l)` | Client-side | Calcula score (duplicado del server) |
| `toggleTheme()` | onClick botón | Cambia tema claro/oscuro |

### 8.5 Sistema de Scoring (Cliente)

La función `scoreLead(l)` existe duplicada en el cliente (para analytics en tiempo real sin llamada al server) y en el servidor (para el cálculo oficial en las APIs). Ambas deben mantenerse sincronizadas.

**Reglas de scoring:**
```
+30 puntos: rubro = bulonera, distribuidor, mayorista, industria, agro
+18 puntos: rubro = ferretería, casa de repuestos, taller
+10 puntos: tiene empresa (no es test)
+10 puntos: tiene email (no es test)
+10 puntos: tiene teléfono (no es test)
+20 puntos: tiene compra_estimada (no es test)
+10 puntos: provincia = Buenos Aires, CABA, Capital
Máximo: 100 puntos
```

---

## 9. Deployment

### 9.1 Requisitos del Servidor

| Componente | Mínimo | Recomendado |
|-----------|--------|------------|
| OS | Ubuntu 20.04 | Ubuntu 22.04 LTS |
| RAM | 1 GB | 2 GB |
| Disco | 5 GB | 10 GB |
| Node.js | 18 LTS | 20 LTS |

### 9.2 Instalación Manual

```bash
# 1. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clonar o copiar el proyecto
git clone <repo> /opt/baigorria
cd /opt/baigorria/crm

# 3. Instalar dependencias
npm install

# 4. Iniciar
node server.js
# El servidor escucha en puerto 8080
```

### 9.3 Con PM2 (Producción)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar
pm2 start server.js --name baigorria-crm

# Auto-inicio con el sistema
pm2 save
pm2 startup
```

### 9.4 Variables de Entorno

| Variable | Requerida | Descripción |
|----------|:---------:|-------------|
| `PORT` | No (default 8080) | Puerto del servidor HTTP |
| `WHATSAPP_TOKEN` | Sí (para notificaciones) | Bearer token de WhatsApp Cloud API |
| `EVOLUTION_API_URL` | Sí | URL de la instancia Evolution API |
| `EVOLUTION_INSTANCE` | Sí | Nombre de la instancia Evolution |
| `EVOLUTION_API_KEY` | Sí | API Key de Evolution |
| `ANTHROPIC_API_KEY` | Sí (para IA) | API Key de Anthropic (Claude) |
| `META_VERIFY_TOKEN` | Sí (para webhooks) | Token de verificación de Meta |
| `RESEND_API_KEY` | Sí (para email) | API Key de Resend SMTP |
| `CATALOGO_PDF_URL` | Sí | URL pública del catálogo PDF para WhatsApp |
| `VENDEDOR_WHATSAPP` | Sí | Número del vendedor para notificaciones |

### 9.5 Con Caddy (Reverse Proxy + SSL)

```caddy
crm.baigorriaindustrial.com {
    reverse_proxy localhost:8080
}
```

Caddy genera y renueva certificados SSL automáticamente vía Let's Encrypt.

---

## 10. Troubleshooting

### 10.1 El CRM muestra "Cargando..." y no carga

**Causa:** Error de sintaxis JavaScript en el HTML inline.

**Diagnóstico:**
```bash
curl http://localhost:8080/ | grep -o '<script>.*</script>' > /tmp/crm-script.js
node --check /tmp/crm-script.js
```

**Causa común:** Escape incorrecto de comillas en template literals. Las funciones que generan HTML con comillas dentro de un template literal de backtick requieren doble escape (`\\'` para producir `\'` en el output).

### 10.2 Error "SQLITE_BUSY"

**Causa:** Dos procesos Node.js escribiendo a `leads.db` simultáneamente.

**Solución:** Matar todos los procesos Node y reiniciar uno solo:
```bash
pkill node
cd /opt/baigorria/crm && node server.js
```

### 10.3 Los pedidos no se actualizan

**Causa probable:** El script de sync no está corriendo o no tiene acceso a ISIS.

**Diagnóstico:**
```bash
# Verificar que el cron está activo
crontab -l | grep sync-isis

# Probar conectividad a ISIS
ping <ip-del-servidor-isis>

# Ejecutar sync manualmente
python3 scripts/sync-isis.py --dry-run
```

### 10.4 WhatsApp no envía mensajes

**Causas posibles:**
1. Token de WhatsApp expirado → regenerar en Meta Business
2. Evolution API caída → verificar `systemctl status evolution`
3. Número de teléfono no válido → verificar formato (+54 9 11 XXXX-XXXX)
4. Rate limit excedido → esperar, la API de Meta permite 80 msg/s

---

## 11. Roadmap Técnico

### 11.1 Pendiente — Fase 2

| Tarea | Archivo | Dependencia |
|-------|---------|:-----------:|
| Script sync-isis.py | `scripts/sync-isis.py` | Acceso a vistas SQL de ISIS |
| Conectar pedidos reales | `server.js` (ya tiene tabla) | sync-isis.py |
| Notificaciones WhatsApp por cambio de estado | Workflow n8n nuevo | Pedidos reales |
| Adjuntar PDF de factura | Workflow n8n nuevo | Ruta de PDFs en servidor ISIS |
| Alertas por inactividad (90 días sin compra) | Workflow n8n nuevo | Datos de ventas |
| Alta manual de clientes desde UI | `server.js` (POST) | — |
| Ficha de cliente con historial | `server.js` + UI | Tabla clientes |
| Login por roles | `server.js` (auth middleware) | — |
| Migrar a PostgreSQL | `server.js` (capa de datos) | Setup multi-cliente |

### 11.2 Mejoras Futuras

| Mejora | Prioridad | Notas |
|--------|:---------:|-------|
| Exportar leads a CSV/Excel | Media | Ya se puede con SQLite, falta botón en UI |
| Dashboard de facturación | Baja | Depende de datos reales de ISIS |
| App PWA (instalable en celular) | Baja | Service worker + manifest.json |
| Webhooks de ISIS (si el proveedor los soporta) | Baja | Reemplazaría el polling |

---

*Documento mantenido por el equipo de desarrollo.*
*Última actualización: Junio 2026*
