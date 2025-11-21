import { useEffect, useMemo, useState } from "react";

/** Opciones usadas en el panel */
const CONDITION_FACTS = [
  { value: "bmi", label: "IMC" },
  { value: "activity", label: "Nivel de actividad" },
  { value: "conditions", label: "Condiciones del paciente" },
];

const OPERATORS_NUM = [
  { value: ">=", label: "≥" },
  { value: ">", label: ">" },
  { value: "<=", label: "≤" },
  { value: "<", label: "<" },
  { value: "==", label: "Igual a" },
  { value: "!=", label: "Distinto de" },
];

const OPERATORS_SET = [
  { value: "contains", label: "Contiene" },
  { value: "in", label: "Está en lista" },
  { value: "not_in", label: "No está en lista" },
  { value: "==", label: "Igual a" },
  { value: "!=", label: "Distinto de" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentario" },
  { value: "light", label: "Ligera" },
  { value: "moderate", label: "Moderada" },
  { value: "active", label: "Activa" },
  { value: "very_active", label: "Muy activa" },
];

const CONDITION_OPTIONS = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hypertension", label: "Hipertensión" },
  { value: "anemia", label: "Anemia" },
];

const DEFAULT_RULE = {
  id: "",
  name: "",
  priority: 0,
  when: [],
  then: {
    diagnosis: [],
    diet: {
      kcal_target: null, // {method:'mifflin_st_jeor', deficit_pct/surplus_pct} o número
      macro_split: null, // {carb_pct, prot_pct, fat_pct} como 0–1
      restrictions: [],
      advice: [],
    },
    explain: "",
  },
};

