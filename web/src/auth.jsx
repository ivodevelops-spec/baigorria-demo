import { createContext, useContext, useState } from 'react';
import { api, setToken, clearToken, getToken } from './api.js';

const AuthCtx = createContext(null);

function decodeUser() {
  const t = getToken();
  if (!t) return null;
  try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(decodeUser());

  async function login(usuario, password) {
    const r = await api('/auth/login', { method: 'POST', body: { usuario, password } });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }
  function logout() { clearToken(); setUser(null); window.location.href = '/login'; }

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
