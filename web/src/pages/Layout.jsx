import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const ALL = [
  { to: '/', label: 'Inicio', end: true, roles: ['ventas', 'logistica', 'admin'] },
  { to: '/leads', label: 'Leads', roles: ['ventas', 'admin'] },
  { to: '/pedidos', label: 'Pedidos', roles: ['ventas', 'logistica', 'admin'] },
  { to: '/clientes', label: 'Clientes', roles: ['ventas', 'admin'] },
  { to: '/stock', label: 'Stock', roles: ['ventas', 'logistica', 'admin'] },
  { to: '/ventas', label: 'Ventas', roles: ['ventas', 'admin'] },
];

const ROL_LABEL = { ventas: 'Ventas', logistica: 'Logística', admin: 'Admin' };

export default function Layout() {
  const { user, logout } = useAuth();
  const items = ALL.filter((i) => i.roles.includes(user.rol));

  return (
    <div className="min-h-screen">
      <header className="text-white" style={{ background: '#004C97' }}>
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="font-extrabold tracking-tight text-lg">
            BAIGORRIA <span className="font-light opacity-70 text-sm">Industrial</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="opacity-80">{user.nombre}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20">{ROL_LABEL[user.rol]}</span>
            <button onClick={logout} className="px-3 py-1 rounded-md bg-white/15 hover:bg-white/25 transition">Salir</button>
          </div>
        </div>
        <nav className="px-6 flex gap-1 overflow-x-auto">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}
              className={({ isActive }) =>
                'px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ' +
                (isActive ? 'bg-[#f5f6fa] text-[#004C97]' : 'text-white/80 hover:bg-white/10')}>
              {i.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="p-6 max-w-7xl mx-auto"><Outlet /></main>
    </div>
  );
}
