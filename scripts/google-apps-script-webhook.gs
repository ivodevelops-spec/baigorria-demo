/**
 * Google Apps Script para sincronizar leads del Sheet al CRM
 * 
 * INSTALACIÓN:
 * 1. Abrir el Google Sheet: https://docs.google.com/spreadsheets/d/1OooiJFo9_VlUDKn-VL6GjG04PO0NxywuxFvNuhye0Us/edit
 * 2. Ir a: Extensiones → Apps Script
 * 3. Copiar este código
 * 4. Cambiar CRM_WEBHOOK_URL por la URL real de producción
 * 5. Guardar y ejecutar una vez manualmente para autorizar permisos
 * 6. Configurar trigger: onEdit para detectar nuevas filas automáticamente
 */

const CRM_WEBHOOK_URL = 'https://baigorria-demo.onrender.com/webhook/sheets-leads';
const WEBHOOK_SECRET = 'baigorria_sheets_secret_2026';

function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    const row = range.getRow();
    
    if (row <= 1) return;
    
    const lastColumn = sheet.getLastColumn();
    const rowData = sheet.getRange(row, 1, 1, lastColumn).getValues()[0];
    
    const lead = parseRowToLead(rowData);
    
    if (!lead.email && !lead.telefono) {
      Logger.log('Lead sin email ni teléfono, ignorado');
      return;
    }
    
    sendToWebhook(lead);
    
  } catch (error) {
    Logger.log('Error en onEdit: ' + error.message);
  }
}

function parseRowToLead(row) {
  return {
    fecha_ingreso: row[0] || new Date().toISOString(),
    estado: row[1] || 'Nuevo',
    nombre: row[2] || '',
    apellido: row[3] || '',
    telefono: String(row[4] || '').replace(/\D/g, ''),
    email: row[5] || '',
    empresa: row[6] || '',
    rubro: row[7] || '',
    provincia: row[8] || '',
    producto: row[9] || '',
    observaciones: row[10] || '',
    origen: row[11] || 'Google Sheets',
    plataforma: row[12] || 'Meta',
    compra_estimada: row[13] || '',
    fecha_contacto: row[15] || null,
    vendedor: row[16] || '',
    comentarios: row[17] || '',
    proveedor_actual: row[18] || '',
    potencial: row[19] || '',
    venta_concretada: row[20] === 'Si' || row[20] === 'Sí' || false,
    fecha_venta: row[21] || null
  };
}

function sendToWebhook(lead) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + WEBHOOK_SECRET
    },
    payload: JSON.stringify(lead),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
  const statusCode = response.getResponseCode();
  
  if (statusCode === 200 || statusCode === 201) {
    Logger.log('Lead enviado correctamente al CRM: ' + lead.email);
  } else {
    Logger.log('Error al enviar lead. Status: ' + statusCode + ', Response: ' + response.getContentText());
  }
}

function testWebhook() {
  const testLead = {
    fecha_ingreso: new Date().toISOString(),
    estado: 'Nuevo',
    nombre: 'Test',
    apellido: 'Webhook',
    telefono: '5491112345678',
    email: 'test-webhook@example.com',
    empresa: 'Test Company',
    rubro: 'test',
    provincia: 'Buenos Aires',
    producto: 'bulones',
    observaciones: 'Lead de prueba desde Apps Script',
    origen: 'Google Sheets',
    plataforma: 'Meta',
    compra_estimada: '100000',
    vendedor: 'Test',
    comentarios: 'Prueba',
    proveedor_actual: '',
    potencial: 'Alto',
    venta_concretada: false,
    fecha_venta: null
  };
  
  sendToWebhook(testLead);
  Logger.log('Test webhook ejecutado. Revisar logs del servidor CRM.');
}
