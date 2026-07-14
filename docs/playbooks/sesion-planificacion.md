# Playbook · Sesión de Planificación

**Objetivo del tipo de sesión:** diseñar una feature/refactor o tomar una decisión de rumbo de Baigorria, **antes** de escribir código.

## Cómo se corre

1. Leer maestro + registro + `ESTADO.md` + el código relevante (usar `@explore` para búsquedas amplias sin llenar el contexto).
2. Tomar **una cosa a la vez** (una feature, un refactor, una decisión). No mezclar.
3. **Dirigido por preguntas** cuando hay ambigüedad: preguntar, sintetizar, devolver la decisión escrita para validar. Si el dueño está con poca energía de decisión, **proponer una respuesta recomendada con fundamento** y dejarla como `REVISABLE`, en vez de trabar el avance.
4. Producir un **plan en pasos chicos y verificables** (qué / dónde / cómo verificar / quién ejecuta). No escribir código todavía.
5. Marcar **tensiones, riesgos y lo BLOQUEADO** (ej. ISIS real depende del proveedor) aunque no se resuelvan en el momento.

*(Atajo: el comando `/feature <desc>` arranca este flujo con el agente `plan`.)*

## Salida esperada

- Plan aprobado, listo para pasar a `sesion-entrega.md`.
- Sección del maestro actualizada si la decisión cambia el rumbo.
- Entradas nuevas en `REGISTRO-DECISIONES.md` (con estado).
- Próxima acción identificada.
