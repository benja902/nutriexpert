import { useState } from 'react';
import { apiJson } from '../api';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '../utils/notifications';

export default function Register(){
  const [form, setForm] = useState({email:'', name:'', password:'', role:'patient'});
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const nav = useNavigate();
  
  const validatePassword = (pwd) => {
    if (pwd.length === 0) {
      setPasswordError('');
      return;
    }
    if (pwd.length < 6) {
      setPasswordError(`Faltan ${6 - pwd.length} caracteres`);
    } else if (pwd.length > 100) {
      setPasswordError('Máximo 100 caracteres');
    } else {
      setPasswordError('');
    }
  };
  
  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setForm({...form, password: pwd});
    validatePassword(pwd);
  };
  
  const submit = async (e) => {
    e.preventDefault();
    
    if (passwordError) {
      showError(new Error('Por favor corrige los errores del formulario'));
      return;
    }
    
    setLoading(true);
    
    try {
      await apiJson('POST', '/auth/register', form);
      showSuccess('¡Cuenta creada exitosamente! Redirigiendo al login...');
      setTimeout(() => nav('/login'), 1500);
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
          <h1 className="text-3xl font-bold text-slate-800">Crear Cuenta</h1>
          <p className="text-slate-500 mt-1">Regístrate en NutriExpert</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Nombre completo</label>
          <input 
            className="border rounded-lg p-3 w-full mt-1 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition" 
            placeholder="Tu nombre" 
            value={form.name} 
            onChange={e=>setForm({...form, name:e.target.value})} 
            required
            minLength={2}
            maxLength={100}
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">Entre 2 y 100 caracteres</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input 
            className="border rounded-lg p-3 w-full mt-1 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition" 
            placeholder="tu@email.com" 
            type="email" 
            value={form.email} 
            onChange={e=>setForm({...form, email:e.target.value})} 
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Contraseña</label>
          <input 
            className={`border rounded-lg p-3 w-full mt-1 focus:ring-2 ${passwordError ? 'border-red-300 focus:ring-red-500' : 'focus:ring-slate-500'} focus:border-transparent outline-none transition`}
            placeholder="••••••" 
            type="password" 
            value={form.password} 
            onChange={handlePasswordChange}
            required
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">Mínimo 6 caracteres</p>
            {form.password && (
              <p className={`text-xs ${passwordError ? 'text-red-600' : 'text-green-600'}`}>
                {passwordError || `✓ ${form.password.length} caracteres`}
              </p>
            )}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Rol</label>
          <select 
            className="border rounded-lg p-3 w-full mt-1 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition bg-white" 
            value={form.role} 
            onChange={e=>setForm({...form, role:e.target.value})}
            disabled={loading}
          >
            <option value="patient">👤 Paciente</option>
            <option value="nutritionist">🩺 Nutricionista</option>
          </select>
        </div>
        
        <button 
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={loading || passwordError}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creando cuenta...</span>
            </>
          ) : (
            <>✨ Registrarme</>
          )}
        </button>
        
        <div className="text-sm text-center text-slate-600">
          ¿Ya tienes cuenta? <a className="underline text-slate-900 font-medium hover:text-slate-700" href="/login">Inicia sesión</a>
        </div>
      </form>
    </div>
  );
}