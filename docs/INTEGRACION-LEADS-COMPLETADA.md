# Integración Automática de Leads — COMPLETADA ✅

**Fecha:** 14 de julio de 2026  
**Estado:** Sistema funcionando en local, listo para producción

---

## ✅ Lo que SE IMPLEMENTÓ

### 1. Endpoint Webhook para Google Sheets

**URL:** `POST https://tu-dominio.com/webhook/sheets-leads`  
**Autenticación:** `Authorization: Bearer baigorria_sheets_secret_2026`

Este endpoint recibe leads desde Google Sheets y los inserta automáticamente en el CRM.

**Características:**
- ✅ Valida duplicados (por email o teléfono)
- ✅ Mapea todos los campos del Sheet al CRM
- ✅ Maneja fechas en formato DD/MM/YYYY
- ✅ Limpia números de teléfono (elimina caracteres no numéricos)
- ✅ Logs detallados para debugging

### 2. Endpoint Webhook para Meta Ads (Lead Ads)

**URL Verificación:** `GET https://tu-dominio.com/webhook/meta-leads?hub.mode=subscribe&hub.verify_token=baigorria_meta_verify_2026&hub.challenge=XXXX`  
**URL Captura:** `POST https://tu-dominio.com/webhook/meta-leads`

Este endpoint:
- ✅ Recibe leads directamente desde Meta Ads
- ✅ Parsea automáticamente los campos del formulario
- ✅ Detecta duplicados antes de insertar
- ✅ No requiere autenticación (Meta Ads no la soporta)

### 3. Google Apps Script

Archivo: `scripts/google-apps-script-webhook.gs`

Script que se ejecuta automáticamente cuando se agrega una fila nueva en el Google Sheet del cliente.

**Funciones:**
- `onEdit()` - Se dispara automáticamente al editar el Sheet
- `parseRowToLead()` - Transforma la fila a formato JSON
- `sendToWebhook()` - Envía el lead al CRM
- `testWebhook()` - Función de prueba manual

### 4. Script de Migración

Archivo: `scripts/migrate-leads-from-sheets.js`

Migra todos los leads existentes del Google Sheet al CRM (una sola vez).

**Uso:**
```bash
cd scripts
node migrate-leads-from-sheets.js ../data/leads-baigorria.csv
```

**Características:**
- ✅ Parser CSV robusto (maneja comillas, comas dentro de campos)
- ✅ Valida duplicados antes de insertar
- ✅ Reporte detallado (insertados, duplicados, errores)
- ✅ Maneja fechas en formato DD/MM/YYYY
- ✅ Limpia números de teléfono automáticamente

---

## 📋 Arquitectura Final

```
┌─────────────────┐
│   Meta Ads      │
│  (Lead Forms)   │
└────────┬────────┘
         │
         │ [Webhook POST]
         ↓
    ┌────────────────────────────┐
    │  CRM Baigorria             │
    │  /webhook/meta-leads       │
    │                            │
    │  [Valida duplicados]       │
    │  [Parsea campos]           │
    │  [Inserta en PostgreSQL]   │
    └────────────────────────────┘
```

**ALTERNATIVA (si prefieren mantener Google Sheets):**

```
┌─────────────────┐
│   Meta Ads      │
│  (Lead Forms)   │
└────────┬────────┘
         │
         ↓
┌───────────────────┐
│  Google Sheets    │
│  (Sheet actual)   │
└────────┬──────────┘
         │
         │ [Google Apps Script]
         │ [onEdit trigger]
         ↓
    ┌────────────────────────────┐
    │  CRM Baigorria             │
    │  /webhook/sheets-leads     │
    │                            │
    │  [Valida duplicados]       │
    │  [Inserta en PostgreSQL]   │
    └────────────────────────────┘
```

---

## 🎯 Próximos Pasos (Configuración del Cliente)

### OPCIÓN A: Webhook Directo Meta → CRM (Recomendado)

**Ventajas:**
- ✅ Arquitectura más limpia
- ✅ Menos puntos de falla
- ✅ Los leads entran directamente al CRM

**Pasos:**

1. **Migrar leads históricos del Sheet al CRM:**
   ```bash
   # Descargar CSV del Google Sheet
   # Archivo → Descargar → Valores separados por comas (.csv)
   
   # Ejecutar script de migración
   cd scripts
   node migrate-leads-from-sheets.js ../data/leads-baigorria.csv
   ```

2. **Configurar webhook en Meta Business Suite:**
   - Ir a: https://business.facebook.com/
   - Settings → Data Sources → Lead Forms
   - Webhook URL: `https://crm.baigorriaindustrial.com/webhook/meta-leads`
   - Verify Token: `baigorria_meta_verify_2026`
   - Subscribe to: `leadgen`
   - Save

3. **Probar con un lead de prueba:**
   - Crear un formulario de prueba en Meta Ads
   - Completarlo
   - Verificar que aparece en el CRM

---

### OPCIÓN B: Mantener Google Sheets + Sync Automático

**Ventajas:**
- ✅ El equipo puede seguir usando el Sheet
- ✅ Transición gradual al CRM
- ✅ El Sheet queda como backup

