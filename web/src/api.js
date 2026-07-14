const TOKEN_KEY = 'baigorria_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { clearToken(); window.location.href = '/login'; throw new Error('401'); }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || res.status);
  return data;
}

export const money = (n) => '$' + (Number(n) || 0).toLocaleString('es-AR');
export const num = (n) => (Number(n) || 0).toLocaleString('es-AR');
