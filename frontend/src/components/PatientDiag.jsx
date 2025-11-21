import { useState, useRef } from 'react';
import { API } from '../api';
import { showError, showSuccess } from '../utils/notifications';

export default function PatientDiag(){
  const [form,setForm]=useState({age:28,sex:'F',height_cm:160,weight_kg:60,activity:'moderate',conditions:[]});
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const isSubmittingRef = useRef(false); // ✨ Prevenir múltiples envios
  
  const bmi = form.weight_kg / Math.pow(form.height_cm/100, 2);
  const toggleCond=(c)=> setForm(f=>({...f, conditions: f.conditions.includes(c)? f.conditions.filter(x=>x!==c):[...f.conditions,c]}));
  
  const submit=async(e)=>{
    e.preventDefault();
    
    // ✨ Prevenir múltiples envios
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    setLoading(true);
    
    try {
      const payload={...form,bmi:Number(bmi.toFixed(1))}; 
      const r=await fetch(`${API}/infer`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      }); 
      
      if(!r.ok) {
        const text = await r.text();
        throw new Error(`Error ${r.status}: ${text}`);
      }
      
      const data=await r.json(); 
      setResult(data);
      showSuccess('Diagnóstico generado exitosamente');
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false; // ✨ Permitir nuevo envio
    }
  };
  
  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="grid gap-6 bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-slate-800">📋 Datos del Paciente</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm">
            <span className="font-medium text-slate-700 mb-1">Edad (años)</span>
            <input 
              type="number" 
              className="border rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition" 
              value={form.age} 
              onChange={e=>setForm({...form, age: Number(e.target.value)})}
              min="1"
              max="119"
              required
              disabled={loading}
            />
          </label>
          
          <label className="flex flex-col text-sm">
            <span className="font-medium text-slate-700 mb-1">Sexo</span>
            <select 
              className="border rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition bg-white" 
              value={form.sex} 
              onChange={e=>setForm({...form, sex: e.target.value})}
              disabled={loading}
            >
              <option value="F">👩 Femenino</option>
              <option value="M">👨 Masculino</option>
            </select>
          </label>
          
          <label className="flex flex-col text-sm">
            <span className="font-medium text-slate-700 mb-1">Talla (cm)</span>
            <input 
              type="number" 
              className="border rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition" 
              value={form.height_cm} 
              onChange={e=>setForm({...form, height_cm: Number(e.target.value)})}
              min="50"
              max="250"
              required
              disabled={loading}
            />
          </label>
          
          <label className="flex flex-col text-sm">
            <span className="font-medium text-slate-700 mb-1">Peso (kg)</span>
            <input 
              type="number" 
              className="border rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition" 
              value={form.weight_kg} 
              onChange={e=>setForm({...form, weight_kg: Number(e.target.value)})}
              min="20"
              max="300"
              required
              disabled={loading}
            />
          </label>
          
          <label className="flex flex-col text-sm col-span-2">
            <span className="font-medium text-slate-700 mb-1">Nivel de actividad física</span>
            <select 
              className="border rounded-lg p-3 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition bg-white" 
              value={form.activity} 
              onChange={e=>setForm({...form, activity: e.target.value})}
              disabled={loading}
            >
              <option value="sedentary">🛋️ Sedentario (poco o ningún ejercicio)</option>
              <option value="light">🚶 Ligera (ejercicio 1-3 días/semana)</option>
              <option value="moderate">🏃 Moderada (ejercicio 3-5 días/semana)</option>
              <option value="active">💪 Activa (ejercicio 6-7 días/semana)</option>
              <option value="very_active">🏋️ Muy activa (ejercicio intenso diario)</option>
            </select>
          </label>
        </div>
        
        <div>
          <div className="text-sm font-medium text-slate-700 mb-2">Condiciones preexistentes</div>
          <div className="flex flex-wrap gap-2">
            {[
              {k:"diabetes",label:"Diabetes",icon:"💉"},
              {k:"hypertension",label:"Hipertensión",icon:"❤️"},
              {k:"anemia",label:"Anemia",icon:"🩸"}
            ].map(c=> (
              <button 
                type="button" 
                key={c.k} 
                className={`px-4 py-2 rounded-lg border-2 transition ${form.conditions.includes(c.k)?'bg-slate-900 text-white border-slate-900':'bg-white hover:border-slate-400 border-slate-200'}`} 
                onClick={()=>toggleCond(c.k)}
                disabled={loading}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600">IMC calculado:</div>
          <div className="text-3xl font-bold text-slate-900">{bmi.toFixed(1)}</div>
          <div className="text-xs text-slate-500 mt-1">
            {bmi < 18.5 ? '⚠️ Bajo peso' : bmi < 25 ? '✅ Peso normal' : bmi < 30 ? '⚠️ Sobrepeso' : '🔴 Obesidad'}
          </div>
        </div>
        
        <button 
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generando diagnóstico...</span>
            </>
          ) : (
            <>🩺 Diagnosticar y Sugerir Dieta</>
          )}
        </button>
      </form>
      
      {result && (
        <div className="bg-white p-6 rounded-2xl shadow-lg grid gap-4 animate-fadeIn">
          <h2 className="text-2xl font-bold text-slate-800">📊 Resultado del Diagnóstico</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="text-sm font-medium text-blue-900 mb-1">Diagnóstico</div>
            <div className="text-lg text-blue-800">
              {result.diagnosis?.length? result.diagnosis.join(", "): "Sin hallazgos"}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-slate-200 rounded-xl p-4 hover:border-slate-300 transition">
              <div className="text-sm text-slate-500 mb-1">🍽️ Calorías objetivo</div>
              <div className="text-2xl font-bold text-slate-900">
                {result?.plan?.kcal_target || "—"} <span className="text-base font-normal text-slate-600">kcal/día</span>
              </div>
            </div>
            
            <div className="border-2 border-slate-200 rounded-xl p-4 hover:border-slate-300 transition">
              <div className="text-sm text-slate-500 mb-1">🥗 Macronutrientes</div>
              {result?.plan?.macro_split? (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Carbohidratos:</span>
                    <span className="font-semibold">{(result.plan.macro_split.carb_pct*100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Proteínas:</span>
                    <span className="font-semibold">{(result.plan.macro_split.prot_pct*100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grasas:</span>
                    <span className="font-semibold">{(result.plan.macro_split.fat_pct*100).toFixed(0)}%</span>
                  </div>
                </div>
              ) : <div className="text-slate-400">—</div>}
            </div>
          </div>
          
          {result?.plan?.advice?.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="text-sm font-medium text-green-900 mb-2">💡 Consejos Nutricionales</div>
              <ul className="list-disc ml-5 text-sm text-green-800 space-y-1">
                {result.plan.advice.map((a,i)=><li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          
          {result?.fired_rules?.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-sm font-medium text-slate-700 mb-2">📋 Reglas Aplicadas</div>
              <ul className="text-sm text-slate-600 space-y-1">
                {result.fired_rules.map(r=> (
                  <li key={r.id} className="flex items-start gap-2">
                    <span className="font-semibold text-slate-900">{r.id}:</span>
                    <span>{r.explain}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}