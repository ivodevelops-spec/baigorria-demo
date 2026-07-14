const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'baigorria-dev-secret-2026';
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'baigorria',
  password: process.env.PGPASSWORD || 'baigorria_dev_2026',
  database: process.env.PGDATABASE || 'baigorria',
});

const app = express();
app.use(cors());
app.use(express.json());

// ── Usuarios + roles (seed) ────────────────────────────────────────────────
// roles: admin (todo) · ventas (Florencia) · logistica (Martin, SIN facturacion)
async function seedUsers() {
  await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY, usuario TEXT UNIQUE, nombre TEXT, rol TEXT, pass_hash TEXT
  )`);
  for (const u of loadUsers()) {
    await pool.query(
      `INSERT INTO usuarios (usuario,nombre,rol,pass_hash) VALUES ($1,$2,$3,$4)
       ON CONFLICT (usuario) DO UPDATE SET nombre=EXCLUDED.nombre, rol=EXCLUDED.rol`,
      [u.usuario, u.nombre, u.rol, bcrypt.hashSync(u.password, 8)]
    );
  }
}

const DEFAULT_USERS = [
  { usuario: 'florencia', nombre: 'Florencia', rol: 'ventas', password: 'flor123' },
  { usuario: 'martin', nombre: 'Martín', rol: 'logistica', password: 'martin123' },
  { usuario: 'admin', nombre: 'Administrador', rol: 'admin', password: 'admin123' },
];
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8')); }
  catch { return DEFAULT_USERS; }
}

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

// ── Dashboard (role-shaped) ─────────────────────────────────────────────────
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

// ── Leads (solo ventas/admin) ───────────────────────────────────────────────
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

// ── Pedidos (todos; logistica NO ve nro_factura) ────────────────────────────
app.get('/api/pedidos', auth, async (req, res) => {
  const { estado, prioridad } = req.query;
  let sql = 'SELECT * FROM pedidos WHERE 1=1'; const p = [];
  if (estado) { p.push(estado); sql += ` AND estado=$${p.length}`; }
  if (prioridad) { p.push(prioridad); sql += ` AND prioridad_armado=$${p.length}`; }
  sql += ' ORDER BY fecha_pedido DESC';
  let rows = (await pool.query(sql, p)).rows;
  if (req.user.rol === 'logistica') rows = rows.map(({ nro_factura, ruta_pdf, ...r }) => r); // facturacion oculta (C#64)
  res.json(rows);
});

app.patch('/api/pedidos/:id', auth, async (req, res) => {
  // logistica edita datos operativos (prioridad, notas, entrega, bultos); ventas/admin tambien estado
  const logisticaFields = ['prioridad_armado', 'notas', 'tipo_entrega', 'cantidad_bultos'];
  const allowed = req.user.rol === 'logistica'
    ? logisticaFields
    : [...logisticaFields, 'estado'];
  const sets = [], vals = [];
  for (const k of allowed) if (k in req.body) { vals.push(req.body[k]); sets.push(`${k}=$${vals.length}`); }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  await pool.query(`UPDATE pedidos SET ${sets.join(',')}, updated_at=now() WHERE id=$${vals.length}`, vals);
  res.json({ ok: true });
});

// ── Clientes (todos; sin montos, logistica los necesita para picking/despacho) ─
app.get('/api/clientes', auth, async (_req, res) =>
  res.json((await pool.query('SELECT * FROM clientes ORDER BY nombre')).rows));

// ── Articulos / Stock (todos) ───────────────────────────────────────────────
app.get('/api/articulos', auth, async (_req, res) =>
  res.json((await pool.query('SELECT * FROM articulos ORDER BY categoria, subcategoria, tipo')).rows));

app.get('/api/stock', auth, async (_req, res) =>
  res.json((await pool.query(`SELECT s.*, a.categoria, a.subcategoria, a.tipo, a.descripcion, a.unidad_medida
    FROM stock s LEFT JOIN articulos a ON s.articulo_codigo=a.codigo ORDER BY a.categoria, a.subcategoria`)).rows));

// ── Ventas (facturacion: ventas/admin) ──────────────────────────────────────
app.get('/api/ventas', auth, requireRole('ventas', 'admin'), async (_req, res) =>
  res.json((await pool.query(`SELECT v.*, c.nombre cliente_nombre, c.rubro cliente_rubro
    FROM ventas_mensuales v LEFT JOIN clientes c ON v.cliente_isis_id=c.isis_id
    ORDER BY v.periodo DESC, v.total_facturado DESC`)).rows));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

seedUsers()
  .then(() => app.listen(PORT, () => console.log(`API Baigorria en http://localhost:${PORT}`)))
  .catch((e) => { console.error('Error iniciando API:', e.message); process.exit(1); });
