const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'baigorria-demo-secret-2026';
const IS_PROD = process.env.NODE_ENV === 'production';

// ── DB connection (Neon o local) ───────────────────────────────────────────
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false } })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'baigorria',
      password: process.env.PGPASSWORD || 'baigorria_dev_2026',
      database: process.env.PGDATABASE || 'baigorria',
    });

const app = express();
app.use(cors());
app.use(express.json());

const loadJSON = (name) => JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'mock-isis-api', 'data', `${name}.json`), 'utf8'));

// ── Schema auto-creation (idempotente) ─────────────────────────────────────
async function ensureSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY, fecha_ingreso TIMESTAMPTZ, nombre TEXT, apellido TEXT,
    email TEXT, telefono TEXT, empresa TEXT, rubro TEXT, producto TEXT, provincia TEXT,
    compra_estimada TEXT, observaciones TEXT, origen TEXT, plataforma TEXT,
    estado TEXT DEFAULT 'Nuevo', contactado BOOLEAN DEFAULT FALSE, fecha_contacto DATE,
    vendedor TEXT, comentarios TEXT, proveedor_actual TEXT, potencial TEXT,
    venta_concretada BOOLEAN DEFAULT FALSE, fecha_venta DATE, dolor TEXT,
    chat_history JSONB, es_test BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())`);

  await pool.query(`CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY, isis_id TEXT UNIQUE, nombre TEXT, cuit TEXT, rubro TEXT,
    provincia TEXT, localidad TEXT, telefono TEXT, email TEXT, vendedor_asignado TEXT,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())`);

  await pool.query(`CREATE TABLE IF NOT EXISTS articulos (
    id SERIAL PRIMARY KEY, codigo TEXT UNIQUE, categoria TEXT, subcategoria TEXT,
    tipo TEXT, descripcion TEXT, unidad_medida TEXT DEFAULT 'kg',
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())`);

  await pool.query(`CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY, articulo_codigo TEXT, kilos_disponibles REAL DEFAULT 0,
    unidades_disponibles INTEGER DEFAULT 0, estado TEXT DEFAULT 'Disponible',
    ubicacion TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())`);

  await pool.query(`CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY, nro_pedido TEXT UNIQUE, cliente_isis_id TEXT,
    cliente_nombre TEXT, fecha_pedido DATE, kilos_total REAL,
    estado TEXT DEFAULT 'En proceso', prioridad_armado TEXT DEFAULT 'Media',
    retira_local BOOLEAN DEFAULT FALSE, tipo_entrega TEXT, cantidad_bultos INTEGER,
    nro_factura TEXT, fecha_factura DATE, ruta_pdf TEXT,
    notificado_facturado BOOLEAN DEFAULT FALSE, notificado_despachado BOOLEAN DEFAULT FALSE,
    notas TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())`);

  await pool.query(`CREATE TABLE IF NOT EXISTS ventas_mensuales (
    id SERIAL PRIMARY KEY, cliente_isis_id TEXT, periodo TEXT,
    total_facturado REAL, kilos_vendidos REAL, ticket_promedio REAL,
    created_at TIMESTAMPTZ DEFAULT now(), UNIQUE (cliente_isis_id, periodo))`);

  await pool.query(`CREATE OR REPLACE VIEW leads_scored AS
    SELECT l.*,
      LEAST(100,
        CASE WHEN lower(l.rubro) ~ '(bulonera|distribuidor|mayorista|industria|agro)' THEN 30
             WHEN lower(l.rubro) ~ '(ferreteria|ferretería|repuestos|taller)' THEN 18 ELSE 0 END
        + CASE WHEN COALESCE(l.empresa,'')<>'' THEN 10 ELSE 0 END
        + CASE WHEN COALESCE(l.email,'')<>'' THEN 10 ELSE 0 END
        + CASE WHEN COALESCE(l.telefono,'')<>'' THEN 10 ELSE 0 END
        + CASE WHEN COALESCE(l.compra_estimada,'')<>'' THEN 20 ELSE 0 END
        + CASE WHEN lower(COALESCE(l.provincia,'')) ~ '(buenos|caba|capital)' THEN 10 ELSE 0 END
      ) AS lead_score
    FROM leads l WHERE l.es_test = FALSE`);

  console.log('[schema] tablas y vistas listas');
}

// ── Seed leads (si tabla vacía, idempotente) ──────────────────────────────
async function seedLeads() {
  const { rows } = await pool.query('SELECT count(*) c FROM leads');
  if (Number(rows[0].c) > 0) { console.log('[seed] leads ya poblado'); return; }
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', 'leads-seed.sql'), 'utf8');
  // El archivo tiene formato: BEGIN; TRUNCATE; INSERT ... VALUES (...),(...)...; COMMIT;
  // El INSERT es una sola sentencia con múltiples tuplas de valores
  for (const stmt of sql.replace(/BEGIN;|COMMIT;/gi, '').split(';').filter(s => s.trim())) {
    await pool.query(stmt + ';');
  }
  const c = await pool.query('SELECT count(*) c FROM leads');
  console.log(`[seed] ${c.rows[0].c} leads cargados`);
}

// ── Seed ISIS data (mock, si clientes vacío) ───────────────────────────────
async function seedISIS() {
  const { rows } = await pool.query('SELECT count(*) c FROM clientes');
  if (Number(rows[0].c) > 0) { console.log('[seed] ISIS ya poblado'); return; }
  const clientes = loadJSON('clientes');
  const articulos = loadJSON('articulos');
  const stock = loadJSON('stock');
  const pedidos = loadJSON('pedidos');
  const ventas = loadJSON('ventas');

  for (const c of clientes) {
    await pool.query(`INSERT INTO clientes (isis_id,nombre,cuit,rubro,provincia,localidad,telefono,email,vendedor_asignado)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING`,
      [c.isis_id,c.nombre,c.cuit,c.rubro,c.provincia,c.localidad,c.telefono,c.email,c.vendedor_asignado]);
  }
  for (const a of articulos) {
    await pool.query(`INSERT INTO articulos (codigo,categoria,subcategoria,tipo,descripcion,unidad_medida)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
      [a.codigo,a.categoria,a.subcategoria,a.tipo,a.descripcion,a.unidad_medida]);
  }
  for (const s of stock) {
    await pool.query(`INSERT INTO stock (articulo_codigo,kilos_disponibles,unidades_disponibles,estado,ubicacion)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [s.articulo_codigo,s.kilos_disponibles??0,s.unidades_disponibles??0,s.estado,s.ubicacion]);
  }
  for (const p of pedidos) {
    await pool.query(`INSERT INTO pedidos (nro_pedido,cliente_isis_id,cliente_nombre,fecha_pedido,kilos_total,estado,retira_local,nro_factura,fecha_factura,ruta_pdf)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
      [p.nro_pedido,p.cliente_isis_id??null,p.cliente_nombre??'',p.fecha_pedido??null,p.kilos_total??0,p.estado??'En proceso',p.retira_local??false,p.nro_factura??null,p.fecha_factura??null,p.ruta_pdf??null]);
  }
  for (const v of ventas) {
    await pool.query(`INSERT INTO ventas_mensuales (cliente_isis_id,periodo,total_facturado,kilos_vendidos,ticket_promedio)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [v.cliente_isis_id,v.periodo,v.total_facturado,v.kilos_vendidos,v.ticket_promedio]);
  }
  console.log(`[seed] ISIS: ${clientes.length}c ${articulos.length}a ${stock.length}s ${pedidos.length}p ${ventas.length}v`);
}

// ── Usuarios ───────────────────────────────────────────────────────────────
const DEFAULT_USERS = [
  { usuario: 'florencia', nombre: 'Florencia', rol: 'ventas', password: 'flor123' },
  { usuario: 'martin', nombre: 'Martín', rol: 'logistica', password: 'martin123' },
  { usuario: 'admin', nombre: 'Administrador', rol: 'admin', password: 'admin123' },
];
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8')); }
  catch { return DEFAULT_USERS; }
}
async function seedUsers() {
  await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY, usuario TEXT UNIQUE, nombre TEXT, rol TEXT, pass_hash TEXT)`);
  for (const u of loadUsers()) {
    await pool.query(`INSERT INTO usuarios (usuario,nombre,rol,pass_hash) VALUES ($1,$2,$3,$4)
      ON CONFLICT (usuario) DO UPDATE SET nombre=EXCLUDED.nombre, rol=EXCLUDED.rol`,
      [u.usuario, u.nombre, u.rol, bcrypt.hashSync(u.password, 8)]);
  }
}

