import { useEffect, useState, useRef } from "react";
import { apiGet, apiJson, apiDelete } from "../api";
import RuleForm from "./RuleForm";
import { showError, showSuccess, showWarning, showInfo } from "../utils/notifications";

function humanWhen(w){
  if(!w || !w.length) return "—";
  return w.map(c=>{
    const fact = c.fact === "bmi" ? "IMC"
      : c.fact === "activity" ? "Actividad"
      : c.fact === "conditions" ? "Condiciones"
      : c.fact;
    const op = ({">=":"≥",">":">","<=":"≤","<":"<","==":"=", "!=":"≠", "contains":"contiene","in":"en lista","not_in":"no en lista"})[c.op] || c.op;
    let val = Array.isArray(c.value) ? c.value.join(", ") : c.value;
    if(c.fact==="activity"){
      const map = {sedentary:"Sedentario", light:"Ligera", moderate:"Moderada", active:"Activa", very_active:"Muy activa"};
      val = map[val] || val;
    }
    if(c.fact==="conditions"){
      const m = {diabetes:"Diabetes", hypertension:"Hipertensión", anemia:"Anemia"};
      if(Array.isArray(c.value)) val = c.value.map(v=>m[v]||v).join(", ");
      else val = m[c.value] || c.value;
    }
    return `${fact} ${op} ${val}`;
  }).join(" • ");
}

function humanThen(then){
  const diag = (then?.diagnosis||[]).join(", ") || "—";
  const kcal = then?.diet?.kcal_target;
  let kcalTxt = "—";
  if(typeof kcal === "number") kcalTxt = `${kcal} kcal`;
  else if(kcal?.method==="mifflin_st_jeor" && kcal.deficit_pct) kcalTxt = `Mifflin (déficit ${Math.round(kcal.deficit_pct*100)}%)`;
  else if(kcal?.method==="mifflin_st_jeor" && kcal.surplus_pct) kcalTxt = `Mifflin (superávit ${Math.round(kcal.surplus_pct*100)}%)`;

  const ms = then?.diet?.macro_split;
  const macros = ms ? `C:${Math.round(ms.carb_pct*100)}% • P:${Math.round(ms.prot_pct*100)}% • G:${Math.round(ms.fat_pct*100)}%` : "—";
  return `Diagnóstico: ${diag} | Calorías: ${kcalTxt} | Macros: ${macros}`;
}

export default function RulesAdmin() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mode, setMode] = useState("list"); // list | create | edit
  const hasLoadedRef = useRef(false); // ✨ Usar ref en lugar de state

  async function load() {
    // ✨ Prevenir múltiples cargas
    if (hasLoadedRef.current || loading) return;
    
    hasLoadedRef.current = true;
    setLoading(true);
    try {
      const data = await apiGet("/rules");
      setRules(data.rules || []);
    } catch (e) {
      hasLoadedRef.current = false; // Permitir reintentar si falla
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  // ✨ Efecto simple sin dependencias que cause re-renders
  useEffect(() => { 
    load();
  }, []); // Solo ejecutar una vez al montar

  const onCreate = async (payload) => {
    try {
      await apiJson("POST", "/rules", payload);
      showSuccess(`✅ Regla "${payload.id}" creada exitosamente`);
      setMode("list");
      await load();
    } catch (e) { 
      showError(e);
    }
  };

  const onUpdate = async (payload) => {
    try {
      await apiJson("PUT", `/rules/${payload.id}`, payload);
      showSuccess(`✅ Regla "${payload.id}" actualizada exitosamente`);
      setMode("list"); 
      setEditing(null);
      await load();
    } catch (e) { 
      showError(e);
    }
  };

  const onDelete = async (id) => {
    try {
      showWarning(`⚠️ ¿Seguro que deseas eliminar la regla "${id}"?`);
      await apiDelete(`/rules/${id}`);
      showSuccess(`🗑️ Regla "${id}" eliminada`);
      await load();
    } catch (e) { 
      showError(e);
    }
  };

  return (
    <div className="grid gap-6">
      {mode === "list" && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-lg">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">📋 Gestión de Reglas</h2>
              <p className="text-sm text-slate-500 mt-1">
                {loading ? 'Cargando...' : `${rules.length} regla${rules.length !== 1 ? 's' : ''} en el sistema`}
              </p>
            </div>
            <button 
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 font-medium transition flex items-center gap-2"
              onClick={()=>setMode("create")}
            >
              <span className="text-xl">➕</span>
              <span>Nueva regla</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-slate-600">Cargando reglas...</div>
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay reglas definidas</h3>
              <p className="text-slate-500 mb-4">Comienza creando tu primera regla para el sistema experto</p>
              <button 
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 font-medium transition"
                onClick={()=>setMode("create")}
              >
                Crear primera regla
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {rules.map(r => (
                <div key={r.id} className="border-2 border-slate-200 rounded-2xl p-6 bg-white hover:border-slate-300 transition shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid gap-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-sm font-mono">
                          {r.id}
                        </div>
                        <div className="font-bold text-lg text-slate-800">{r.name}</div>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-medium">
                          Prioridad: {r.priority}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Si (Condiciones)</div>
                        <div className="text-sm text-slate-700">{humanWhen(r.when)}</div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="text-xs font-semibold text-green-700 uppercase mb-1">Entonces (Acciones)</div>
                        <div className="text-sm text-green-800">{humanThen(r.then)}</div>
                      </div>
                      
                      {r.then?.explain && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="text-xs font-semibold text-blue-700 uppercase mb-1">💡 Explicación</div>
                          <div className="text-sm text-blue-800">{r.then.explain}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button 
                        className="border-2 border-slate-300 hover:border-slate-900 hover:bg-slate-50 rounded-lg px-4 py-2 font-medium transition"
                        onClick={()=>{setEditing(r); setMode("edit");}}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="border-2 border-red-300 hover:border-red-600 hover:bg-red-50 text-red-600 rounded-lg px-4 py-2 font-medium transition"
                        onClick={()=>onDelete(r.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "create" && (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">➕ Crear nueva regla</h2>
          <RuleForm onCancel={()=>setMode("list")} onSave={onCreate} />
        </div>
      )}

      {mode === "edit" && editing && (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">✏️ Editar regla: {editing.id}</h2>
          <RuleForm value={editing} onCancel={()=>{setEditing(null); setMode("list");}} onSave={onUpdate} />
        </div>
      )}
    </div>
  );
}