function ConditionRow({ row, onChange, onRemove }) {
  const isFactNumeric = row.fact === "bmi";
  const isFactSet = row.fact === "conditions" || row.fact === "activity";

  const operatorOptions = isFactNumeric ? OPERATORS_NUM : OPERATORS_SET;

  return (
    <div className="grid grid-cols-12 gap-2 items-end">
      {/* Dato */}
      <div className="col-span-3">
        <label className="text-xs text-slate-500">Dato</label>
        <select
          className="border rounded p-2 w-full"
          value={row.fact}
          onChange={(e) => onChange({ ...row, fact: e.target.value, op: "", value: "" })}
        >
          <option value="">Selecciona…</option>
          {CONDITION_FACTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Operador */}
      <div className="col-span-2">
        <label className="text-xs text-slate-500">Operador</label>
        <select
          className="border rounded p-2 w-full"
          value={row.op}
          onChange={(e) => onChange({ ...row, op: e.target.value })}
          disabled={!row.fact}
        >
          <option value="">Selecciona…</option>
          {operatorOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Valor */}
      <div className="col-span-6">
        <label className="text-xs text-slate-500">Valor</label>
        {row.fact === "activity" ? (
          <select
            className="border rounded p-2 w-full"
            value={row.value || ""}
            onChange={(e) => onChange({ ...row, value: e.target.value })}
            disabled={!row.op}
          >
            <option value="">Selecciona…</option>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : row.fact === "conditions" ? (
          <div className="flex gap-2 flex-wrap">
            {CONDITION_OPTIONS.map((c) => {
              const selected = Array.isArray(row.value) ? row.value.includes(c.value) : row.value === c.value;
              const toggle = () => {
                // Soportamos contains (valor simple) o in/not_in (lista)
                if (row.op === "contains") {
                  onChange({ ...row, value: c.value });
                } else {
                  const arr = Array.isArray(row.value) ? [...row.value] : [];
                  const idx = arr.indexOf(c.value);
                  if (idx >= 0) arr.splice(idx, 1);
                  else arr.push(c.value);
                  onChange({ ...row, value: arr });
                }
              };
              return (
                <button
                  type="button"
                  key={c.value}
                  className={`px-3 py-1 rounded-full border ${selected ? "bg-slate-900 text-white" : "bg-white"}`}
                  onClick={toggle}
                  disabled={!row.op}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type="number"
            className="border rounded p-2 w-full"
            placeholder={row.fact === "bmi" ? "Ej: 30" : ""}
            value={row.value ?? ""}
            onChange={(e) => onChange({ ...row, value: e.target.value === "" ? "" : Number(e.target.value) })}
            disabled={!row.op}
          />
        )}
      </div>

      {/* Quitar */}
      <div className="col-span-1">
        <button type="button" className="border rounded px-2 py-2 w-full" onClick={onRemove}>✕</button>
      </div>
    </div>
  );
}

function percentToUnit(p) { return p === "" || p == null ? null : Number(p) / 100; }
function unitToPercent(u) { return u == null ? "" : Math.round(u * 100); }

export default function RuleForm({ value, onCancel, onSave }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(0);
  const [conditions, setConditions] = useState([]); // [{fact, op, value}]
  const [diagnosis, setDiagnosis] = useState([]);
  const [kcalMode, setKcalMode] = useState("none"); // none | fixed | mifflin_deficit | mifflin_surplus
  const [kcalFixed, setKcalFixed] = useState("");
  const [kcalPct, setKcalPct] = useState(15);
  const [macro, setMacro] = useState({ carb: "", prot: "", fat: "" }); // % visibles
  const [restrictions, setRestrictions] = useState([]);
  const [adviceText, setAdviceText] = useState("");
  const [explain, setExplain] = useState("");

  // Cargar valores si estamos editando
  useEffect(() => {
    if (!value) {
      // nueva
      return;
    }
    setId(value.id || "");
    setName(value.name || "");
    setPriority(value.priority ?? 0);
    setConditions(value.when || []);
    setDiagnosis(value.then?.diagnosis || []);
    // kcal
    const kcal = value.then?.diet?.kcal_target;
    if (typeof kcal === "number") {
      setKcalMode("fixed");
      setKcalFixed(kcal);
    } else if (kcal?.method === "mifflin_st_jeor" && kcal.deficit_pct) {
      setKcalMode("mifflin_deficit");
      setKcalPct(Math.round(Number(kcal.deficit_pct) * 100));
    } else if (kcal?.method === "mifflin_st_jeor" && kcal.surplus_pct) {
      setKcalMode("mifflin_surplus");
      setKcalPct(Math.round(Number(kcal.surplus_pct) * 100));
    } else {
      setKcalMode("none");
    }
    // macros
    const ms = value.then?.diet?.macro_split;
    setMacro({
      carb: unitToPercent(ms?.carb_pct),
      prot: unitToPercent(ms?.prot_pct),
      fat: unitToPercent(ms?.fat_pct),
    });
    setRestrictions(value.then?.diet?.restrictions || []);
    setAdviceText((value.then?.diet?.advice || []).join("\n"));
    setExplain(value.then?.explain || "");
  }, [value]);

  const canSave = useMemo(() => id && name && conditions.every(c => c.fact && c.op && (c.value !== "" && c.value != null)), [id, name, conditions]);

  const addCondition = () => setConditions((arr) => [...arr, { fact: "", op: "", value: "" }]);
  const updateCondition = (idx, newRow) => setConditions((arr) => arr.map((r, i) => (i === idx ? newRow : r)));
  const removeCondition = (idx) => setConditions((arr) => arr.filter((_, i) => i !== idx));

  // diagnosis chips (rápido y claro)
  const DIAG_OPTIONS = ["Bajo peso", "Eutrófico", "Sobrepeso", "Obesidad", "Riesgo/condición: Diabetes", "Riesgo/condición: Hipertensión", "Riesgo/condición: Anemia"];
  const toggleDiag = (d) =>
    setDiagnosis((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d]));

  const RESTRICTION_OPTIONS = ["bebidas_azucaradas", "ultraprocesados", "alto_sodio", "exceso_te_cafe_con_comidas", "alcohol"];
  const toggleRestriction = (r) =>
    setRestrictions((v) => (v.includes(r) ? v.filter((x) => x !== r) : [...v, r]));

  const submit = (e) => {
    e.preventDefault();
    if (!canSave) {
      alert("Completa ID, nombre y todas las condiciones.");
      return;
    }

    let kcal_target = null;
    if (kcalMode === "fixed" && kcalFixed) {
      kcal_target = Number(kcalFixed);
    } else if (kcalMode === "mifflin_deficit") {
      kcal_target = { method: "mifflin_st_jeor", deficit_pct: Number(kcalPct) / 100 };
    } else if (kcalMode === "mifflin_surplus") {
      kcal_target = { method: "mifflin_st_jeor", surplus_pct: Number(kcalPct) / 100 };
    }

    let macro_split = null;
    const carb = macro.carb === "" ? null : Number(macro.carb);
    const prot = macro.prot === "" ? null : Number(macro.prot);
    const fat = macro.fat === "" ? null : Number(macro.fat);
    if (carb != null || prot != null || fat != null) {
      const sum = (carb || 0) + (prot || 0) + (fat || 0);
      if (sum !== 100) {
        if (!confirm(`Los macronutrientes suman ${sum}%. ¿Guardar de todas formas?`)) return;
      }
      macro_split = {
        carb_pct: percentToUnit(carb ?? 0),
        prot_pct: percentToUnit(prot ?? 0),
        fat_pct: percentToUnit(fat ?? 0),
      };
    }

    const payload = {
      id,
      name,
      priority: Number(priority) || 0,
      when: conditions,
      then: {
        diagnosis: diagnosis,
        diet: {
          kcal_target,
          macro_split,
          restrictions,
          advice: adviceText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        explain,
      },
    };

    onSave(payload);
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      {/* Identidad */}
      <div className="grid grid-cols-3 gap-3">
        <label className="text-sm flex flex-col">ID
          <input className="border rounded p-2" value={id} onChange={(e)=>setId(e.target.value)} required/>
        </label>
        <label className="text-sm flex flex-col">Nombre
          <input className="border rounded p-2" value={name} onChange={(e)=>setName(e.target.value)} required/>
        </label>
        <label className="text-sm flex flex-col">Prioridad
          <input type="number" className="border rounded p-2" value={priority} onChange={(e)=>setPriority(e.target.value)}/>
        </label>
      </div>

      {/* Condiciones */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Si se cumple… (Condiciones)</div>
          <button type="button" className="border rounded px-3 py-1" onClick={addCondition}>+ Añadir condición</button>
        </div>
        {conditions.length === 0 && <div className="text-xs text-slate-500">Aún no hay condiciones.</div>}
        <div className="grid gap-2">
          {conditions.map((c, idx) => (
            <ConditionRow
              key={idx}
              row={c}
              onChange={(nr) => updateCondition(idx, nr)}
              onRemove={() => removeCondition(idx)}
            />
          ))}
        </div>
      </div>

      {/* Diagnóstico */}
      <div>
        <div className="text-sm font-medium mb-1">Diagnóstico</div>
        <div className="flex flex-wrap gap-2">
          {DIAG_OPTIONS.map((d) => (
            <button
              type="button"
              key={d}
              className={`px-3 py-1 rounded-full border ${diagnosis.includes(d) ? "bg-slate-900 text-white" : "bg-white"}`}
              onClick={() => toggleDiag(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Objetivo calórico */}
      <div className="grid gap-2">
        <div className="text-sm font-medium">Calorías objetivo</div>
        <div className="grid grid-cols-3 gap-3">
          <label className="border rounded p-3 flex gap-2 items-center">
            <input type="radio" name="kcal" checked={kcalMode==="none"} onChange={()=>setKcalMode("none")}/>
            <span>Sin objetivo</span>
          </label>
          <label className="border rounded p-3 flex gap-2 items-center">
            <input type="radio" name="kcal" checked={kcalMode==="fixed"} onChange={()=>setKcalMode("fixed")}/>
            <span>Fijo (kcal)</span>
            <input type="number" className="border rounded p-2 ml-2 w-28" value={kcalFixed} onChange={e=>setKcalFixed(e.target.value)} disabled={kcalMode!=="fixed"}/>
          </label>
          <label className="border rounded p-3 flex gap-2 items-center">
            <input type="radio" name="kcal" checked={kcalMode==="mifflin_deficit"} onChange={()=>setKcalMode("mifflin_deficit")}/>
            <span>Mifflin (déficit %)</span>
            <input type="number" className="border rounded p-2 ml-2 w-20" value={kcalPct} onChange={e=>setKcalPct(e.target.value)} disabled={kcalMode!=="mifflin_deficit"}/>
          </label>
          <label className="border rounded p-3 flex gap-2 items-center col-span-3 sm:col-span-1">
            <input type="radio" name="kcal" checked={kcalMode==="mifflin_surplus"} onChange={()=>setKcalMode("mifflin_surplus")}/>
            <span>Mifflin (superávit %)</span>
            <input type="number" className="border rounded p-2 ml-2 w-20" value={kcalPct} onChange={e=>setKcalPct(e.target.value)} disabled={kcalMode!=="mifflin_surplus"}/>
          </label>
        </div>
      </div>

      {/* Macros */}
      <div className="grid gap-2">
        <div className="text-sm font-medium">Macronutrientes (porcentaje %)</div>
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm flex flex-col">Carbohidratos (%)
            <input type="number" className="border rounded p-2" value={macro.carb} onChange={(e)=>setMacro({...macro, carb: e.target.value})}/>
          </label>
          <label className="text-sm flex flex-col">Proteínas (%)
            <input type="number" className="border rounded p-2" value={macro.prot} onChange={(e)=>setMacro({...macro, prot: e.target.value})}/>
          </label>
          <label className="text-sm flex flex-col">Grasas (%)
            <input type="number" className="border rounded p-2" value={macro.fat} onChange={(e)=>setMacro({...macro, fat: e.target.value})}/>
          </label>
        </div>
      </div>

      {/* Restricciones */}
      <div className="grid gap-2">
        <div className="text-sm font-medium">Restricciones</div>
        <div className="flex flex-wrap gap-2">
          {RESTRICTION_OPTIONS.map((r) => (
            <label key={r} className="border rounded px-3 py-1 flex items-center gap-2">
              <input type="checkbox" checked={restrictions.includes(r)} onChange={()=>toggleRestriction(r)}/>
              <span>{r.replaceAll("_"," ")}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Consejos */}
      <div>
        <div className="text-sm font-medium mb-1">Consejos (uno por línea)</div>
        <textarea rows={4} className="border rounded p-2 w-full" value={adviceText} onChange={(e)=>setAdviceText(e.target.value)} placeholder="Ej: Priorizar verduras y proteínas magras.&#10;Evitar bebidas azucaradas."/>
      </div>

      {/* Explicación */}
      <div>
        <div className="text-sm font-medium mb-1">Explicación para el paciente (por qué se aplicó esta regla)</div>
        <input className="border rounded p-2 w-full" value={explain} onChange={(e)=>setExplain(e.target.value)} placeholder="Ej: IMC ≥ 30 indica obesidad."/>
      </div>

      <div className="flex gap-2">
        <button className="bg-slate-900 text-white rounded px-4 py-2" type="submit" disabled={!canSave}>Guardar</button>
        <button className="border rounded px-4 py-2" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
