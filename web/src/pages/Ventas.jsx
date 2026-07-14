import { useEffect, useState } from 'react';
import { api, money, num } from '../api.js';

export default function Ventas() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api('/ventas').then(setRows).catch(() => {}); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Ventas mensuales <span className="text-gray-400 font-normal text-base">({rows.length})</span></h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>{['Período', 'Cliente', 'Rubro', 'Total facturado', 'Kilos', 'Ticket promedio'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.periodo}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.cliente_nombre}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.cliente_rubro}</td>
                <td className="px-3 py-2 font-semibold whitespace-nowrap" style={{ color: '#004C97' }}>{money(r.total_facturado)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{num(r.kilos_vendidos)} kg</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{money(r.ticket_promedio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
