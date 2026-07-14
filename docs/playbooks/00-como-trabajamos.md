# 00 · Cómo trabajamos *(leer primero, siempre)*

Este es el protocolo de operación de **Baigorria**, el **primer cliente de la Agencia** (Automation Agency / "Hermes"). Al iniciar cualquier sesión se lee esto + el `DOCUMENTO-MAESTRO.md` + el `REGISTRO-DECISIONES.md`, y después el playbook del tipo de sesión.

> **Baigorria es un proyecto de ENTREGA.** En la escalera de la Agencia (Diagnóstico → Panel de Control → Rediseño de la Restricción → Sistema Operativo) ya está en implementación real. Por eso el playbook que lo gobierna es sobre todo `sesion-entrega.md`.

---

## Principios (heredados del sistema operativo de la Agencia)

1. **El documento maestro es el norte.** Nada se ejecuta si contradice `DOCUMENTO-MAESTRO.md`. Ante duda de rumbo, volver a él.
2. **Comemos nuestra propia comida.** Le vendemos a Baigorria una operación ordenada, medible y que no depende de personas; entregamos operando así: procesos documentados, decisiones registradas, nada en la cabeza.
3. **Una restricción a la vez** (Goldratt). No optimizar lo que no es el cuello de botella actual. La restricción vigente vive en el maestro.
4. **Toda decisión se asienta** en `REGISTRO-DECISIONES.md` con su porqué, qué se descartó y su estado.
5. **Terminado profesional o no sale.** La debilidad del fundador es el cierre/diseño; en Baigorria eso se cubre con el **gate del `@reviewer`** antes de dar algo por entregado (ver `sesion-entrega.md`).
6. **IA como palanca interna, no como pitch.** Usamos la orquestación de agentes para entregar con calidad de equipo senior siendo pocos; al cliente le mostramos calidad institucional, nunca "somos una empresa de agentes IA". Detalle en `motor-de-entrega.md`.

---

## La memoria del proyecto (dónde vive todo)

Los agentes **no tienen memoria entre conversaciones**. La memoria vive en el repo:

| Archivo | Rol |
|---|---|
| `docs/playbooks/00-como-trabajamos.md` | **Este** — protocolo de operación (se lee primero). |
| `docs/DOCUMENTO-MAESTRO.md` | **El norte** — qué es el sistema, la restricción actual, la posición en la escalera, el antes→después. |
| `docs/REGISTRO-DECISIONES.md` | Bitácora de decisiones (qué, por qué, qué se descartó, estado). |
| `docs/CONOCIMIENTO-BASE.md` | Dominio del cliente (productos, keywords, rubros, scoring, roles). |
| `docs/ESTADO.md` | Foto de entrega + próxima acción. |
| `docs/motor-de-entrega.md` | Cómo entregamos con agentes (palanca IA interna). |
| `AGENTS.md` | Puntero corto + convenciones técnicas no-negociables. |

---

## Al arrancar una sesión

1. Leer maestro + registro (contexto) + `git log --oneline -20`.
2. Identificar el **tipo de sesión** y abrir su playbook:
   - Construir / integrar / entregar código → `sesion-entrega.md`.
   - Diseñar una feature/refactor o tomar una decisión de rumbo → `sesion-planificacion.md`.
3. Declarar el **objetivo de la sesión** en una frase.

## Al cerrar una sesión

1. Actualizar `DOCUMENTO-MAESTRO.md` si cambió algo estructural (restricción, escalera, alcance).
2. Actualizar `ESTADO.md` (qué se hizo, qué falta, gotchas nuevos, próxima acción).
3. Registrar decisiones nuevas en `REGISTRO-DECISIONES.md` (con estado).
4. Proponer **un** commit (Conventional Commits). No commitear sin OK.

*(Atajo: el comando `/cerrar-sesion` aplica este protocolo.)*

---

## Estado actual (rápido)

- **Fase:** Baigorria **dio el OK** → pasa de demo a **entrega real**.
- **Posición en la escalera:** Nivel 1 (Panel de Control) entregado y aceptado; arrancando **Nivel 2 (Rediseño de la Restricción)**.
- **Restricción actual:** que los datos entren solos y las notificaciones salgan solas (automatizaciones n8n + integración ISIS real). El detalle vive en el maestro.
