import { useEffect, useState } from 'react';
import { api, num } from '../api.js';

const EST_COLOR = { Disponible: '#3fb950', 'Bajo stock': '#d29922', 'Sin stock': '#e94560' };

export default function Stock() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api('/stock').then(setRows).catch(() => {}); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Stock <span className="text-gray-400 font-normal text-base">({rows.length})</span></h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>{['Código', 'Categoría', 'Descripción', 'Kilos', 'Unidades', 'Estado', 'Ubicación'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.articulo_codigo}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.categoria} / {r.subcategoria}</td>
                <td className="px-3 py-2 text-gray-500 max-w-[260px] truncate">{r.descripcion}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.kilos_disponibles ? num(r.kilos_disponibles) + ' kg' : '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.unidades_disponibles ? num(r.unidades_disponibles) : '—'}</td>
                <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: EST_COLOR[r.estado] || '#8b949e' }}>{r.estado}</span></td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.ubicacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