// ── Mock ISIS (misma API que mock-isis-api) ────────────────────────────────
const MOCK_ISIS = {
  pedidos: loadJSON('pedidos'),
  clientes: loadJSON('clientes'),
  articulos: loadJSON('articulos'),
  stock: loadJSON('stock'),
  ventas: loadJSON('ventas'),
};

app.get('/isis/:recurso', (req, res) => {
  const data = MOCK_ISIS[req.params.recurso];
  data ? res.json(data) : res.status(404).json({ error: 'recurso desconocido' });
});

app.post('/isis/pedidos', (req, res) => {
  const body = req.body;
  if (!body.nro_pedido) return res.status(400).json({ error: 'falta nro_pedido' });
  const nuevo = {
    nro_pedido: body.nro_pedido,
    cliente_isis_id: body.cliente_isis_id ?? null,
    cliente_nombre: body.cliente_nombre ?? '',
    fecha_pedido: body.fecha_pedido ?? new Date().toISOString().slice(0, 10),
    kilos_total: body.kilos_total ?? 0,
    estado: body.estado ?? 'En proceso',
    retira_local: body.retira_local ?? false,
    nro_factura: body.nro_factura ?? null,
    fecha_factura: body.fecha_factura ?? null,
    ruta_pdf: body.ruta_pdf ?? null,
  };
  MOCK_ISIS.pedidos.unshift(nuevo);
  res.status(201).json(nuevo);
});

