import { useEffect, useState } from 'react';
import { api } from '../api.js';

const ESTADOS = ['Nuevo', 'Sin contactar', 'Esperando rta', 'En seguimiento', 'Contactado', 'Cerrado', 'Perdido'];

function ScoreBadge({ s }) {
  const cfg = s >= 70 ? ['#e94560', '🔥'] : s >= 40 ? ['#d29922', '~'] : ['#8b949e', '❄'];
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: cfg[0] }}>{cfg[1]} {s}</span>;
}

export default function Leads() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [rubro, setRubro] = useState('');

  const load = () => {
    const p = new URLSearchParams();
    if (q) p.set('q', q); if (estado) p.set('estado', estado); if (rubro) p.set('rubro', rubro);
    api('/leads?' + p.toString()).then(setRows).catch(() => {});
  };
  useEffect(load, [q, estado, rubro]);

  const rubros = [...new Set(rows.map((r) => r.rubro).filter(Boolean))];

  async function setEstadoLead(id, value) {
    await api('/leads/' + id, { method: 'PATCH', body: { estado: value } });
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, estado: value } : r)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-800">Leads <span className="text-gray-400 font-normal text-base">({rows.length})</span></h1>
        <div className="flex gap-2 flex-wrap">
          <input className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>{ESTADOS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={rubro} onChange={(e) => setRubro(e.target.value)}>
            <option value="">Todos los rubros</option>{rubros.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['Score', 'Nombre', 'Empresa', 'Rubro', 'Provincia', 'WhatsApp', 'Estado', 'Vendedor', 'Pain Point'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2"><ScoreBadge s={r.lead_score} /></td>
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.nombre} {r.apellido}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.empresa || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.rubro}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{r.provincia || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{r.telefono || '—'}</td>
                <td className="px-3 py-2">
                  <select value={r.estado} onChange={(e) => setEstadoLead(r.id, e.target.value)}
                    className="border border-gray-200 rounded px-1.5 py-1 text-xs">
                    {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{r.vendedor || '—'}</td>
                <td className="px-3 py-2 text-gray-500 max-w-[160px] truncate">{r.dolor || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
