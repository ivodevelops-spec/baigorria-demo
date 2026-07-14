// Provisiona la base "Baigorria" en NocoDB (interno/SQLite) y la hidrata por API.
// Reproducible e idempotente: si una tabla existe, la recrea limpia.
// Fuentes: db/exports/leads.json (leads limpios+scoreados desde Postgres) y
//          mock-isis-api/data/*.json (datos ISIS mock).
// Uso: node scripts/setup-nocodb.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.NC_URL || 'http://localhost:8080';
const creds = { email: 'admin@baigorria.local', password: 'Baigorria2026!' };
const readJson = (p) => existsSync(p) ? JSON.parse(readFileSync(p, 'utf8') || '[]') : [];

async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['xc-auth'] = token;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data; try { data = await res.json(); } catch { data = null; }
  if (!res.ok && res.status !== 400) console.warn(`  ${method} ${path} -> ${res.status}`);
  return { status: res.status, data };
}
const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };

// ── Fuentes de datos ──
const leads = readJson(join(REPO, 'db', 'exports', 'leads.json'));
const D = (f) => readJson(join(REPO, 'mock-isis-api', 'data', `${f}.json`));
const clientes = D('clientes'), articulos = D('articulos'), stock = D('stock'), pedidos = D('pedidos'), ventas = D('ventas');

// ── Definicion de tablas (titulo + columnas + mapeo de filas) ──
const TABLES = [
  {
    title: 'Leads', rows: leads,
    columns: [['Nombre','SingleLineText'],['Apellido','SingleLineText'],['Empresa','SingleLineText'],['Rubro','SingleLineText'],['Provincia','SingleLineText'],['WhatsApp','PhoneNumber'],['Email','Email'],['Estado','SingleLineText'],['Score','Number'],['Vendedor','SingleLineText'],['Compra Estimada','SingleLineText'],['Pain Point','SingleLineText'],['Origen','SingleLineText'],['Plataforma','SingleLineText'],['Contactado','Checkbox'],['Venta Cerrada','Checkbox'],['Fecha Ingreso','SingleLineText']],
    map: (r) => ({ Nombre: r.nombre, Apellido: r.apellido, Empresa: r.empresa, Rubro: r.rubro, Provincia: r.provincia, WhatsApp: r.telefono, Email: r.email, Estado: r.estado, Score: r.lead_score, Vendedor: r.vendedor, 'Compra Estimada': r.compra_estimada, 'Pain Point': r.dolor, Origen: r.origen, Plataforma: r.plataforma, Contactado: !!r.contactado, 'Venta Cerrada': !!r.venta_concretada, 'Fecha Ingreso': r.fecha_ingreso }),
  },
  {
    title: 'Pedidos', rows: pedidos,
    columns: [['Nro Pedido','SingleLineText'],['Cliente','SingleLineText'],['Fecha','SingleLineText'],['Kilos','Number'],['Estado','SingleLineText'],['Prioridad Armado','SingleLineText'],['Retira Local','Checkbox'],['Nro Factura','SingleLineText'],['Notas','LongText']],
    map: (r) => ({ 'Nro Pedido': r.nro_pedido, Cliente: r.cliente_nombre, Fecha: r.fecha_pedido, Kilos: r.kilos_total, Estado: r.estado, 'Prioridad Armado': 'Media', 'Retira Local': !!r.retira_local, 'Nro Factura': r.nro_factura, Notas: '' }),
  },
  {
    title: 'Clientes', rows: clientes,
    columns: [['Nombre','SingleLineText'],['CUIT','SingleLineText'],['Rubro','SingleLineText'],['Provincia','SingleLineText'],['Localidad','SingleLineText'],['Telefono','PhoneNumber'],['Email','Email'],['Vendedor','SingleLineText']],
    map: (r) => ({ Nombre: r.nombre, CUIT: r.cuit, Rubro: r.rubro, Provincia: r.provincia, Localidad: r.localidad, Telefono: r.telefono, Email: r.email, Vendedor: r.vendedor_asignado }),
  },
  {
    title: 'Articulos', rows: articulos,
    columns: [['Codigo','SingleLineText'],['Categoria','SingleLineText'],['Subcategoria','SingleLineText'],['Tipo','SingleLineText'],['Descripcion','SingleLineText'],['Unidad','SingleLineText']],
    map: (r) => ({ Codigo: r.codigo, Categoria: r.categoria, Subcategoria: r.subcategoria, Tipo: r.tipo, Descripcion: r.descripcion, Unidad: r.unidad_medida }),
  },
  {
    title: 'Stock', rows: stock,
    columns: [['Articulo','SingleLineText'],['Kilos','Number'],['Unidades','Number'],['Estado','SingleLineText'],['Ubicacion','SingleLineText']],
    map: (r) => ({ Articulo: r.articulo_codigo, Kilos: r.kilos_disponibles, Unidades: r.unidades_disponibles, Estado: r.estado, Ubicacion: r.ubicacion }),
  },
  {
    title: 'Ventas Mensuales', rows: ventas,
    columns: [['Cliente','SingleLineText'],['Periodo','SingleLineText'],['Total Facturado','Number'],['Kilos Vendidos','Number'],['Ticket Promedio','Number']],
    map: (r) => ({ Cliente: r.cliente_isis_id, Periodo: r.periodo, 'Total Facturado': r.total_facturado, 'Kilos Vendidos': r.kilos_vendidos, 'Ticket Promedio': r.ticket_promedio }),
  },
];

// ── Run ──
let token = (await api('POST', '/api/v1/auth/user/signup', { body: creds })).data?.token;
if (!token) token = (await api('POST', '/api/v1/auth/user/signin', { body: creds })).data?.token;
if (!token) { console.error('No se pudo autenticar en NocoDB'); process.exit(1); }

let base = ((await api('GET', '/api/v1/db/meta/projects', { token })).data?.list || []).find((x) => x.title === 'Baigorria');
if (!base) base = (await api('POST', '/api/v1/db/meta/projects', { token, body: { title: 'Baigorria' } })).data;
console.log('Base Baigorria:', base.id);

const existing = (await api('GET', `/api/v1/db/meta/projects/${base.id}/tables`, { token })).data?.list || [];

for (const t of TABLES) {
  const prev = existing.find((e) => e.title === t.title);
  if (prev) await api('DELETE', `/api/v2/meta/tables/${prev.id}`, { token });
  const created = await api('POST', `/api/v2/meta/bases/${base.id}/tables`, { token, body: {
    title: t.title, columns: t.columns.map(([title, uidt]) => ({ title, uidt })),
  } });
  const tableId = created.data?.id;
  if (!tableId) { console.error(`  ${t.title}: no se creo`); continue; }
  let inserted = 0;
  for (const part of chunk(t.rows.map(t.map), 100)) {
    const r = await api('POST', `/api/v2/tables/${tableId}/records`, { token, body: part });
    if (r.status === 200) inserted += part.length;
  }
  console.log(`  ${t.title}: ${inserted}/${t.rows.length} registros`);
}
console.log('\nListo. Abrir NocoDB: ' + BASE);
