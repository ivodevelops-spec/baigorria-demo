import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try { await login(usuario, password); nav('/'); }
    catch { setErr('Usuario o contraseña incorrectos'); }
    finally { setLoading(false); }
  }

  const fill = (u, p) => { setUsuario(u); setPassword(p); };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #004C97 0%, #f5f6fa 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-2xl font-extrabold tracking-tight" style={{ color: '#004C97' }}>
            BAIGORRIA <span className="font-light text-gray-400 text-base">Industrial</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">Gestión Comercial</div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#004C97' }} placeholder="Usuario" value={usuario}
            onChange={(e) => setUsuario(e.target.value)} autoFocus />
          <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button disabled={loading} className="w-full text-white font-semibold rounded-lg py-2 transition"
            style={{ background: '#004C97', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <div className="mt-6 text-xs text-gray-400 space-y-1">
          <div className="font-semibold text-gray-500">Accesos demo:</div>
          <button onClick={() => fill('florencia', 'flor123')} className="block hover:underline">› Florencia (ventas)</button>
          <button onClick={() => fill('martin', 'martin123')} className="block hover:underline">› Martín (logística — sin facturación)</button>
          <button onClick={() => fill('admin', 'admin123')} className="block hover:underline">› Admin (todo)</button>
        </div>
      </div>
    </div>
  );
}
