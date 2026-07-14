# Playbook · Sesión de Entrega / Construcción

**Objetivo del tipo de sesión:** producir entregables de Baigorria con **terminado profesional e industrial** — código que corre, se verifica y el cliente puede operar.

> Este es el playbook que **gobierna Baigorria** (es un proyecto de entrega). Se corre junto con `00-como-trabajamos.md` y el `DOCUMENTO-MAESTRO.md`.

## Regla de oro

La debilidad del fundador es el **cierre ordenado y el diseño**. Por lo tanto: **nada se da por entregado sin pasar por el gate del `@reviewer`**. Un entregable "de vibe coder sin cerrar" contradice el posicionamiento industrial que le vendemos al cliente.

## Cómo se corre (motor de entrega)

1. **Una restricción a la vez** (Goldratt): atacar el cuello de botella #1 del maestro, no todo junto.
2. **Plan antes que código** (`plan`, v4 Pro): plan en pasos chicos y verificables (qué / dónde / cómo verificar / quién). Esperar OK.
3. **Implementar** (`build`): delegar los pasos mecánicos y acotados a `@executor`; quedarse la arquitectura y las decisiones.
4. **Gate de terminado** (`@reviewer`): revisar contra convenciones y bugs reales antes de cerrar. Sin inflar severidad.
5. **Adaptar sólo lo necesario** con automatización. Sin sobre-ingeniería (R3 — MVP first).
6. **Instrumentar y medir**: cada entrega deja **métricas de antes/después** (alimentan el caso insignia — pendiente en el maestro).
7. **Documentar y transferir**: el conocimiento queda en el cliente (independencia del dueño). La adopción/capacitación es parte del trabajo, no un extra.

Detalle del flujo de agentes y modelos: `docs/motor-de-entrega.md`.

## Checklist de "listo para entregar"

- [ ] Respeta las Reglas de Oro (R1–R5) y el stack canónico del maestro.
- [ ] Verificado: API/web levantan y el cambio hace lo pedido (comando o hito en UI).
- [ ] Pasó el gate del `@reviewer` (aprobado / aprobado con menores).
- [ ] Roles OK: logística (Martín) **no** ve facturación.
- [ ] Sin secretos en el código; PII fuera de git.
- [ ] Memoria al día (ESTADO + REGISTRO-DECISIONES; maestro si cambió el rumbo).

## Salida esperada

- Entregable cerrado y profesional, verificado.
- Memoria actualizada + commit propuesto (Conventional Commits).
