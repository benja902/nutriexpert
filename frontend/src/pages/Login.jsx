import { useState } from 'react';
import { API } from '../api';
import { saveToken } from '../auth';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '../utils/notifications';

export default function Login(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const form = new FormData();
      form.append('username', email);
      form.append('password', password);
      
      const r = await fetch(`${API}/auth/login`, { method:'POST', body: form });
      
      if(!r.ok){ 
        const errorText = await r.text();
        throw new Error(errorText || 'Credenciales inválidas');
      }
      
      const data = await r.json();
      saveToken(data.access_token);
      showSuccess('¡Bienvenido! Iniciando sesión...');
      
      setTimeout(() => nav('/dashboard'), 500);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md grid gap-4">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-slate-800">NutriExpert</h1>
          <p className="text-slate-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input 
            className="border rounded-lg p-3 w-full mt-1 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition" 
            placeholder="tu@email.com" 
            type="email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Contraseña</label>
          <input 
            className="border rounded-lg p-3 w-full mt-1 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition" 
            placeholder="••••••" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required
            minLength={6}
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
        </div>
        
        <button 
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>🔐 Entrar</>
          )}
        </button>
        
        <div className="text-sm text-center text-slate-600">
          ¿No tienes cuenta? <a className="underline text-slate-900 font-medium hover:text-slate-700" href="/register">Regístrate</a>
        </div>
        
        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-700 mb-1">👤 Usuario demo:</p>
          <p className="text-xs text-slate-600">Email: <code className="bg-white px-1 py-0.5 rounded">pro@nutri.com</code></p>
          <p className="text-xs text-slate-600">Contraseña: <code className="bg-white px-1 py-0.5 rounded">nutri123</code></p>
        </div>
      </form>
    </div>
  );
}
