// Genera db/migrations/leads-seed.sql desde crm/leads.db aplicando las reglas de
// limpieza de docs/MODELO-DATOS.md §6. Uso: node --experimental-sqlite scripts/gen-leads-seed.mjs
// El .sql resultante NO se versiona (contiene PII real); leads.db está preservado.
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = join(REPO, 'db', 'migrations');
mkdirSync(OUTDIR, { recursive: true });
const db = new DatabaseSync(join(REPO, 'crm', 'leads.db'));

const VEND = new Set(['carlos', 'diego', 'angel']);
const sqlStr = (v) => (v === null || v === undefined || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const sqlBool = (v) => (v ? 'TRUE' : 'FALSE');
const isDate = (s) => /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test((s || '').trim());

function parseTs(s) {
  if (!s) return null;
  const [d, t] = s.trim().split(/\s+/);
  const m = (d || '').split('/'); if (m.length < 3) return null;
  let [dd, mm, yy] = m; if (yy.length === 2) yy = '20' + yy;
  let hh = '00', mi = '00';
  if (t && t.includes(':')) { [hh, mi] = t.split(':'); }
  const pad = (x) => String(x).padStart(2, '0');
  return `${yy}-${pad(mm)}-${pad(dd)} ${pad(hh)}:${pad(mi)}:00`;
}
function parseDate(s) {
  if (!isDate(s)) return null;
  let [dd, mm, yy] = s.trim().split('/'); if (yy.length === 2) yy = '20' + yy;
  const pad = (x) => String(x).padStart(2, '0');
  return `${yy}-${pad(mm)}-${pad(dd)}`;
}
function rubroMap(raw) {
  const r = (raw || '').toLowerCase();
  if (r.includes('test lead') || r.includes('<test')) return { rubro: 'Test', test: true };
  if (r.includes('bulonera')) return { rubro: 'Bulonera', test: false };
  if (r.includes('industria') || r.includes('agro')) return { rubro: 'Industria/Agro', test: false };
  if (r.includes('repuesto')) return { rubro: 'Casa de repuestos', test: false };
  if (r.includes('particular')) return { rubro: 'Particular', test: false };
  if (r.trim() === '') return { rubro: 'Sin definir', test: false };
  return { rubro: raw, test: false };
}

const rows = db.prepare('SELECT * FROM leads ORDER BY id ASC').all();
const cleaned = rows.map((l) => {
  const { rubro, test } = rubroMap(l.rubro);
  let vendedor = (l.vendedor || '').trim();
  if (isDate(vendedor) || vendedor === '') vendedor = null;
  let dolor = (l.dolor || '').trim();
  if (VEND.has(dolor.toLowerCase()) || dolor === '') dolor = null;
  const tel = (l.telefono || '').replace(/\D/g, '') || null;
  return {
    fecha_ingreso: parseTs(l.fecha),
    nombre: l.nombre, apellido: l.apellido, email: l.email, telefono: tel,
    empresa: l.empresa, rubro, producto: l.producto, provincia: l.provincia,
    compra_estimada: l.compra_estimada, observaciones: l.observaciones,
    origen: l.origen, plataforma: (l.plataforma === 'Meta' || l.plataforma === 'Google') ? l.plataforma : 'Meta',
    estado: (l.estado || 'Nuevo').trim() || 'Nuevo',
    contactado: (l.contactado || '').trim().toLowerCase() === 'si',
    fecha_contacto: parseDate(l.fecha_contacto),
    vendedor, comentarios: l.comentarios, proveedor_actual: l.proveedor_actual,
    potencial: l.potencial,
    venta_concretada: (l.venta_concretada || '').trim().toLowerCase() === 'si',
    fecha_venta: parseDate(l.fecha_venta), dolor, es_test: test,
  };
});

// Demo seasoning: 5 cierres en leads avanzados (Contactado + compra_estimada real)
let seasoned = 0;
for (const c of cleaned) {
  if (seasoned >= 5) break;
  if (!c.es_test && c.estado === 'Contactado' && (c.compra_estimada || '').trim() && (c.compra_estimada || '').toLowerCase() !== 'no se') {
    c.estado = 'Cerrado'; c.venta_concretada = true;
    c.fecha_venta = c.fecha_venta || (c.fecha_ingreso ? c.fecha_ingreso.slice(0, 10) : null);
    seasoned++;
  }
}

const cols = ['fecha_ingreso','nombre','apellido','email','telefono','empresa','rubro','producto','provincia','compra_estimada','observaciones','origen','plataforma','estado','contactado','fecha_contacto','vendedor','comentarios','proveedor_actual','potencial','venta_concretada','fecha_venta','dolor','es_test'];
const values = cleaned.map((c) => '(' + cols.map((k) => {
  if (k === 'contactado' || k === 'venta_concretada' || k === 'es_test') return sqlBool(c[k]);
  return sqlStr(c[k]);
}).join(',') + ')').join(',\n  ');

const sql = `-- GENERADO por scripts/gen-leads-seed.mjs — NO editar a mano. Contiene PII real (no versionar).
BEGIN;
TRUNCATE leads RESTART IDENTITY;
INSERT INTO leads (${cols.join(',')}) VALUES
  ${values};
COMMIT;
`;
writeFileSync(join(OUTDIR, 'leads-seed.sql'), sql, 'utf8');
console.log(`leads-seed.sql: ${cleaned.length} leads, ${cleaned.filter(c=>c.es_test).length} test, ${seasoned} cierres demo`);
