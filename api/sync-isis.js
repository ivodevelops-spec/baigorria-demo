// ── Capa de sync ISIS → Postgres ─────────────────────────────────────────────
// Lee el CONTRATO adapter (ver docs/MODELO-DATOS.md §7) vía HTTP y hace UPSERT
// idempotente por clave natural. Es el corazón de "el pedido aparece solo".
//
// El mismo código sirve para la DEMO (mock-isis-api) y para PRODUCCIÓN (ISIS real):
// solo cambia la variable ISIS_API_URL. No hay lógica específica del mock.
//
// Ownership (MODELO-DATOS §3): el sync NUNCA pisa las columnas que edita el equipo:
//   pedidos.prioridad_armado, pedidos.notas, pedidos.tipo_entrega, pedidos.cantidad_bultos
//
// Uso:
//   node sync-isis.js            → una pasada y termina (ideal para cron / n8n)
//   node sync-isis.js --loop     → poll cada SYNC_INTERVAL_MIN (default 5)
'use strict';
const { Pool } = require('pg');

const ISIS = (process.env.ISIS_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const INTERVAL_MIN = Number(process.env.SYNC_INTERVAL_MIN || 5);

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'baigorria',
  password: process.env.PGPASSWORD || 'baigorria_dev_2026',
  database: process.env.PGDATABASE || 'baigorria',
});

async function fetchContract(resource) {
  const res = await fetch(`${ISIS}/isis/${resource}`);
  if (!res.ok) throw new Error(`ISIS ${resource} → HTTP ${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error(`ISIS ${resource} → respuesta no es un array`);
  return rows;
}

async function upsertClientes(client, rows) {
  for (const c of rows) {
    await client.query(
      `INSERT INTO clientes (isis_id,nombre,cuit,rubro,provincia,localidad,telefono,email,vendedor_asignado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (isis_id) DO UPDATE SET
         nombre=EXCLUDED.nombre, cuit=EXCLUDED.cuit, rubro=EXCLUDED.rubro,
         provincia=EXCLUDED.provincia, localidad=EXCLUDED.localidad,
         telefono=EXCLUDED.telefono, email=EXCLUDED.email,
         vendedor_asignado=EXCLUDED.vendedor_asignado, updated_at=now()`,
      [c.isis_id, c.nombre, c.cuit, c.rubro, c.provincia, c.localidad, c.telefono, c.email, c.vendedor_asignado]
    );
  }
}

async function upsertArticulos(client, rows) {
  for (const a of rows) {
    await client.query(
      `INSERT INTO articulos (codigo,categoria,subcategoria,tipo,descripcion,unidad_medida)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6,'kg'))
       ON CONFLICT (codigo) DO UPDATE SET
         categoria=EXCLUDED.categoria, subcategoria=EXCLUDED.subcategoria,
         tipo=EXCLUDED.tipo, descripcion=EXCLUDED.descripcion,
         unidad_medida=EXCLUDED.unidad_medida, updated_at=now()`,
      [a.codigo, a.categoria, a.subcategoria, a.tipo, a.descripcion, a.unidad_medida]
    );
  }
}

// stock no tiene clave natural en el contrato → snapshot completo (truncate + insert)
async function syncStock(client, rows) {
  await client.query('TRUNCATE stock RESTART IDENTITY');
  for (const s of rows) {
    await client.query(
      `INSERT INTO stock (articulo_codigo,kilos_disponibles,unidades_disponibles,estado,ubicacion)
       VALUES ($1,$2,$3,$4,$5)`,
      [s.articulo_codigo, s.kilos_disponibles ?? 0, s.unidades_disponibles ?? 0, s.estado, s.ubicacion]
    );
  }
}

async function upsertPedidos(client, rows) {
  for (const p of rows) {
    await client.query(
      `INSERT INTO pedidos (nro_pedido,cliente_isis_id,cliente_nombre,fecha_pedido,kilos_total,
                            estado,retira_local,nro_factura,fecha_factura,ruta_pdf)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (nro_pedido) DO UPDATE SET
         cliente_isis_id=EXCLUDED.cliente_isis_id, cliente_nombre=EXCLUDED.cliente_nombre,
         fecha_pedido=EXCLUDED.fecha_pedido, kilos_total=EXCLUDED.kilos_total,
         estado=EXCLUDED.estado, retira_local=EXCLUDED.retira_local,
         nro_factura=EXCLUDED.nro_factura, fecha_factura=EXCLUDED.fecha_factura,
         ruta_pdf=EXCLUDED.ruta_pdf, updated_at=now()`,
      // prioridad_armado, notas, tipo_entrega, cantidad_bultos: NO se tocan (dueño: logística)
      [p.nro_pedido, p.cliente_isis_id ?? null, p.cliente_nombre ?? '', p.fecha_pedido ?? null,
       p.kilos_total ?? 0, p.estado ?? 'En proceso', p.retira_local ?? false,
       p.nro_factura ?? null, p.fecha_factura ?? null, p.ruta_pdf ?? null]
    );
  }
}

async function upsertVentas(client, rows) {
  for (const v of rows) {
    await client.query(
      `INSERT INTO ventas_mensuales (cliente_isis_id,periodo,total_facturado,kilos_vendidos,ticket_promedio)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (cliente_isis_id,periodo) DO UPDATE SET
         total_facturado=EXCLUDED.total_facturado, kilos_vendidos=EXCLUDED.kilos_vendidos,
         ticket_promedio=EXCLUDED.ticket_promedio`,
      [v.cliente_isis_id, v.periodo, v.total_facturado, v.kilos_vendidos, v.ticket_promedio]
    );
  }
}

async function runOnce() {
  const t0 = Date.now();
  const [clientes, articulos, stock, pedidos, ventas] = await Promise.all([
    fetchContract('clientes'), fetchContract('articulos'), fetchContract('stock'),
    fetchContract('pedidos'), fetchContract('ventas'),
  ]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await upsertClientes(client, clientes);   // antes que pedidos (FK)
    await upsertArticulos(client, articulos); // antes que stock (FK)
    await syncStock(client, stock);
    await upsertPedidos(client, pedidos);
    await upsertVentas(client, ventas);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  const ms = Date.now() - t0;
  console.log(`[sync ${new Date().toISOString()}] ISIS=${ISIS} → ` +
    `${clientes.length} clientes, ${articulos.length} articulos, ${stock.length} stock, ` +
    `${pedidos.length} pedidos, ${ventas.length} ventas (${ms}ms)`);
}

async function main() {
  const loop = process.argv.includes('--loop');
  try {
    await runOnce();
    if (!loop) return pool.end();
  } catch (e) {
    console.error('[sync] ERROR:', e.message);
    if (!loop) { await pool.end(); process.exit(1); }
  }
  if (loop) {
    console.log(`[sync] modo loop: cada ${INTERVAL_MIN} min`);
    setInterval(() => runOnce().catch((e) => console.error('[sync] ERROR:', e.message)), INTERVAL_MIN * 60_000);
  }
}

main();
