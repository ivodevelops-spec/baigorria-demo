import { useEffect, useState } from 'react';
import { api, num } from '../api.js';

const PRIORIDADES = ['Alta', 'Media', 'Baja'];
const TIPOS_ENTREGA = [{ v: '', l: '—' }, { v: 'retiro', l: 'Retiro' }, { v: 'expresa', l: 'Expresa' }, { v: 'flete_baigorria', l: 'Flete Baigorria' }];
const EST_COLOR = { 'En proceso': '#8b949e', Terminado: '#0066CC', Facturado: '#3fb950', Despachado: '#8b5cf6' };
const PRIO_COLOR = { Alta: '#e94560', Media: '#d29922', Baja: '#8b949e' };

export default function Pedidos() {
  const [rows, setRows] = useState([]);
  const [estado, setEstado] = useState('');
  const [prioridad, setPrioridad] = useState('');

  const load = () => {
    const p = new URLSearchParams();
    if (estado) p.set('estado', estado); if (prioridad) p.set('prioridad', prioridad);
    api('/pedidos?' + p.toString()).then(setRows).catch(() => {});
  };
  useEffect(load, [estado, prioridad]);

  const verFactura = rows.length > 0 && 'nro_factura' in rows[0];

  async function setPrio(id, value) {
    await api('/pedidos/' + id, { method: 'PATCH', body: { prioridad_armado: value } });
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, prioridad_armado: value } : r)));
  }

  async function setCampo(id, field, value) {
    await api('/pedidos/' + id, { method: 'PATCH', body: { [field]: value } });
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-800">Pedidos <span className="text-gray-400 font-normal text-base">({rows.length})</span></h1>
        <div className="flex gap-2">
          <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>{['En proceso', 'Terminado', 'Facturado', 'Despachado'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
            <option value="">Toda prioridad</option>{PRIORIDADES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-400">Los pedidos entran solos desde ISIS — sin copiar y pegar. Martín solo asigna la prioridad de armado.</p>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['Nro', 'Cliente', 'Fecha', 'Kilos', 'Estado', 'Prioridad armado', 'Tipo entrega', 'Bultos', 'Retira', ...(verFactura ? ['Factura'] : [])].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{r.nro_pedido}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.cliente_nombre}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{(r.fecha_pedido || '').slice(0, 10)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{num(r.kilos_total)} kg</td>
                <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: EST_COLOR[r.estado] || '#8b949e' }}>{r.estado}</span></td>
                <td className="px-3 py-2">
                  <select value={r.prioridad_armado} onChange={(e) => setPrio(r.id, e.target.value)}
                    className="rounded px-1.5 py-1 text-xs font-semibold text-white border-0" style={{ background: PRIO_COLOR[r.prioridad_armado] }}>
                    {PRIORIDADES.map((s) => <option key={s} className="text-black bg-white">{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select value={r.tipo_entrega || ''} onChange={(e) => setCampo(r.id, 'tipo_entrega', e.target.value)}
                    className="border border-gray-300 rounded px-1.5 py-1 text-xs">
                    {TIPOS_ENTREGA.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input type="number" value={r.cantidad_bultos ?? ''} onChange={(e) => setCampo(r.id, 'cantidad_bultos', e.target.value === '' ? null : Number(e.target.value))}
                    className="border border-gray-300 rounded px-1.5 py-1 text-xs w-16" />
                </td>
                <td className="px-3 py-2 text-gray-500">{r.retira_local ? 'Sí' : 'No'}</td>
                {verFactura && <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.nro_factura || '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
