# Estado de Integración de Leads — Baigorria Industrial

**Fecha:** 14 de julio de 2026  
**Revisión:** Sistema local + Google Sheets

---

## 🔍 Hallazgos

### 1. Sistema CRM (Local)
- ✅ **233 leads** cargados en el sistema (datos de seed)
- ✅ API funcionando correctamente (`http://localhost:3001`)
- ✅ Frontend funcionando (`http://localhost:5173`)
- ✅ Estructura de base de datos lista
- ✅ Sistema de autenticación y roles configurado

### 2. Google Sheets (Actual del Cliente)
- 📊 **URL:** https://docs.google.com/spreadsheets/d/1OooiJFo9_VlUDKn-VL6GjG04PO0NxywuxFvNuhye0Us/edit
- 📊 **Nombre:** "Baigorria CRM"
- 📊 **Contenido:** Leads reales capturados desde **17/03/2026** hasta la actualidad
- 📊 **Formato:** Estructura completa con campos de seguimiento (estado, vendedor, comentarios, etc.)

**Campos en el Sheet:**
1. Estado
2. Nombre
3. Apellido
4. WhatsApp / Teléfono
5. Email
6. Nombre de la Empresa
7. Rubro / Actividad
8. Provincia / Localidad
9. ¿Qué producto te interesa más?
10. Observaciones
11. Origen
12. Plataforma
13. Compra estimada mensual
14. Esperando rta
15. Fecha de ultimo contacto /mensaje
16. Vendedor
17. Comentarios
18. Proveedor Actual
19. Potencial de venta
20. Venta concretada
21. Fecha venta

### 3. Problema Detectado

❌ **NO HAY INTEGRACIÓN AUTOMÁTICA** entre Google Sheets y el CRM

**Situación actual:**
- Los leads **SÍ entran automáticamente** al Google Sheet (desde Meta Ads)
- Los leads **NO se replican** automáticamente al CRM
- El CRM tiene 233 leads de **ejemplo/seed** (no son los datos reales actuales del Sheet)

**Impacto:**
- El equipo comercial sigue trabajando en Google Sheets
- El CRM tiene datos desactualizados / de prueba
- **Duplicación de trabajo:** entran a Sheets pero no al sistema

---

## 🎯 Soluciones Propuestas

### Opción A: Migración Manual Única + Sync Automático (RECOMENDADO)

**Paso 1 — Migración inicial (una sola vez):**
- Exportar todos los leads actuales del Google Sheet
- Importarlos al CRM (reemplazar los 233 de seed)
- Verificar que todos los campos coincidan

**Paso 2 — Configurar webhook desde Google Sheets:**
- Usar Google Apps Script para detectar nuevas filas
- Cuando entre un lead nuevo → disparar webhook al CRM
- El CRM recibe el lead y lo inserta automáticamente

**Ventajas:**
- ✅ El Sheet sigue siendo la fuente de entrada (no rompe el flujo actual)
- ✅ Los leads se replican automáticamente al CRM
- ✅ El equipo puede elegir trabajar en Sheet o CRM
- ✅ Eventual transición suave a trabajar 100% en el CRM

**Desventajas:**
- ⚠️ Requiere configuración de Google Apps Script (15-30 minutos)

---

### Opción B: Webhook Directo de Meta → CRM (Elimina Google Sheets)

**Cambio arquitectónico:**
- Configurar webhook de Meta Ads apuntando directo al CRM
- Eliminar el paso intermedio de Google Sheets
- El equipo trabaja 100% en el CRM desde el día 1

**Ventajas:**
- ✅ Arquitectura más limpia (menos puntos de falla)
- ✅ El CRM es la fuente única de verdad
- ✅ Reportes y analytics directos desde el CRM

**Desventajas:**
- ⚠️ Requiere cambiar el webhook en Meta Business Suite
- ⚠️ El equipo pierde acceso al Sheet (cambio de hábito)
- ⚠️ Hay que migrar los leads históricos del Sheet al CRM

---

### Opción C: Sync Bidireccional (Complejo, NO recomendado)

Mantener Sheet y CRM sincronizados en ambas direcciones.

**Por qué NO:**
- ⚠️ Complejo de mantener
- ⚠️ Riesgo alto de conflictos y datos duplicados
- ⚠️ Overhead técnico innecesario

---

## 📋 Plan de Acción (Opción A — Recomendada)

### Fase 1: Migración Inicial (1-2 horas)

**1. Exportar datos del Sheet**
```bash
# Descarga manual desde Google Sheets:
File → Download → Comma Separated Values (.csv)
```

**2. Transformar formato**
Mapear columnas del CSV a la estructura del CRM:

| Sheet | CRM |
|-------|-----|
| Nombre | nombre |
| Apellido | apellido |
| WhatsApp / Teléfono | telefono |
| Email | email |
| Nombre de la Empresa | empresa |
| Rubro / Actividad | rubro |
| Provincia / Localidad | provincia |
| ¿Qué producto te interesa más? | producto |
| Observaciones | observaciones |
| Origen | origen |
| Plataforma | plataforma |
| Compra estimada mensual | compra_estimada |
| Estado | estado |
| Fecha de ultimo contacto | fecha_contacto |
| Vendedor | vendedor |
| Comentarios | comentarios |
| Proveedor Actual | proveedor_actual |
| Potencial de venta | potencial |
| Venta concretada | venta_concretada |
| Fecha venta | fecha_venta |

**3. Script de importación**
Crear script Node.js que:
- Lee el CSV
- Transforma cada fila a formato JSON
- Hace INSERT bulk a PostgreSQL
- Verifica que no haya duplicados (por email/teléfono)

**4. Verificación**
- Contar leads en el CRM: debe coincidir con el Sheet
- Verificar campos críticos: email, teléfono, empresa
- Probar búsqueda y filtros en el CRM

