# Motor de entrega — IA como palanca interna

> Cómo entregamos Baigorria con orquestación de agentes de opencode. Configurado en `opencode.json` y `.opencode/`.
> Este documento reencuadra al viejo `WORKFLOW-AGENTES.md` bajo el sistema operativo de la Agencia.
> Última actualización: **2026-07-09**.

---

## Idea central

Maestro de la Agencia §9: **"IA como palanca interna, no como pitch."** Usamos la orquestación para entregar con **calidad de equipo senior siendo pocos**. El cliente ve calidad institucional; nunca le vendemos "somos una empresa de agentes IA".

Para entregas grandes lo que escala **no es un modelo, es la estrategia**: un modelo fuerte que **piensa**, uno rápido y barato que **ejecuta**, y otro que **revisa** (el gate de terminado que cubre la debilidad del fundador). Más descomposición de tareas y memoria al día.

```
   PLAN (cerebro, v4 Pro)  ──►  BUILD (orquesta)  ──►  @executor (manos, Flash)
        analiza/diseña            implementa             tareas acotadas
                                       │
                                       └──►  @reviewer (v4 Pro, read-only) = gate de terminado
```

## Roles (definidos en `.opencode/agents/`)

| Agente | Tipo | Modelo | Para qué |
|--------|------|--------|----------|
| `plan` | primary | v4 Pro | Pensar/diseñar features y refactors. **No edita.** Tab para entrar. |
| `build` | primary | v4 Pro | Implementar y orquestar; delega lo mecánico a `@executor`. |
| `executor` | subagent | **v4 Flash** | Tareas de código acotadas y bien especificadas. Rápido y barato. |
| `reviewer` | subagent | v4 Pro | **Gate de terminado** (finisher): revisa contra convenciones y busca bugs reales, sin inflar severidad. |
| `explore` | subagent (built-in) | — | Búsqueda read-only en el repo sin llenar el contexto principal. |

> `plan`, `build` y `explore` son built-in de opencode. `plan` se sobreescribe (modelo + permisos + prompt en `plan.md`); `build` usa el modelo global (v4 Pro); `executor` y `reviewer` son propios.

## Cómo conecta con los playbooks

- El motor implementa el playbook **`sesion-entrega.md`**: plan → build → `@executor` → gate `@reviewer`.
- La planificación de una feature usa **`sesion-planificacion.md`** con el agente `plan`.
- La **regla de oro** (nada se entrega sin pasar por el finisher) se materializa en el paso obligatorio del `@reviewer`.

## Comandos (`.opencode/commands/`)

- `/feature <descripción>` → arranca el flujo: plan en pasos → tu OK → implementar + revisar.
- `/cerrar-sesion` → aplica el protocolo de memoria (actualiza ESTADO + REGISTRO-DECISIONES + maestro si cambió el rumbo; propone commit).

## Flujo recomendado para una feature

1. `/feature agregar export CSV de leads` (o entrá a **plan** con Tab).
2. Leé el plan, ajustalo, dá el OK.
3. Pasá a **build** (Tab) → implementa; delega pasos mecánicos a `@executor`.
4. `@reviewer revisá los cambios` (gate de terminado).
5. Verificá (levantar API/web, correr lo que corresponda).
6. `/cerrar-sesion` para dejar la memoria al día.

## Principios de entrega

- **Cortá chico.** Tareas que un ejecutor hace de una. Es lo que más mueve la aguja.
- **Specs antes que código.** El plan es barato, el rework no.
- **Cuidá el contexto.** Usá `@explore` para buscar y subagentes para trabajo paralelo.
- **Memoria al día.** Maestro + registro + estado + conocimiento-base evitan el drift entre sesiones.
- **Revisión honesta.** CRÍTICO / MENOR / PEDANTE; no todo es "crítico".

## Cambiar el modelo ejecutor (Flash)

El `executor` apunta a `deepseek/deepseek-v4-flash` (ID confirmado en `~/.cache/opencode/models.json`). Si Flash dejara de estar disponible, poné `deepseek/deepseek-v4-pro` en `.opencode/agents/executor.md`.

## Importante

La config de opencode se carga al iniciar y **no es hot-reload**. Tras editar agentes/comandos, **salí y reiniciá opencode**.
