# REGISTRO DE DECISIONES — Baigorria Industrial

> Bitácora de decisiones del proyecto. Cada entrada: **qué** decidimos, **por qué**, **qué descartamos** y **estado**.
> Estados: `FIRME` (cerrado) · `REVISABLE` (decidido, se puede revisar) · `A VALIDAR` (necesita dato real) · `ABIERTO` (sin resolver) · `HISTÓRICA` (revertida/ya no aplica, se conserva por trazabilidad).
> Ver protocolo en `playbooks/00-como-trabajamos.md`.

---

## Sesión 2026-06-24 — Reset + arquitectura + demo + memoria

| # | Decisión | Por qué / qué se descartó | Estado |
|---|---|---|---|
| D1 | **Reset de producción:** se eliminó el CRM viejo (Node+Express+SQLite single-file) y se arrancó de cero. | "Producción en cero", base limpia. `crm/leads.db` (236 leads reales) preservado para migrar. | FIRME |
| D2 | Arquitectura inicial: **NocoDB + PostgreSQL**. | UI, roles y branding "gratis", mínimo código. → **Revertida en D8.** | HISTÓRICA |
| D3 | **`leads.db` son datos reales:** preservar y migrar, no descartar. | Único activo real de dominio al arrancar. | FIRME |
| D4 | **Demo = datos reales de leads + resto mock.** | Pedidos/clientes/stock/ventas mock hasta conectar ISIS. | FIRME |
| D5 | **WhatsApp = Evolution API** (no Cloud API directo). | Abstrae la API de Meta; decisión del dev. | FIRME |
| D6 | **ISIS = capa adapter modular, vía API, reemplazable.** El sistema nunca habla con ISIS directo; consume un contrato JSON normalizado (en demo lo sirve `mock-isis-api`). | Desacoplar del proveedor ISIS (riesgo externo) y poder reemplazar el ERP a futuro. | FIRME |
| D7 | **Cliente puntual, no producto.** No sobre-invertir en multi-tenant/replicabilidad. | Foco en cerrar este cliente (relaja la R4 original de "replicable"). | FIRME |
| D8 | **PIVOT: NocoDB DESCARTADO → full custom (React+Vite + API Express).** | Al abrir NocoDB, los permisos por columna por rol (ocultar facturación a logística) y el branding/white-label están detrás de la licencia **Enterprise (paga)**, y la UI no convencía para vender. Custom da control 100%, sin licencias, recupera el "wow". Se reusó todo lo previo (Postgres, datos limpios, mock-ISIS, n8n). | FIRME |
| D9 | (Técnica) NocoDB sobre su SQLite interno. | Su guard anti-SSRF bloqueaba Postgres en IP privada de Docker. Ya no aplica tras D8; queda el gotcha documentado. | HISTÓRICA |
| D10 | Precio: USD 800 llave en mano **+ USD 120/mes** (bajado desde USD 3.200). | Decisión comercial del dev. → **Revisada en D14** (se quita la mensualidad). | HISTÓRICA |
| D11 | **Demo seasoning:** marcar ~5 leads reales como "Cerrado" para que el funnel se vea vivo en la demo. | La tasa real es 0% (no hay cierres cargados); es para el pitch. | FIRME |
| D12 | **Exposición de la demo: túnel cloudflared gratis** (no VPS pago). | Mínimo esfuerzo/costo. Oracle Free / VPS como opción persistente a futuro. | REVISABLE |
| D13 | Memoria del proyecto: archivos versionados (AGENTS + ESTADO + DECISIONES) + intención de sumar **mem0**. | Memoria entre conversaciones. → mem0 reemplazado por archivos en D14. | REVISABLE |
| D14 | **Precio: solo USD 800 llave en mano, sin mensualidad** (pago 50/50). | Se removió el plan mensual del presupuesto. La memoria de archivos reemplaza a mem0 como sistema permanente y privado. | FIRME |
| D15 | **Documento madre de conocimiento (`CONOCIMIENTO-BASE.md`).** Consolida el dominio: catálogo/jerarquía, keywords automotrices (Corsa, Peugeot 208, Hilux, etc.), rubros, scoring, estados, roles, geografía, stack, glosario. "Tuerca" excluida de keywords de captura (foco: bulones y espárragos). | Fuente única de dominio que alimenta al agente, al chatbot de WhatsApp y a las campañas. | FIRME |
| D16 | **Deck sin precios + deploy Netlify** (https://earnest-cassata-9af29a.netlify.app). | El precio se envía aparte según el cliente; el deck va sin números. | FIRME |

## Sesión 2026-06-29 — Orquestación de agentes opencode

| # | Decisión | Por qué / qué se descartó | Estado |
|---|---|---|---|
| D17 | **Workflow de agentes (planner + executor + reviewer).** `plan` (v4 Pro, no edita), `executor` (v4 Flash, tareas acotadas), `reviewer` (v4 Pro, revisión honesta); comandos `/feature` y `/cerrar-sesion`; `model` global v4 Pro. | Para tareas grandes lo que escala es la estrategia (modelo fuerte planea, modelo rápido ejecuta, descomposición + memoria al día), no un único modelo (sufre drift/loops). ID `deepseek/deepseek-v4-flash` confirmado en la caché de modelos. → Reencuadrado en D18 como "motor de entrega". | FIRME |

## Sesión 2026-07-09 — Adopción del sistema operativo de la Agencia

| # | Decisión | Por qué / qué se descartó | Estado |
|---|---|---|---|
| D18 | **Baigorria adopta el sistema operativo de la Agencia y es su CLIENTE #1.** Migración a estructura document-centric: `DOCUMENTO-MAESTRO.md` (norte) + `REGISTRO-DECISIONES.md` (tablas + estados) + `playbooks/` (`00-como-trabajamos`, `sesion-entrega`, `sesion-planificacion`). `AGENTS.md` pasa a puntero corto; `opencode.json` apunta `instructions` a los docs núcleo (como el repo de la Agencia). | Cambio de paradigma: el método de trabajo probado en la Agencia (maestro como norte, decisiones registradas, trabajo por tipo de sesión, "comemos nuestra propia comida", una restricción a la vez) se aplica a Baigorria como primer proyecto de entrega. Se tomó como referencia la carpeta `Automation Agency` (no se modificó). | FIRME |
| D19 | **La orquestación de agentes se CONSERVA, reencuadrada como "motor de entrega / palanca IA interna"** (`WORKFLOW-AGENTES.md` → `motor-de-entrega.md`). El `@reviewer` es el "gate de terminado" (finisher). | Maestro de la Agencia §9: "IA como palanca interna, no como pitch". No contradice el paradigma document-centric: la Agencia no tiene agentes porque su repo es de planificación/ventas; Baigorria es entrega de código, su lugar natural. Se descartó eliminarla. | FIRME |
| D20 | **Baigorria dio el OK → pasa de demo a entrega real.** Nivel 1 (Panel de Control) aceptado; arranca Nivel 2 (Rediseño de la Restricción). | El cliente aprobó avanzar. Cambia el objetivo de etapa: de "demoable para vender" a "entregar el sistema en producción". | FIRME |

## Sesión 2026-07-13 — Kickoff Fase 2 (build)

| # | Decisión | Por qué / qué se descartó | Estado |
|---|---|---|---|
| D21 | **Motor de sync ISIS = script Node (`api/sync-isis.js`).** Mismo código para mock y ISIS real: solo cambia `ISIS_API_URL`. UPSERT idempotente por clave natural. n8n queda como *scheduler* para el deploy (no como motor). | Verificable y testeable local ya (sin depender de un n8n corriendo); doble como adapter real (WS2). Se descartó autorear el workflow n8n a mano ahora (frágil, sin verificar). Plan `docs/PLAN-FASE2.md`. | REVISABLE |
| D22 | **Campos de logística en `pedidos`: `tipo_entrega` (retiro/expresa/flete_baigorria) + `cantidad_bultos`.** Dueño: logística — el sync **NO los pisa** (igual que `prioridad_armado`/`notas`). Se agrega `fecha_factura` (de ISIS) para el lead time. | Migrar el proceso de logística de Sheets al CRM (relevamiento 13/07). Ownership por `MODELO-DATOS §3`. Campos exactos a confirmar con Martín. | REVISABLE |
| D23 | **Métrica nueva del dashboard: "lead time de entrega"** (`fecha_pedido → fecha_factura`), visible a todos los roles. Ticket promedio se conserva en Ventas. `facturacionMes` pasa a usar el último período con datos (no `'2026-06'` hardcodeado). | Pedido del relevamiento (cambiar "ticket promedio" por lead time). Lead time es métrica de logística. | FIRME |
| D24 | **`/api/clientes` abierto a logística en lectura** (sin montos). Antes le daba 403. | Martín necesita ver clientes para picking/despacho; `clientes` no tiene facturación. | FIRME |
| D25 | **Usuarios config-driven** (`api/users.json` gitignored + `api/users.example.json` template del equipo: 3 vendedores + administración + online + 2 logística + gerencia). Reemplaza el hardcode de 3. | Equipo multi-vendedor (relevamiento). Agregar usuario = editar JSON, sin tocar código. Nombres/emails reales bloqueados (cliente). Secretos fuera de git (R2). | REVISABLE |
| D26 | **Deploy persistente DIFERIDO — se sigue local por ahora.** Los artefactos de deploy NO se escriben hasta que toque deployar (con el VPS real). | Decisión del fundador ("deploy de lo último; seguimos local"). Escribir Dockerfiles/Caddyfile sin ejecutar = infra sin verificar (bit-rot). | FIRME |

---

## Acciones pendientes

- [ ] **Gestionar acceso al proveedor de ISIS** (destraba la Fase 3 — integración real). Dueño: dev + cliente.
- [ ] **Capturar métricas antes/después** en go-live (materia prima del caso insignia). Dueño: dev. Ver `DOCUMENTO-MAESTRO.md §10`.
- [ ] **Deploy persistente** (VPS + dominio) — hoy es túnel cloudflared temporal.
- [ ] **Reflejar en el registro de la Agencia** que Baigorria es el cliente #1 (esa carpeta no se toca desde este repo). Dueño: dev.

## Preguntas abiertas

- **mem0:** ¿se instala como capa de memoria o queda descartado definitivamente a favor de los archivos versionados? (D13/D14 lo dejó reemplazado, pero sin decisión final).
- **ISIS:** ¿el acceso será API REST o vistas SQL vía VPN/SSH? Depende del proveedor. Afecta el adapter.
- **Nombre de la Agencia:** "Hermes" es provisional (se cierra en la Sesión 6 del plan de la Agencia); no impacta a Baigorria hoy.
