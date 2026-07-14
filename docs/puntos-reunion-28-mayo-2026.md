# Puntos charlados en la reunión — Baigorria Industrial
## 28 de Mayo 2026
### Participantes: Florencia (comercial), Martín (logística), Ivo

---

## 1. EL PROBLEMA CENTRAL

1. El equipo comercial pierde demasiado tiempo en tareas operativas repetitivas
2. Necesitan liberar horas para que los vendedores salgan a la calle y hagan venta estratégica
3. Hoy están mandando facturas por mail a mano, respondiendo consultas una por una
4. Están respondiendo a "una cantidad muy grande de leads que no están ajustados al negocio"
5. Necesitan automatismos para que esas tareas no sangren el tiempo del equipo
6. "Necesitamos que salgan a la calle" — si están en la oficina mandando facturas, no están vendiendo
7. Lo que buscan es "más tiempo humano tradicional en resolver otras cuestiones" (estratégicas)

---

## 2. SOBRE LAS BASES DE DATOS E INFORMACIÓN EXISTENTE

### Bases de datos que maneja el cliente
8. **Base de ventas (Ivo):** trackea toda la venta al detalle — artículo por artículo, cliente por cliente, cantidad en unidades y kilos, precio de venta, venta total, costo de material, costo de tratamiento, caja, geolocalización, lista de precios online/offline, canal de venta, precio en dólares, costo en dólares, país, código de país, objetivo mercado interno, objetivo mercado externo
9. **Base de pedidos:** similar a la de ventas pero sin costos ni objetivos
10. **Base reducida de pedidos (Drive):** tablero de interacción entre ventas y logística — solo número de pedido, cliente, fecha, kilos totales. Se nutre automáticamente del ERP con un query
11. **Base de stock:** stock agregado por nivel (no desagregado por SKU). Ej: "cuántos espárragos en kilos tenemos, en qué estado están"
12. **Base de clientes:** provincia, localidad, datos de contacto. Pivotea con la de ventas
13. **Base de tipo de cambio:** cotización Banco Central día por día
14. **Base de niveles de agregación de artículos:** jerarquía de 4 niveles — Categoría (Bulón), Subcategoría (Bulón de masa), Tipo (Bulón liviano), Variante específica
15. **Base de máquinas/materiales:** con qué material y en qué máquina se hace cada artículo
16. "Los datos que se crean a través de las campañas vienen a ese Drive y los podemos tomar y usar"

### Sobre el ERP ISIS
17. Tienen ERP ISIS en un servidor local Windows (no en la nube)
18. El proveedor de ISIS les ofreció una versión cloud con fee mensual — Ivo preguntó si eso facilitaría la integración
19. Respuesta: "si bien lo tenemos local, el respaldo de la base es nuestro. Las integraciones son desarrollos por API o por JSON. Nos generan tablas que son vistas, que son las que usamos para integrar"
20. Conclusión: local sirve, no hace falta migrar a cloud
21. ISIS tiene toda la parte contable (AFIP, Ingresos Brutos), fórmulas de producción, etc.
22. "No es nada muy complejo. Es una operación que se hace compleja en el día a día, pero en un software tendría que ser súper simple"

### Sobre el Drive (Google Sheets) de pedidos
23. En el Drive de pedidos interactúa ventas con logística
24. Ahí le asignan prioridad de armado: alta, media, baja
25. También marcan si el cliente retira por local
26. También el estado: en proceso, terminado, facturado
27. "Lo que nosotros cuando lo cargamos en el ERP hacemos un copy paste a ese Excel"
28. El Drive es una vista reducida — no tiene costos ni datos sensibles de administración
29. "Yo tengo información sobre facturación con un montón de cosas que no quiero que vean desde logística"

---

## 3. SOBRE LOS PEDIDOS Y SUS ESTADOS

30. **Estados de pedido:** En proceso → Terminado → Facturado → Despachado
31. **En proceso:** se está armando en el depósito
32. **Terminado:** armado completo, esperando facturación
33. **Facturado:** factura emitida, listo para despacho
34. **Despachado:** enviado al cliente
35. **Retira por local:** el cliente viene a buscarlo, no se despacha
36. Cuando un pedido se factura, se genera un PDF que se guarda en el servidor local
37. El PDF tiene el número de factura como nombre/identificador

