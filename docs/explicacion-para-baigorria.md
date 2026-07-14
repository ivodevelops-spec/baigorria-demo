# Baigorria Industrial — Sistema de Gestión
## Lo que estamos construyendo para ustedes

**Junio 2026**

---

## El problema de hoy

Todos los días el equipo de ventas hace tareas que un sistema podría hacer solo:

- Mandar facturas por mail una por una
- Avisarle al cliente que su pedido está listo
- Consultar en qué estado está cada pedido
- Responder consultas de leads que no son clientes
- Coordinar con el depósito qué pedido armar primero

Todo eso **saca tiempo de lo que realmente importa: salir a la calle y vender.**

---

## La solución: un tablero único

Una sola pantalla desde la computadora o el celular donde van a ver todo lo que necesitan para trabajar, sin abrir el ERP, sin tocar planillas, sin buscar archivos.

```
┌──────────────────────────────────────────────────┐
│           BAIGORRIA INDUSTRIAL                    │
│                                                   │
│   236 leads    48 pedidos    12 clientes          │
│                                                   │
│   🔥 Leads para llamar hoy                        │
│   📦 Pedidos en producción                        │
│   📊 Última actividad                             │
│                                                   │
│   [Leads] [Pedidos] [Clientes] [Stock] [Ventas]   │
└──────────────────────────────────────────────────┘
```

---

## Qué van a poder hacer

### 1. Ver todos los leads en un solo lugar

Cada vez que alguien completa un formulario de Facebook o Google, aparece automáticamente en el sistema. Ya no hace falta entrar a Meta Business a revisar.

Los leads tienen un **semáforo** para que sepan a quién llamar primero:

- 🟢 **Verde: prioridad.** Buloneras, ferreterías, distribuidores.
- 🟡 **Amarillo: media.** Talleres, gomerías.
- ⚪ **Gris: baja.** Particulares o consultas genéricas.

Así no pierden tiempo respondiendo consultas que no van a ningún lado.

### 2. Ver los pedidos sin entrar al ERP

El sistema se conecta solo con ISIS y trae los pedidos automáticamente. Cada 5 minutos se actualiza.

Desde la misma pantalla van a ver:

| Pedido | Cliente | Kilos | Estado | Prioridad |
|--------|---------|-------|--------|-----------|
| PED-1042 | Bulonera Central | 850 kg | Facturado | Alta |
| PED-1043 | Ferretería El Tornillo | 320 kg | En proceso | Media |

**Martín** va a poder cambiar la prioridad directamente desde acá (alta, media, baja). Sin tocar el Drive.

**Florencia** va a ver el estado de cada pedido sin preguntarle a nadie.

### 3. Avisarle al cliente automáticamente

Hoy, cuando un pedido se factura, alguien tiene que buscar el número del cliente, escribirle por WhatsApp, adjuntar la factura, mandar todo.

Con el sistema, esto pasa solo:

> *El pedido se factura en ISIS → el sistema lo detecta → busca la factura en la computadora → la manda por WhatsApp al cliente con un mensaje automático.*

Ni Florencia ni nadie del equipo mueve un dedo. El cliente recibe su factura en minutos.

Lo mismo va a pasar cuando el pedido se despache: el cliente recibe el aviso automáticamente.

### 4. Un registro de todo lo que pasó

El sistema guarda un historial de cada notificación que se envió: a quién, cuándo y qué decía. Si alguna vez hay que revisar si un cliente recibió su factura, está todo registrado.

---

## Cómo se va a ver

### Pantalla de inicio

Apenas abren el sistema, ven de un vistazo lo más importante:

- Cuántos leads nuevos entraron hoy
- Cuántos pedidos hay en producción
- Los leads prioritarios que hay que llamar
- Los últimos pedidos que cambiaron de estado

### Leads

La lista completa de consultas, con nombre, empresa, rubro, provincia y el semáforo de color. Se puede filtrar por estado, por vendedor, por rubro.

### Pedidos

Todos los pedidos que salieron de ISIS, con su estado actual, los kilos y la prioridad de armado. Martín puede cambiar la prioridad con un clic.

### Clientes

La lista de clientes que ya compraron, con sus datos de contacto, provincia y vendedor asignado.

