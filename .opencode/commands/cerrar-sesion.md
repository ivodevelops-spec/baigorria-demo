---
description: Cierra la sesión aplicando el protocolo de memoria (ESTADO + REGISTRO-DECISIONES + commit sugerido)
agent: build
---

Aplicá el protocolo de cierre de Baigorria (ver @docs/playbooks/00-como-trabajamos.md) para cerrar el trabajo de esta sesión.

Estado actual del repo:
!`git status`

Commits recientes:
!`git log --oneline -10`

Cambios sin commitear:
!`git diff --stat`

Hacé:
1. Actualizá @docs/DOCUMENTO-MAESTRO.md si cambió algo estructural (restricción, escalera, alcance).
2. Actualizá @docs/ESTADO.md con el nuevo estado (qué se hizo, qué falta, gotchas nuevos, próxima acción).
3. Agregá las decisiones nuevas a @docs/REGISTRO-DECISIONES.md en la tabla de la sesión de hoy (# / decisión / por qué / estado). No borres histórico.
4. Proponé UN commit con Conventional Commits que agrupe los cambios. NO ejecutes el commit: mostrame el mensaje y esperá mi confirmación.
