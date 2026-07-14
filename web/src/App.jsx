import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import Login from './pages/Login.jsx';
import Layout from './pages/Layout.jsx';
import Home from './pages/Home.jsx';
import Leads from './pages/Leads.jsx';
import Pedidos from './pages/Pedidos.jsx';
import Clientes from './pages/Clientes.jsx';
import Stock from './pages/Stock.jsx';
import Ventas from './pages/Ventas.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Layout /></Protected>}>
          <Route index element={<Home />} />
          <Route path="leads" element={<Leads />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="stock" element={<Stock />} />
          <Route path="ventas" element={<Ventas />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