---

### Fase 2: Automatización (30 minutos)

**1. Google Apps Script**

Crear script en el Google Sheet:

```javascript
function onEdit(e) {
  // Detectar cuando se agrega una fila nueva
  const sheet = e.source.getActiveSheet();
  const range = e.range;
  
  // Solo disparar si es fila nueva en la primera columna
  if (range.getColumn() === 1 && range.getRow() > 1) {
    const row = sheet.getRange(range.getRow(), 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Transformar a formato JSON
    const lead = {
      fecha_ingreso: row[0],
      nombre: row[1],
      apellido: row[2],
      telefono: row[3],
      email: row[4],
      empresa: row[5],
      rubro: row[6],
      provincia: row[7],
      producto: row[8],
      observaciones: row[9],
      origen: row[10],
      plataforma: row[11],
      compra_estimada: row[12],
      estado: row[13],
      fecha_contacto: row[14],
      vendedor: row[15],
      comentarios: row[16],
      proveedor_actual: row[17],
      potencial: row[18],
      venta_concretada: row[19],
      fecha_venta: row[20]
    };
    
    // Enviar webhook al CRM
    const url = 'https://baigorria-demo.onrender.com/api/leads/webhook';
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(lead),
      headers: {
        'Authorization': 'Bearer WEBHOOK_SECRET_TOKEN'
      }
    };
    
    UrlFetchApp.fetch(url, options);
  }
}
```

**2. Endpoint en el CRM**

Agregar en `api/server.js`:

```javascript
// Webhook desde Google Sheets (sin auth porque viene del Apps Script)
app.post('/api/leads/webhook', async (req, res) => {
  const WEBHOOK_SECRET = process.env.SHEETS_WEBHOOK_SECRET || 'sheets_secret_2026';
  
  // Verificar token secreto
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: 'webhook no autorizado' });
  }
  
  const lead = req.body;
  
  // Validar campos mínimos
  if (!lead.nombre || !lead.email) {
    return res.status(400).json({ error: 'faltan campos obligatorios' });
  }
  
  // Verificar duplicados (por email o teléfono)
  const existe = await pool.query(
    'SELECT id FROM leads WHERE email = $1 OR telefono = $2',
    [lead.email, lead.telefono]
  );
  
  if (existe.rows.length > 0) {
    return res.status(200).json({ message: 'lead ya existe, ignorado' });
  }
  
  // Insertar
  await pool.query(`
    INSERT INTO leads (
      fecha_ingreso, nombre, apellido, email, telefono, empresa, rubro, 
      provincia, producto, observaciones, origen, plataforma, compra_estimada,
      estado, fecha_contacto, vendedor, comentarios, proveedor_actual, 
      potencial, venta_concretada, fecha_venta
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
  `, [
    lead.fecha_ingreso, lead.nombre, lead.apellido, lead.email, lead.telefono,
    lead.empresa, lead.rubro, lead.provincia, lead.producto, lead.observaciones,
    lead.origen, lead.plataforma, lead.compra_estimada, lead.estado,
    lead.fecha_contacto, lead.vendedor, lead.comentarios, lead.proveedor_actual,
    lead.potencial, lead.venta_concretada, lead.fecha_venta
  ]);
  
  res.status(201).json({ message: 'lead creado' });
});
```

**3. Configurar variables de entorno**

Agregar a `.env`:
```
SHEETS_WEBHOOK_SECRET=sheets_secret_2026_cambiar_en_produccion
```

**4. Probar**

- Agregar una fila de prueba manualmente en el Sheet
- Verificar que aparece en el CRM automáticamente
- Verificar logs del servidor para debugging

---

### Fase 3: Transición Gradual

**Semana 1-2: Convivencia**
- El Sheet sigue siendo la entrada principal
- Los leads se replican al CRM automáticamente
- El equipo se familiariza con el CRM

**Semana 3-4: Migración**
- El equipo empieza a trabajar leads desde el CRM
- Se mantiene el Sheet como backup
- Florencia/Martín prueban filtros, búsquedas, reportes

**Mes 2+: 100% CRM**
- Configurar webhook de Meta → CRM directo
- Eliminar el paso del Sheet (Opción B)
- El Sheet queda como histórico

---

## 🛠️ Tareas Técnicas (Para Ivo)

### Inmediato (para la demo)
- [ ] Crear script de migración CSV → PostgreSQL
- [ ] Exportar datos del Sheet actual
- [ ] Ejecutar migración y verificar
- [ ] Actualizar el informe para el cliente

### Para producción
- [ ] Implementar endpoint `/api/leads/webhook`
- [ ] Crear Google Apps Script en el Sheet del cliente
- [ ] Configurar secret token seguro
- [ ] Documentar el flujo para el cliente
- [ ] Crear guía de troubleshooting

---

## 💡 Recomendación Final

**Para la demo:**  
Exportar manualmente los leads del Sheet → Importarlos al CRM → Deployar la demo con datos reales

**Para producción:**  
Implementar Opción A (migración + webhook) para no romper el flujo actual del cliente. Después de 1-2 meses, migrar a Opción B (webhook directo de Meta → CRM).

---

## 📞 Siguiente Acción

**Para ti (Ivo):**
1. Descargar CSV del Google Sheet
2. Crear script de importación
3. Cargar los datos reales en el CRM local
4. Verificar que todo funciona
5. Deployar a Render con datos reales

**Para el cliente (Florencia):**
- [ ] Confirmar que podemos acceder al Google Sheet programáticamente (permisos)
- [ ] Decidir si prefieren Opción A (Sheet + CRM) u Opción B (solo CRM)

---

**Tiempo estimado total:** 2-3 horas de desarrollo + configuración
