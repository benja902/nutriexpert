export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
import { authHeaders } from './auth';

// Debug: Mostrar la URL del API que se está usando
console.log('🔧 API URL configurada:', API);
console.log('🔧 Variables de entorno:', import.meta.env);

// ✨ Helper para fetch con timeout
const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('⏰ Tiempo de espera agotado (10s). El servidor no responde. Verifica que el backend esté corriendo y el puerto 8000 esté como PUBLIC en VS Code.')), timeout)
    )
  ]);
};

export async function apiGet(path){
  try {
    const r = await fetchWithTimeout(`${API}${path}`, { headers: authHeaders() });
    if(!r.ok) {
      const text = await r.text();
      throw new Error(`GET ${path} -> ${r.status} ${text}`);
    }
    return r.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(`❌ No se puede conectar al backend. Verifica:
1. Backend corriendo en puerto 8000
2. Puerto 8000 como PUBLIC en VS Code
3. URL correcta en .env.development`);
    }
    throw error;
  }
}

export async function apiJson(method, path, body){
  try {
    const r = await fetchWithTimeout(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body)
    });
    if(!r.ok){
      const t = await r.text();
      throw new Error(`${method} ${path} -> ${r.status} ${t}`);
    }
    return r.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(`❌ No se puede conectar al backend. Verifica la configuración.`);
    }
    throw error;
  }
}

export async function apiDelete(path){
  const r = await fetchWithTimeout(`${API}${path}`, { method:'DELETE', headers: authHeaders() });
  if(!r.ok){
    const t = await r.text();
    throw new Error(`DELETE ${path} -> ${r.status} ${t}`);
  }
  return r.json();
}
