// src/App.jsx
import { useState } from "react";
import NutriPanel from "./components/NutriPanel";
import ImageAnalysis from "./pages/ImageAnalysis";
import { API } from "./api";

// He movido el código del formulario de diagnóstico a su propio componente
// para que App.jsx quede más limpio.
function PacienteDiagnostico() {
  const [form, setForm] = useState({ age: 28, sex: "F", height_cm: 160, weight_kg: 60, activity: "moderate", conditions: [] });
  const [result, setResult] = useState(null);
  const bmi = form.weight_kg / Math.pow(form.height_cm / 100, 2);
  const toggleCond = (c) => setForm(f=>({ ...f, conditions: f.conditions.includes(c) ? f.conditions.filter(x=>x!==c) : [...f.conditions, c] }));
  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, bmi: Number(bmi.toFixed(1)) };
      const res = await fetch(`${API}/infer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) { alert("No se pudo conectar al backend: "+err.message); }
  };
  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="grid gap-4 bg-white p-4 rounded-2xl shadow">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col text-sm">Edad
            <input type="number" className="border rounded p-2" value={form.age} onChange={e=>setForm({...form, age: Number(e.target.value)})}/>
          </label>
          <label className="flex flex-col text-sm">Sexo
            <select className="border rounded p-2" value={form.sex} onChange={e=>setForm({...form, sex: e.target.value})}>
              <option value="F">Femenino</option><option value="M">Masculino</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">Talla (cm)
            <input type="number" className="border rounded p-2" value={form.height_cm} onChange={e=>setForm({...form, height_cm: Number(e.target.value)})}/>
          </label>
          <label className="flex flex-col text-sm">Peso (kg)
            <input type="number" className="border rounded p-2" value={form.weight_kg} onChange={e=>setForm({...form, weight_kg: Number(e.target.value)})}/>
          </label>
          <label className="flex flex-col text-sm">Actividad
            <select className="border rounded p-2" value={form.activity} onChange={e=>setForm({...form, activity: e.target.value})}>
              <option value="sedentary">Sedentario</option><option value="light">Ligera</option><option value="moderate">Moderada</option><option value="active">Activa</option><option value="very_active">Muy activa</option>
            </select>
          </label>
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Condiciones preexistentes</div>
          <div className="flex flex-wrap gap-2">
            {[{k:"diabetes",label:"Diabetes"},{k:"hypertension",label:"Hipertensión"},{k:"anemia",label:"Anemia"}].map(c=> (
              <button type="button" key={c.k} className={`px-3 py-1 rounded-full border ${form.conditions.includes(c.k)?"bg-slate-900 text-white":"bg-white"}`} onClick={()=>toggleCond(c.k)}>{c.label}</button>
            ))}
          </div>
        </div>
        <div className="text-sm">IMC calculado: <span className="font-semibold">{bmi.toFixed(1)}</span></div>
        <button className="bg-slate-900 text-white rounded-xl px-4 py-2 w-fit">Diagnosticar y Sugerir Dieta</button>
      </form>
      {result && (
        <div className="mt-2 bg-white p-4 rounded-2xl shadow grid gap-3">
          <h2 className="text-xl font-semibold">Resultado</h2>
          <div><div className="text-sm text-slate-500">Diagnóstico</div><div className="text-base">{result.diagnosis?.length? result.diagnosis.join(", "): "Sin hallazgos"}</div></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-3"><div className="text-sm text-slate-500">Calorías objetivo</div><div className="text-lg font-semibold">{result?.plan?.kcal_target || "—"} kcal/día</div></div>
            <div className="border rounded p-3"><div className="text-sm text-slate-500">Macronutrientes</div>{result?.plan?.macro_split? (<div className="text-sm">Carbos: {(result.plan.macro_split.carb_pct*100).toFixed(0)}% · Prot: {(result.plan.macro_split.prot_pct*100).toFixed(0)}% · Grasas: {(result.plan.macro_split.fat_pct*100).toFixed(0)}%</div>) : "—"}</div>
          </div>
          <div><div className="text-sm text-slate-500">Consejos</div><ul className="list-disc ml-5 text-sm">{(result?.plan?.advice||[]).map((a,i)=><li key={i}>{a}</li>)}</ul></div>
          <div><div className="text-sm text-slate-500">Explicación (Reglas activadas)</div><ul className="list-disc ml-5 text-sm">{(result?.fired_rules||[]).map(r=> <li key={r.id}><b>{r.id}</b>: {r.explain}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}

// Este es un componente de relleno para la futura pestaña "Mi Plan".
function PacientePlan() {
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-2">Mi Plan Nutricional</h2>
      <p className="text-sm text-slate-600">Próximamente: Aquí verás tu plan diario/semanal de comidas y un seguimiento de tus hábitos.</p>
    </div>
  );
}

// El componente principal que maneja las pestañas
export default function App() {
  const [tab, setTab] = useState("paciente"); // La pestaña por defecto es la del paciente
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Sistema Experto de Nutrición</h1>
        {/* Navegación por pestañas */}
        <div className="flex gap-2 mb-4 border-b">
          <button className={`px-4 py-2 rounded-t-lg ${tab==='paciente'?'bg-slate-900 text-white':'border-transparent hover:bg-slate-200'}`} onClick={()=>setTab('paciente')}>Diagnóstico Paciente</button>
          <button className={`px-4 py-2 rounded-t-lg ${tab==='image'?'bg-emerald-600 text-white':'border-transparent hover:bg-slate-200'}`} onClick={()=>setTab('image')}>
            📸 Análisis por Imagen
          </button>
          <button className={`px-4 py-2 rounded-t-lg ${tab==='plan'?'bg-slate-900 text-white':'border-transparent hover:bg-slate-200'}`} onClick={()=>setTab('plan')}>Mi plan</button>
          <button className={`px-4 py-2 rounded-t-lg ${tab==='nutri'?'bg-slate-900 text-white':'border-transparent hover:bg-slate-200'}`} onClick={()=>setTab('nutri')}>Panel Nutricionista</button>
        </div>

        {/* Contenido dinámico según la pestaña seleccionada */}
        {tab==='paciente' && <PacienteDiagnostico />}
        {tab==='image' && <ImageAnalysis />}
        {tab==='plan' && <PacientePlan />}
        {tab==='nutri' && <NutriPanel />}
      </div>
    </div>
  );
}