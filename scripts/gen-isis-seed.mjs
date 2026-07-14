// Genera db/migrations/isis-seed.sql desde mock-isis-api/data/*.json (contrato del adapter).
// Es la carga inicial del "sync" ISIS→Postgres. UPSERT idempotente por clave natural.
// Regla de ownership (MODELO-DATOS §3): en pedidos NO se pisan prioridad_armado ni notas.
// Uso: node scripts/gen-isis-seed.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(REPO, 'mock-isis-api', 'data');
const OUTDIR = join(REPO, 'db', 'migrations');
mkdirSync(OUTDIR, { recursive: true });
const load = (n) => JSON.parse(readFileSync(join(DATA, `${n}.json`), 'utf8'));

const s = (v) => (v === null || v === undefined || v === '') ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const b = (v) => (v ? 'TRUE' : 'FALSE');
const n = (v) => (v === null || v === undefined || v === '') ? 'NULL' : Number(v);
const row = (arr) => '(' + arr.join(',') + ')';

const clientes = load('clientes'), articulos = load('articulos'), stock = load('stock'),
      pedidos = load('pedidos'), ventas = load('ventas');

let out = `-- GENERADO por scripts/gen-isis-seed.mjs — carga inicial del sync ISIS→Postgres (mock).\nBEGIN;\n\n`;

// clientes
out += `INSERT INTO clientes (isis_id,nombre,cuit,rubro,provincia,localidad,telefono,email,vendedor_asignado) VALUES\n`;
out += clientes.map(c => row([s(c.isis_id),s(c.nombre),s(c.cuit),s(c.rubro),s(c.provincia),s(c.localidad),s(c.telefono),s(c.email),s(c.vendedor_asignado)])).join(',\n');
out += `\nON CONFLICT (isis_id) DO UPDATE SET nombre=EXCLUDED.nombre,cuit=EXCLUDED.cuit,rubro=EXCLUDED.rubro,provincia=EXCLUDED.provincia,localidad=EXCLUDED.localidad,telefono=EXCLUDED.telefono,email=EXCLUDED.email,vendedor_asignado=EXCLUDED.vendedor_asignado;\n\n`;

// articulos
out += `INSERT INTO articulos (codigo,categoria,subcategoria,tipo,descripcion,unidad_medida) VALUES\n`;
out += articulos.map(a => row([s(a.codigo),s(a.categoria),s(a.subcategoria),s(a.tipo),s(a.descripcion),s(a.unidad_medida)])).join(',\n');
out += `\nON CONFLICT (codigo) DO UPDATE SET categoria=EXCLUDED.categoria,subcategoria=EXCLUDED.subcategoria,tipo=EXCLUDED.tipo,descripcion=EXCLUDED.descripcion,unidad_medida=EXCLUDED.unidad_medida;\n\n`;

// stock (sin clave natural -> truncate + insert)
out += `TRUNCATE stock RESTART IDENTITY;\n`;
out += `INSERT INTO stock (articulo_codigo,kilos_disponibles,unidades_disponibles,estado,ubicacion) VALUES\n`;
out += stock.map(st => row([s(st.articulo_codigo),n(st.kilos_disponibles),n(st.unidades_disponibles),s(st.estado),s(st.ubicacion)])).join(',\n');
out += `;\n\n`;

// pedidos — UPSERT que PRESERVA prioridad_armado y notas (ownership de Martin)
out += `INSERT INTO pedidos (nro_pedido,cliente_isis_id,cliente_nombre,fecha_pedido,kilos_total,estado,retira_local,nro_factura,ruta_pdf) VALUES\n`;
out += pedidos.map(p => row([s(p.nro_pedido),s(p.cliente_isis_id),s(p.cliente_nombre),s(p.fecha_pedido),n(p.kilos_total),s(p.estado),b(p.retira_local),s(p.nro_factura),s(p.ruta_pdf)])).join(',\n');
out += `\nON CONFLICT (nro_pedido) DO UPDATE SET cliente_isis_id=EXCLUDED.cliente_isis_id,cliente_nombre=EXCLUDED.cliente_nombre,fecha_pedido=EXCLUDED.fecha_pedido,kilos_total=EXCLUDED.kilos_total,estado=EXCLUDED.estado,retira_local=EXCLUDED.retira_local,nro_factura=EXCLUDED.nro_factura,ruta_pdf=EXCLUDED.ruta_pdf;\n\n`;
out += `-- NOTA: prioridad_armado y notas NO están en el UPDATE → no se pisan (los escribe Martín en NocoDB).\n\n`;

// ventas
out += `INSERT INTO ventas_mensuales (cliente_isis_id,periodo,total_facturado,kilos_vendidos,ticket_promedio) VALUES\n`;
out += ventas.map(v => row([s(v.cliente_isis_id),s(v.periodo),n(v.total_facturado),n(v.kilos_vendidos),n(v.ticket_promedio)])).join(',\n');
out += `\nON CONFLICT (cliente_isis_id,periodo) DO UPDATE SET total_facturado=EXCLUDED.total_facturado,kilos_vendidos=EXCLUDED.kilos_vendidos,ticket_promedio=EXCLUDED.ticket_promedio;\n\n`;

out += `COMMIT;\n`;
writeFileSync(join(OUTDIR, 'isis-seed.sql'), out, 'utf8');
console.log(`isis-seed.sql: ${clientes.length} clientes, ${articulos.length} articulos, ${stock.length} stock, ${pedidos.length} pedidos, ${ventas.length} ventas`);
