// Mock ISIS API — simula la capa externa del ERP (contrato del adapter, ver docs/MODELO-DATOS.md §7).
// Node puro, sin dependencias. Sirve datos desde ./data/*.json en memoria.
// Endpoints de lectura = lo que consumirá la capa de sync (igual que el ISIS real).
// Endpoints de mutación = solo para la DEMO (mostrar el sync en vivo).
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const load = (name) => JSON.parse(readFileSync(join(__dirname, 'data', `${name}.json`), 'utf8'));

// Estado en memoria (mutable solo para la demo)
const DB = {
  pedidos: load('pedidos'),
  clientes: load('clientes'),
  articulos: load('articulos'),
  stock: load('stock'),
  ventas: load('ventas'),
};

const json = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
  });

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);
  const parts = pathname.split('/').filter(Boolean); // ej. ['isis','pedidos']

  if (req.method === 'GET' && pathname === '/health') return json(res, 200, { ok: true, service: 'mock-isis-api' });

  // GET /isis/:recurso
  if (req.method === 'GET' && parts[0] === 'isis' && parts.length === 2) {
    const r = parts[1];
    if (DB[r]) return json(res, 200, DB[r]);
    return json(res, 404, { error: `recurso desconocido: ${r}` });
  }

  // POST /isis/pedidos  → inyecta un pedido nuevo (DEMO: simula carga en ISIS)
  if (req.method === 'POST' && pathname === '/isis/pedidos') {
    const body = await readBody(req);
    if (!body.nro_pedido) return json(res, 400, { error: 'falta nro_pedido' });
    const nuevo = {
      nro_pedido: body.nro_pedido,
      cliente_isis_id: body.cliente_isis_id ?? null,
      cliente_nombre: body.cliente_nombre ?? '',
      fecha_pedido: body.fecha_pedido ?? new Date().toISOString().slice(0, 10),
      kilos_total: body.kilos_total ?? 0,
      estado: body.estado ?? 'En proceso',
      retira_local: body.retira_local ?? false,
      nro_factura: body.nro_factura ?? null,
      ruta_pdf: body.ruta_pdf ?? null,
    };
    DB.pedidos.unshift(nuevo);
    return json(res, 201, nuevo);
  }

  // PATCH /isis/pedidos/:nro  → cambia estado/campos (DEMO: simula avance en ISIS)
  if (req.method === 'PATCH' && parts[0] === 'isis' && parts[1] === 'pedidos' && parts[2]) {
    const body = await readBody(req);
    const p = DB.pedidos.find((x) => x.nro_pedido === decodeURIComponent(parts[2]));
    if (!p) return json(res, 404, { error: 'pedido no encontrado' });
    Object.assign(p, body);
    return json(res, 200, p);
  }

  json(res, 404, { error: 'not found' });
});

server.listen(PORT, () => console.log(`mock-isis-api escuchando en :${PORT}`));
