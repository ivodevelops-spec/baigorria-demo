const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'baigorria',
      password: process.env.PGPASSWORD || 'baigorria_dev_2026',
      database: process.env.PGDATABASE || 'baigorria',
    });

async function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseDate(str) {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
}

function cleanPhone(phone) {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

async function migrateLeads(csvPath) {
  console.log('Iniciando migración de leads...\n');
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(l => l.trim());
  
  const header = await parseCSVLine(lines[0]);
  console.log(`Columnas detectadas (${header.length}):`, header.map((h, i) => `${i}: ${h}`).join('\n'));
  console.log(`\nTotal de filas (incluyendo header): ${lines.length}\n`);
  
  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const row = await parseCSVLine(lines[i]);
      
      if (row.length < 5) {
        console.log(`[${i}] Fila vacía o incompleta, ignorada`);
        continue;
      }
      
      const lead = {
        fecha_ingreso: parseDate(row[0]) || new Date().toISOString().slice(0, 10),
        estado: row[1] || 'Nuevo',
        nombre: row[2] || '',
        apellido: row[3] || '',
        telefono: cleanPhone(row[4]),
        email: row[5] || '',
        empresa: row[6] || '',
        rubro: row[7] || '',
        provincia: row[8] || '',
        producto: row[9] || '',
        observaciones: row[10] || '',
        origen: row[11] || 'Google Sheets',
        plataforma: row[12] || 'Meta',
        compra_estimada: row[13] || '',
        fecha_contacto: parseDate(row[15]),
        vendedor: row[16] || '',
        comentarios: row[17] || '',
        proveedor_actual: row[18] || '',
        potencial: row[19] || '',
        venta_concretada: (row[20] || '').toLowerCase().includes('si') || (row[20] || '').toLowerCase().includes('sí'),
        fecha_venta: parseDate(row[21]),
      };
      
      if (!lead.email && !lead.telefono) {
        console.log(`[${i}] Sin email ni teléfono: ${lead.nombre} ${lead.apellido}, ignorado`);
        continue;
      }
      
      const existe = await pool.query(
        'SELECT id FROM leads WHERE email=$1 OR (telefono IS NOT NULL AND telefono=$2)',
        [lead.email, lead.telefono]
      );
      
      if (existe.rows.length > 0) {
        console.log(`[${i}] Duplicado: ${lead.email || lead.telefono}`);
        duplicates++;
        continue;
      }
      
      await pool.query(`
        INSERT INTO leads (
          fecha_ingreso, estado, nombre, apellido, telefono, email, empresa, rubro,
          provincia, producto, observaciones, origen, plataforma, compra_estimada,
          fecha_contacto, vendedor, comentarios, proveedor_actual, potencial,
          venta_concretada, fecha_venta, contactado
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      `, [
        lead.fecha_ingreso, lead.estado, lead.nombre, lead.apellido, lead.telefono,
        lead.email, lead.empresa, lead.rubro, lead.provincia, lead.producto,
        lead.observaciones, lead.origen, lead.plataforma, lead.compra_estimada,
        lead.fecha_contacto, lead.vendedor, lead.comentarios, lead.proveedor_actual,
        lead.potencial, lead.venta_concretada, lead.fecha_venta,
        lead.estado === 'Contactado'
      ]);
      
      console.log(`[${i}] ✅ ${lead.nombre} ${lead.apellido} - ${lead.email || lead.telefono}`);
      inserted++;
      
    } catch (err) {
      console.error(`[${i}] ❌ Error: ${err.message}`);
      errors++;
    }
  }
  
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`RESUMEN:`);
  console.log(`  ✅ Insertados: ${inserted}`);
  console.log(`  ⏭️  Duplicados: ${duplicates}`);
  console.log(`  ❌ Errores: ${errors}`);
  console.log(`═══════════════════════════════════════════════\n`);
  
  const { rows } = await pool.query('SELECT count(*) c FROM leads');
  console.log(`Total de leads en el CRM: ${rows[0].c}\n`);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Uso: node migrate-leads-from-sheets.js <path-to-csv>');
  console.error('Ejemplo: node migrate-leads-from-sheets.js ../data/leads.csv');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`Error: archivo no encontrado: ${csvPath}`);
  process.exit(1);
}

migrateLeads(csvPath)
  .then(() => {
    console.log('Migración completada');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error fatal:', err.message);
    process.exit(1);
  });