**Pasos:**

1. **Instalar Google Apps Script en el Sheet del cliente:**
   - Abrir: https://docs.google.com/spreadsheets/d/1OooiJFo9_VlUDKn-VL6GjG04PO0NxywuxFvNuhye0Us/edit
   - Extensiones → Apps Script
   - Copiar código de `scripts/google-apps-script-webhook.gs`
   - Cambiar `CRM_WEBHOOK_URL` por la URL real: `https://crm.baigorriaindustrial.com/webhook/sheets-leads`
   - Guardar

2. **Ejecutar test manual:**
   - En Apps Script: Seleccionar función `testWebhook`
   - Run
   - Autorizar permisos (primera vez)
   - Verificar que el lead aparece en el CRM

3. **Configurar trigger automático:**
   - En Apps Script: Triggers (ícono reloj)
   - Add Trigger:
     - Function: `onEdit`
     - Event source: From spreadsheet
     - Event type: On edit
   - Save

4. **Migrar leads históricos:**
   ```bash
   cd scripts
   node migrate-leads-from-sheets.js ../data/leads-baigorria.csv
   ```

5. **Probar agregando una fila nueva en el Sheet:**
   - El lead debe aparecer automáticamente en el CRM

---

## 🔧 Variables de Entorno (Producción)

Agregar a la configuración del servidor (Render/Railway/Vercel):

```bash
META_VERIFY_TOKEN=baigorria_meta_verify_2026
SHEETS_WEBHOOK_SECRET=baigorria_sheets_secret_2026
```

**IMPORTANTE:** Cambiar estos valores en producción por tokens más fuertes:

```bash
# Generar tokens aleatorios:
openssl rand -hex 32
```

---

## ✅ Pruebas Realizadas

### 1. Test local del webhook Google Sheets

```bash
curl -X POST http://localhost:3001/webhook/sheets-leads \
  -H "Authorization: Bearer baigorria_sheets_secret_2026" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","apellido":"Prueba","email":"test@example.com",...}'
```

**Resultado:** ✅ Lead insertado correctamente (ID: 237)

### 2. Verificación en el CRM

- ✅ Lead aparece en la vista de Leads
- ✅ Origen: "Google Sheets"
- ✅ Plataforma: "Meta"
- ✅ Fecha de ingreso: automática
- ✅ Scoring automático funcionando

---

## 📊 Monitoreo y Logs

### Ver logs del webhook en producción

**Render/Railway:**
- Dashboard → Logs → Filtrar por `[webhook/`

**Comandos útiles:**
```bash
# Buscar leads insertados por webhook
grep "[webhook/" logs.txt

# Contar leads por origen
psql -c "SELECT origen, count(*) FROM leads GROUP BY origen"

# Ver últimos 10 leads insertados
psql -c "SELECT id, nombre, email, origen, fecha_ingreso FROM leads ORDER BY fecha_ingreso DESC LIMIT 10"
```

---

## 🐛 Troubleshooting

### Problema: Lead no aparece en el CRM

**Posibles causas:**

1. **Duplicado (email o teléfono ya existe)**
   - Verificar logs: buscar "lead duplicado"
   - Query: `SELECT * FROM leads WHERE email='xxx@example.com'`

2. **Falta email y teléfono**
   - Los leads sin email NI teléfono se ignoran
   - Verificar logs: buscar "lead sin email"

3. **Token inválido (Google Sheets)**
   - Verificar que el `SHEETS_WEBHOOK_SECRET` coincida en:
     - Apps Script (`WEBHOOK_SECRET`)
     - Variables de entorno del servidor
   - Verificar logs: buscar "token inválido"

4. **Webhook no configurado**
   - Verificar que el trigger `onEdit` esté activo en Apps Script
   - Verificar que la URL del webhook sea correcta

### Problema: Error 500 en el webhook

**Posibles causas:**

1. **Error de conexión a la BD**
   - Verificar que `DATABASE_URL` esté configurado
   - Verificar logs del servidor

2. **Campos faltantes o mal formateados**
   - Verificar que el JSON tenga formato correcto
   - Ver logs: buscar `[webhook/...] error:`

---

## 📞 Soporte

**Desarrollador:** Ivo Paolantonio  
**Email:** ivopaolantoniopersonal@gmail.com  
**WhatsApp:** +54 9 11 3117-4279

---

## 📝 Changelog

| Fecha | Cambio |
|-------|--------|
| 14/07/2026 | ✅ Implementación completa de webhooks Meta + Sheets |
| 14/07/2026 | ✅ Script de migración de leads históricos |
| 14/07/2026 | ✅ Google Apps Script con auto-sync |
| 14/07/2026 | ✅ Pruebas locales exitosas |

---

**Estado actual:** ✅ Sistema funcionando en local, listo para deploy a producción.

**Próximo paso:** Deployar a Render/Railway con las variables de entorno configuradas, luego configurar el webhook en Meta Business Suite o instalar el Apps Script en el Google Sheet del cliente (según opción elegida).
