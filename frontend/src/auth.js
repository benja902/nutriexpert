export function saveToken(t){ localStorage.setItem('token', t); }
export function getToken(){ return localStorage.getItem('token'); }
export function getAuthToken(){ return localStorage.getItem('token'); }
export function clearToken(){ localStorage.removeItem('token'); }
export function authHeaders(){
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
