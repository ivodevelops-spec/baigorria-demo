import { useEffect, useState } from 'react';
import { api, money, num } from '../api.js';
import { useAuth } from '../auth.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BRAND = '#004C97';
const COLORS = ['#004C97', '#0066CC', '#3fb950', '#d29922', '#e94560', '#8b5cf6', '#06b6d4', '#f97316'];

function Kpi({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="text-2xl font-extrabold" style={{ color: accent || '#1f2328' }}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">{title}</div>
      {children}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  useEffect(() => { api('/dashboard').then(setD).catch(() => {}); }, []);
  if (!d) return <div className="text-gray-400">Cargando…</div>;

  const esVentas = d.rol === 'ventas' || d.rol === 'admin';
  const k = d.kpis;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-800">Hola, {user.nombre} 👋</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {esVentas && <Kpi label="Leads totales" value={num(k.leadsTotal)} accent={BRAND} />}
        {esVentas && <Kpi label="🔥 Leads hot" value={num(k.leadsHot)} accent="#e94560" />}
        {esVentas && <Kpi label="Tasa de cierre" value={k.convRate + '%'} accent="#3fb950" />}
        {esVentas && <Kpi label="Facturación del mes" value={money(k.facturacionMes)} accent={BRAND} />}
        <Kpi label="Pedidos activos" value={num(k.pedidosActivos)} accent="#0066CC" />
        <Kpi label="Stock (kg)" value={num(k.stockKilos)} />
        <Kpi label="Lead time entrega" value={k.leadTimeDias != null ? k.leadTimeDias + ' días' : '—'} />
        {esVentas && <Kpi label="Clientes" value={num(k.clientesTotal)} />}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {esVentas && (
          <Card title="Funnel de leads (por estado)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.funnel} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="estado" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="n" radius={[0, 4, 4, 0]}>
                  {d.funnel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card title="Pedidos por estado">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.pedidosByEstado}>
              <XAxis dataKey="estado" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="n" radius={[4, 4, 0, 0]}>
                {d.pedidosByEstado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {esVentas && d.porRubro && (
          <Card title="Leads por rubro">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.porRubro} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="rubro" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="n" fill={BRAND} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {esVentas && d.porProvincia && (
          <Card title="Top provincias">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.porProvincia} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="provincia" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="n" fill="#0066CC" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}