app.patch('/isis/pedidos/:nro', (req, res) => {
  const p = MOCK_ISIS.pedidos.find(x => x.nro_pedido === decodeURIComponent(req.params.nro));
  if (!p) return res.status(404).json({ error: 'pedido no encontrado' });
  Object.assign(p, req.body);
  res.json(p);
});

app.get('/health', (_req, res) => res.json({ ok: true, service: 'mock-isis-api' }));
// ^ /isis/health por separado, el general /health está más abajo

// ── Auth ───────────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'no token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'token invalido' }); }
}
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.rol) ? next() : res.status(403).json({ error: 'sin permiso para tu rol' });
const esVentas = (req) => req.user.rol === 'ventas' || req.user.rol === 'admin';

app.post('/api/auth/login', async (req, res) => {
  const { usuario, password } = req.body || {};
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE usuario=$1', [(usuario || '').toLowerCase()]);
  const u = rows[0];
  if (!u || !bcrypt.compareSync(password || '', u.pass_hash))
    return res.status(401).json({ error: 'usuario o contraseña incorrectos' });
  const payload = { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol };
  res.json({ token: jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' }), user: payload });
});

app.get('/api/me', auth, (req, res) => res.json({ user: req.user }));

// ── Dashboard ──────────────────────────────────────────────────────────────
app.get('/api/dashboard', auth, async (req, res) => {
  const q = (sql, p = []) => pool.query(sql, p).then(r => r.rows);
  const pedidosActivos = (await q("SELECT count(*) c FROM pedidos WHERE estado IN ('En proceso','Terminado')"))[0].c;
  const stockKilos = Math.round((await q('SELECT COALESCE(SUM(kilos_disponibles),0) c FROM stock'))[0].c);
  const pedidosByEstado = await q('SELECT estado, count(*)::int n FROM pedidos GROUP BY estado');
  const leadTime = (await q("SELECT ROUND(AVG(fecha_factura - fecha_pedido)) d FROM pedidos WHERE fecha_factura IS NOT NULL AND fecha_pedido IS NOT NULL"))[0].d;
  const out = { rol: req.user.rol, kpis: { pedidosActivos: Number(pedidosActivos), stockKilos, leadTimeDias: leadTime == null ? null : Number(leadTime) }, pedidosByEstado };
  if (esVentas(req)) {
    const leadsTotal = (await q('SELECT count(*) c FROM leads_scored'))[0].c;
    const leadsHot = (await q('SELECT count(*) c FROM leads_scored WHERE lead_score>=70'))[0].c;
    const cerrados = (await q("SELECT count(*) c FROM leads_scored WHERE estado='Cerrado'"))[0].c;
    const clientesTotal = (await q('SELECT count(*) c FROM clientes'))[0].c;
    const facturacionMes = Math.round((await q("SELECT COALESCE(SUM(total_facturado),0) c FROM ventas_mensuales WHERE periodo=(SELECT MAX(periodo) FROM ventas_mensuales)"))[0].c);
    const funnel = await q('SELECT estado, count(*)::int n FROM leads_scored GROUP BY estado');
    const porRubro = await q('SELECT rubro, count(*)::int n FROM leads_scored GROUP BY rubro ORDER BY n DESC');
    const porProvincia = await q("SELECT provincia, count(*)::int n FROM leads_scored WHERE COALESCE(provincia,'')<>'' GROUP BY provincia ORDER BY n DESC LIMIT 8");
    const scoreMix = await q("SELECT CASE WHEN lead_score>=70 THEN 'hot' WHEN lead_score>=40 THEN 'tibio' ELSE 'frio' END k, count(*)::int n FROM leads_scored GROUP BY k");
    Object.assign(out.kpis, {
      leadsTotal: Number(leadsTotal), leadsHot: Number(leadsHot), clientesTotal: Number(clientesTotal),
      facturacionMes, convRate: leadsTotal > 0 ? +(cerrados / leadsTotal * 100).toFixed(1) : 0,
    });
    out.funnel = funnel; out.porRubro = porRubro; out.porProvincia = porProvincia; out.scoreMix = scoreMix;
  }
  res.json(out);
});

// ── Leads ──────────────────────────────────────────────────────────────────
app.get('/api/leads', auth, requireRole('ventas', 'admin'), async (req, res) => {
  const { estado, rubro, q } = req.query;
  let sql = 'SELECT * FROM leads_scored WHERE 1=1'; const p = [];
  if (estado) { p.push(estado); sql += ` AND estado=$${p.length}`; }
  if (rubro) { p.push(rubro); sql += ` AND rubro=$${p.length}`; }
  if (q) { p.push(`%${q}%`); sql += ` AND (nombre ILIKE $${p.length} OR empresa ILIKE $${p.length} OR email ILIKE $${p.length})`; }
  sql += ' ORDER BY lead_score DESC, id DESC';
  res.json((await pool.query(sql, p)).rows);
});

app.patch('/api/leads/:id', auth, requireRole('ventas', 'admin'), async (req, res) => {
  const allowed = ['estado', 'vendedor', 'contactado', 'comentarios', 'dolor', 'potencial', 'venta_concretada'];
  const sets = [], vals = [];
  for (const k of allowed) if (k in req.body) { vals.push(req.body[k]); sets.push(`${k}=$${vals.length}`); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  await pool.query(`UPDATE leads SET ${sets.join(',')}, updated_at=now() WHERE id=$${vals.length}`, vals);
  res.json({ ok: true });
});

// ── Pedidos ────────────────────────────────────────────────────────────────
app.get('/api/pedidos', auth, async (req, res) => {
  const { estado, prioridad } = req.query;
  let sql = 'SELECT * FROM pedidos WHERE 1=1'; const p = [];
  if (estado) { p.push(estado); sql += ` AND estado=$${p.length}`; }
  if (prioridad) { p.push(prioridad); sql += ` AND prioridad_armado=$${p.length}`; }
  sql += ' ORDER BY fecha_pedido DESC';
  let rows = (await pool.query(sql, p)).rows;
  if (req.user.rol === 'logistica') rows = rows.map(({ nro_factura, ruta_pdf, ...r }) => r);
  res.json(rows);
});

app.patch('/api/pedidos/:id', auth, async (req, res) => {
  const logisticaFields = ['prioridad_armado', 'notas', 'tipo_entrega', 'cantidad_bultos'];
  const allowed = req.user.rol === 'logistica' ? logisticaFields : [...logisticaFields, 'estado'];
  const sets = [], vals = [];
  for (const k of allowed) if (k in req.body) { vals.push(req.body[k]); sets.push(`${k}=$${vals.length}`); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  await pool.query(`UPDATE pedidos SET ${sets.join(',')}, updated_at=now() WHERE id=$${vals.length}`, vals);
  res.json({ ok: true });
});

// ── Clientes ───────────────────────────────────────────────────────────────
app.get('/api/clientes', auth, async (_req, res) =>
  res.json((await pool.query('SELECT * FROM clientes ORDER BY nombre')).rows));

// ── Artículos / Stock ─────────────────────────────────────────────────────
app.get('/api/articulos', auth, async (_req, res) =>
  res.json((await pool.query('SELECT * FROM articulos ORDER BY categoria, subcategoria, tipo')).rows));

app.get('/api/stock', auth, async (_req, res) =>
  res.json((await pool.query(`SELECT s.*, a.categoria, a.subcategoria, a.tipo, a.descripcion, a.unidad_medida
    FROM stock s LEFT JOIN articulos a ON s.articulo_codigo=a.codigo ORDER BY a.categoria, a.subcategoria`)).rows));

// ── Ventas ─────────────────────────────────────────────────────────────────
app.get('/api/ventas', auth, requireRole('ventas', 'admin'), async (_req, res) =>
  res.json((await pool.query(`SELECT v.*, c.nombre cliente_nombre, c.rubro cliente_rubro
    FROM ventas_mensuales v LEFT JOIN clientes c ON v.cliente_isis_id=c.isis_id
    ORDER BY v.periodo DESC, v.total_facturado DESC`)).rows));

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Static (React build, solo en producción) ───────────────────────────────
if (IS_PROD) {
  const dist = path.join(__dirname, '..', 'web', 'dist');
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/isis/') || req.path === '/health') return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

// ── Start ──────────────────────────────────────────────────────────────────
ensureSchema()
  .then(() => seedLeads())
  .then(() => seedISIS())
  .then(() => seedUsers())
  .then(() => app.listen(PORT, () => console.log(`Baigorria API + mock-ISIS + ${IS_PROD ? 'static' : 'dev'} en :${PORT}`)))
  .catch((e) => { console.error('Error iniciando:', e.message); process.exit(1); });
