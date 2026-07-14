import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Clientes() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api('/clientes').then(setRows).catch(() => {}); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Clientes <span className="text-gray-400 font-normal text-base">({rows.length})</span></h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>{['Nombre', 'CUIT', 'Rubro', 'Provincia', 'Localidad', 'Teléfono', 'Email', 'Vendedor'].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium whitespace-nowrap">{r.nombre}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.cuit}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.rubro}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.provincia}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.localidad}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.telefono}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.email}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.vendedor_asignado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