---

## 4. SOBRE LOS AUTOMATISMOS QUE YA PROBARON

38. "Probé ayer que cuando el pedido aparece facturado, aparece un botón que le podés enviar por WhatsApp el estado"
39. El mensaje actual: "Tu pedido está facturado, se te va a despachar en estos días"
40. "Así como manda eso, podría mandar frente a otro cambio de estado, otro tipo de cosas"

---

## 5. LO QUE QUIEREN LOGRAR (REQUERIMIENTOS)

41. Una interfaz para interactuar con los datos sin tocar la base de datos
42. "Lo que me preocupa más que la base de datos es la interfaz de interacción con los datos"
43. No quieren entrar a "toquetear la base" como están haciendo hoy

### Notificaciones automáticas por cambio de estado
44. Que el sistema notifique automáticamente al cliente cuando cambia el estado del pedido
45. Posiblemente por WhatsApp
46. Que aplique a todos los cambios de estado, no solo "facturado"

### Adjuntar facturas PDF en WhatsApp
47. Cuando un pedido se factura, que el sistema busque el PDF de la factura en el servidor local
48. Que lo adjunte al mensaje de WhatsApp automáticamente
49. "Que busque ese PDF y lo adjunte al mensaje de WhatsApp"

### Mejorar la calificación de leads
50. "Ajuste de funnel para reajustar los leads"
51. "Ubicarnos mucho mejor en los límites de qué armar y qué normar"
52. Necesitan filtrar mejor qué leads realmente aplican al negocio
53. "Están respondiendo a una cantidad muy grande de leads que no están ajustados a nuestro negocio"
54. Quieren "algo ad-hoc para ustedes, no genérico"

---

## 6. SOBRE LA ARQUITECTURA Y ENFOQUE

55. Ivo preguntó cuántas bases de datos distintas hay — "Porque son todas muy diferentes"
56. Respuesta: son bases que nutren otras bases. Varias capas
57. Florencia preguntó si la interfaz puede tomar datos de distintos lugares — Ivo confirmó que sí
58. Acordaron arrancar con un MVP chico: "armalo chico, como una propuesta MVP, y después de ahí vamos para arriba"
59. "Con que resuelva una parte quizás ya es un montón"
60. "Peldaño por peldaño me parece bien"

---

## 7. ROLES DEL EQUIPO

61. **Florencia** — Ventas / coordinación. Ve leads, pedidos activos, notificaciones
62. **Martín** — Logística / depósito. Ve pedidos con prioridad, kilos, estado de armado
63. **Administración** — Facturación, contabilidad (ERP, no en este sistema)
64. Florencia tiene datos de facturación que "no quiero que vean desde logística"

---

## 8. CLIENTES Y MERCADO DE BAIGORRIA

65. Fabrican bulones, tuercas, espárragos y productos de ferretería industrial
66. Sus clientes principales son buloneras (su principal target)
67. También casas de repuestos, ferreterías, distribuidores mayoristas
68. Gomerías y talleres mecánicos son menor prioridad

---

## 9. ACUERDOS Y PRÓXIMOS PASOS DE LA REUNIÓN

69. Armar una propuesta MVP chica y presentarla
70. Empezar peldaño por peldaño
71. Ivo: "me parece acorde como ir ajustando un poquito esto. Lo armamos y se los pasamos"

---

## 10. FRASES TEXTUALES CLAVE

72. *"Lo que estamos buscando es que nuestro equipo comercial tenga más tiempo disponible para hacer otras cosas que son más difíciles y más estratégicas"*
73. *"Tratar de todo lo que se pueda dejar ordenado y automatizado, que no sangre el tiempo"*
74. *"Ellos son más efectivos en términos de cash flow"*
75. *"Necesitamos que salgan a la calle"*
76. *"Están mandando facturas por mail, una especie de inversión [de tiempo al pedo]"*
77. *"Lo que me preocupa más que la base de datos es la interfaz de interacción con los datos"*
78. *"Los datos nosotros prácticamente para lo que estamos buscando, los tenemos todos online y están bastante limpios"*
79. *"Lo que me falta tratar acá es cómo interactúo con los datos sin entrar a toquetear la base, porque eso es lo que estamos haciendo básicamente"*