### Stock

Un panorama del stock por tipo de producto, para saber qué hay disponible y qué está bajo.

---

## Cuándo lo van a tener

| Etapa | Qué se entrega |
|-------|---------------|
| **Ya listo** | CRM de leads (lo que ya están usando) + tablero de pedidos, clientes, stock y ventas con datos de ejemplo |
| **Julio** | Conexión con ISIS. Los pedidos y clientes reales aparecen en el sistema |
| **Agosto** | Notificaciones automáticas por WhatsApp cuando un pedido se factura o se despacha |
| **Septiembre** | Adjuntar la factura en PDF automáticamente en el mensaje de WhatsApp |

---

## Qué necesitamos de ustedes

Para que el sistema funcione con datos reales, necesitamos acceso a las bases de datos relevantes al proyecto:

- **Pedidos del ERP ISIS.** Vista de solo lectura con los pedidos, sus estados, clientes asociados, kilos y número de factura.
- **Clientes del ERP ISIS.** Vista con los datos de contacto de cada cliente: razón social, provincia, localidad, teléfono y mail.
- **Artículos y stock.** Para que el tablero muestre qué productos tienen disponibles y en qué cantidad.
- **Base de datos de pedidos de Martín.** La base donde hoy asigna prioridad de armado, para que eso quede todo dentro del mismo sistema.

El proveedor de ISIS ya sabe hacer esto — es abrir vistas de solo lectura, algo estándar. No afecta en nada al funcionamiento diario del ERP.

El resto lo hacemos nosotros.

---

## Qué más se puede agregar a futuro

El sistema está pensado para crecer según lo necesiten. Algunas cosas que se pueden sumar más adelante:

**Chatbot de WhatsApp inteligente.** Cuando un lead escribe por primera vez, el sistema ya le responde automáticamente, le hace preguntas básicas (qué busca, qué rubro es, cuánto calcula comprar) y según lo que contesta lo deriva al vendedor que corresponde. Todo sin que nadie del equipo tenga que atender esa primera consulta.

**Respuestas automáticas a preguntas frecuentes.** Si un cliente escribe "¿tienen espárragos de competición?" o "¿cuánto sale el envío a Córdoba?", el bot le responde solo con la info que ya tienen cargada.

**Reportes automáticos.** Todos los lunes a la mañana, un resumen por mail o WhatsApp con lo que pasó la semana: cuántos leads entraron, cuántos se contactaron, cuántos cerraron, cuánta facturación hubo. Sin tener que armar nada a mano.

**Seguimiento automático de leads.** Si un lead recibió el catálogo pero no respondió, el sistema le manda recordatorios automáticos a los 2 días y a la semana. Si sigue sin responder, se archiva solo. El vendedor se concentra en los que sí contestan.

**Conexión con más bases.** Sumar al tablero los datos de la base de ventas mensuales, tipo de cambio, costos de materiales. Todo en el mismo lugar.

**Panel de facturación.** Ver desde el celular cuánto se facturó este mes, por cliente, por producto. Sin abrir el ERP.

---

## Preguntas frecuentes

**¿Esto reemplaza al ERP?**
No. El ERP sigue funcionando para facturación, contabilidad y todo lo que ya hace. El sistema nuevo es una capa arriba que les muestra lo importante sin tener que entrar al ERP para todo.

**¿Los datos son nuestros?**
Sí. Todos los datos quedan en sus servidores. Si algún día no quieren seguir con el sistema, se pueden llevar todo.

**¿Funciona en el celular?**
Sí. Se abre desde cualquier navegador, en la computadora o en el teléfono.

**¿Es difícil de usar?**
Es una tabla, como el Excel que ya usan. Pero los datos aparecen solos en vez de cargarlos a mano.

**¿Qué pasa si ISIS está apagado?**
El sistema guarda la última información que leyó. Si ISIS no está disponible (ej. fuera de horario), el tablero muestra los datos de la última sincronización. Ni bien ISIS vuelve a estar activo, se actualiza solo.

---

*Si tienen cualquier duda, nos juntamos 15 minutos y se los muestro en pantalla.*

*Ivo Paolantonio — ivopaolantoniopersonal@gmail.com — +54 9 11 3117-4279*
