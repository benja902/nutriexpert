import { useEffect, useState, useRef } from 'react';
import { apiGet } from '../api';
import { clearToken } from '../auth';
import { showInfo, showError } from '../utils/notifications';
import RulesAdmin from '../components/RulesAdmin';
import PatientDiag from '../components/PatientDiag';
import ImageAnalysis from './ImageAnalysis';

export default function Dashboard(){
  const [me,setMe]=useState(null);
  const [tab,setTab]=useState('home');
  const [loading,setLoading]=useState(true);
  const hasCheckedAuthRef = useRef(false); // ✨ Usar ref

  useEffect(()=>{
    // ✨ Prevenir múltiples verificaciones
    if (hasCheckedAuthRef.current) return;
    hasCheckedAuthRef.current = true;
    
    (async()=>{
      try{
        const u = await apiGet('/auth/me');
        setMe(u);
      }catch(error){
        showError(new Error('Sesión expirada. Por favor inicia sesión nuevamente.'));
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } finally {
        setLoading(false);
      }
    })();
  },[]); // ✨ Sin dependencias

  const logout=()=>{ 
    clearToken(); 
    showInfo('Sesión cerrada correctamente');
    setTimeout(() => {
      window.location.href='/login';
    }, 500);
  };

  if(loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if(!me) return null;

  const isNutri = me.role === 'nutritionist';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Hola, {me.name} 👋</h1>
            <p className="text-slate-500 text-sm mt-1">
              {isNutri ? '🩺 Nutricionista' : '👤 Paciente'} • {me.email}
            </p>
          </div>
          <button 
            className="border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg px-4 py-2 transition flex items-center gap-2" 
            onClick={logout}
          >
            🚪 Cerrar sesión
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button 
            className={`px-6 py-3 rounded-t-lg font-medium transition ${tab==='home'?'bg-slate-900 text-white border-b-2 border-slate-900':' text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`} 
            onClick={()=>setTab('home')}
          >
            📊 Mi diagnóstico
          </button>
          <button 
            className={`px-6 py-3 rounded-t-lg font-medium transition ${tab==='image'?'bg-emerald-600 text-white border-b-2 border-emerald-600':'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`} 
            onClick={()=>setTab('image')}
          >
            📸 Análisis por Imagen
          </button>
          {isNutri && (
            <button 
              className={`px-6 py-3 rounded-t-lg font-medium transition ${tab==='rules'?'bg-slate-900 text-white border-b-2 border-slate-900':'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`} 
              onClick={()=>setTab('rules')}
            >
              ⚙️ Admin Reglas
            </button>
          )}
        </div>

        {tab==='home' && <PatientDiag/>}
        {tab==='image' && <ImageAnalysis/>}
        {tab==='rules' && isNutri && <RulesAdmin/>}
      </div>
    </div>
  );
}
