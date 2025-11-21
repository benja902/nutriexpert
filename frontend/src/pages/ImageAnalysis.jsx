import { useState, useRef } from 'react';
import { API } from '../api';
import { getAuthToken } from '../auth';

export default function ImageAnalysis() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy grande. Por favor selecciona una imagen menor a 5MB');
      return;
    }

    setError(null);
    setSelectedImage(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !imagePreview) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No estás autenticado. Por favor inicia sesión.');
      }

      const response = await fetch(`${API}/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image_base64: imagePreview,
          prompt: `Analiza esta imagen de comida y proporciona la información EXACTAMENTE en este formato estructurado:

ALIMENTOS IDENTIFICADOS:
- [Nombre del alimento 1] ([porción en gramos]g)
- [Nombre del alimento 2] ([porción en gramos]g)
- [Nombre del alimento 3] ([porción en gramos]g)

TOTALES:
Calorías: [número] kcal
Proteínas: [número]g ([porcentaje]%)
Carbohidratos: [número]g ([porcentaje]%)
Grasas: [número]g ([porcentaje]%)

DESGLOSE POR ALIMENTO:
1. [Nombre alimento 1]
   - Porción: [número]g
   - Calorías: [número] kcal
   - Proteínas: [número]g
   - Carbohidratos: [número]g
   - Grasas: [número]g

2. [Nombre alimento 2]
   - Porción: [número]g
   - Calorías: [número] kcal
   - Proteínas: [número]g
   - Carbohidratos: [número]g
   - Grasas: [número]g

Proporciona SOLO números y datos, sin explicaciones adicionales. Se preciso y conciso.`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al analizar la imagen');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'No se pudo analizar la imagen. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseNutritionalData = (text) => {
    const data = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      foods: []
    };

    // Extraer totales de forma simple - IMPORTANTE: capturar números con decimales
    const calMatch = text.match(/Calor[íi]as?[:\s]+(\d+(?:\.\d+)?)/i);
    if (calMatch) data.totalCalories = parseFloat(calMatch[1]);

    const protMatch = text.match(/Prote[íi]nas?[:\s]+(\d+(?:\.\d+)?)\s*g/i);
    if (protMatch) data.totalProtein = parseFloat(protMatch[1]);

    const carbMatch = text.match(/Carbohidratos?[:\s]+(\d+(?:\.\d+)?)\s*g/i);
    if (carbMatch) data.totalCarbs = parseFloat(carbMatch[1]);

    const fatMatch = text.match(/Grasas?[:\s]+(\d+(?:\.\d+)?)\s*g/i);
    if (fatMatch) data.totalFat = parseFloat(fatMatch[1]);

    // Extraer alimentos línea por línea
    const lines = text.split('\n');
    let currentFood = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Nuevo alimento (comienza con número.)
      const foodStart = line.match(/^(\d+)\.\s*(.+)$/);
      if (foodStart) {
        if (currentFood) data.foods.push(currentFood);
        currentFood = {
          name: foodStart[2].trim(),
          serving: 0,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        };
      } else if (currentFood) {
        // Extraer valores del alimento actual - IMPORTANTE: capturar decimales
        if (line.includes('Porción') || line.includes('Porcion')) {
          const match = line.match(/(\d+(?:\.\d+)?)\s*g/);
          if (match) currentFood.serving = parseFloat(match[1]);
        }
        if (line.includes('Calorías') || line.includes('Calorias')) {
          const match = line.match(/(\d+(?:\.\d+)?)/);
          if (match) currentFood.calories = parseFloat(match[1]);
        }
        if (line.includes('Proteínas') || line.includes('Proteinas')) {
          const match = line.match(/(\d+(?:\.\d+)?)\s*g/);
          if (match) currentFood.protein = parseFloat(match[1]);
        }
        if (line.includes('Carbohidratos')) {
          const match = line.match(/(\d+(?:\.\d+)?)\s*g/);
          if (match) currentFood.carbs = parseFloat(match[1]);
        }
        if (line.includes('Grasas')) {
          const match = line.match(/(\d+(?:\.\d+)?)\s*g/);
          if (match) currentFood.fat = parseFloat(match[1]);
        }
      }
    }
    
    if (currentFood) data.foods.push(currentFood);

    // Si no hay totales pero hay alimentos, calcular
    if (data.totalCalories === 0 && data.foods.length > 0) {
      data.totalCalories = Math.round(data.foods.reduce((sum, food) => sum + food.calories, 0));
      data.totalProtein = Math.round(data.foods.reduce((sum, food) => sum + food.protein, 0) * 10) / 10;
      data.totalCarbs = Math.round(data.foods.reduce((sum, food) => sum + food.carbs, 0) * 10) / 10;
      data.totalFat = Math.round(data.foods.reduce((sum, food) => sum + food.fat, 0) * 10) / 10;
    }

    return data;
  };

  const formatAnalysis = (text) => {
    const data = parseNutritionalData(text);
    const maxMacro = Math.max(data.totalProtein, data.totalCarbs, data.totalFat) || 100;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Nutrition Analysis Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Análisis Nutricional</h2>
          
          {/* Total Calories Badge */}
          <div className="inline-flex items-center bg-gray-50 rounded-full px-5 py-2 mb-6">
            <span className="text-2xl font-bold text-gray-900">{data.totalCalories || '---'}</span>
            <span className="text-sm text-gray-600 ml-2">calorías totales</span>
          </div>

          {/* Macro Rows */}
          <div className="space-y-3 mb-6">
            {/* Protein */}
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-700 font-medium">Proteínas</span>
              </div>
              <span className="text-gray-900 font-semibold">{data.totalProtein}g</span>
            </div>

            {/* Carbs */}
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-700 rounded-full"></div>
                <span className="text-gray-700 font-medium">Carbohidratos</span>
              </div>
              <span className="text-gray-900 font-semibold">{data.totalCarbs}g</span>
            </div>

            {/* Fat */}
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                <span className="text-gray-700 font-medium">Grasas</span>
              </div>
              <span className="text-gray-900 font-semibold">{data.totalFat}g</span>
            </div>
          </div>

          {/* Distribution Bars */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-500">Proteínas</div>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(data.totalProtein / maxMacro) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-xs text-gray-600 text-right">{data.totalProtein}g</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-500">Carbohidratos</div>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-emerald-700 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(data.totalCarbs / maxMacro) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-xs text-gray-600 text-right">{data.totalCarbs}g</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-500">Grasas</div>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(data.totalFat / maxMacro) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-xs text-gray-600 text-right">{data.totalFat}g</div>
            </div>
          </div>
        </div>

        {/* Food Breakdown */}
        {data.foods.length > 0 && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Desglose de Alimentos
            </h2>

            <div className="space-y-4">
              {data.foods.map((food, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  {/* Food Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{food.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{food.serving}g porción</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{food.calories}</div>
                      <div className="text-xs text-gray-500">calorías</div>
                    </div>
                  </div>

                  {/* Nutrient Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-500 mb-1">Proteínas</div>
                      <div className="text-lg font-semibold text-emerald-600">{food.protein}g</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-500 mb-1">Carbohidratos</div>
                      <div className="text-lg font-semibold text-emerald-700">{food.carbs}g</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-500 mb-1">Grasas</div>
                      <div className="text-lg font-semibold text-amber-500">{food.fat}g</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <h1 className="text-3xl font-bold">Análisis Nutricional por Imagen</h1>
            <p className="text-emerald-50 mt-1">Sube una foto de tu comida y obtén información nutricional detallada al instante</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Sube tu imagen
          </h2>

          <div className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="imageInput"
            />
            <label htmlFor="imageInput" className="cursor-pointer">
              {!imagePreview ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <svg className="w-16 h-16 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    Haz clic para seleccionar una imagen
                  </p>
                  <p className="text-sm text-gray-400">
                    PNG, JPG, WEBP (Max. 5MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-emerald-600 font-medium">
                    ✓ Imagen cargada correctamente
                  </p>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || loading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-6 py-3 font-medium hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analizando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Analizar Imagen
                </>
              )}
            </button>

            {(selectedImage || analysis) && (
              <button
                onClick={handleReset}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Tips */}
          <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Consejos para mejores resultados
            </h3>
            <ul className="text-sm text-emerald-700 space-y-1 ml-7">
              <li>• Asegúrate de que la imagen sea clara y bien iluminada</li>
              <li>• Captura el plato completo desde arriba</li>
              <li>• Evita sombras o reflejos que oculten los alimentos</li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Análisis Nutricional
          </h2>

          <div className="min-h-[400px]">
            {!analysis && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg">
                  Sube una imagen y haz clic en "Analizar"
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  El análisis nutricional aparecerá aquí
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="relative">
                  <svg className="animate-spin h-16 w-16 text-emerald-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-emerald-600 font-medium mt-4">Analizando tu imagen...</p>
                <p className="text-gray-500 text-sm mt-2">Esto puede tomar unos segundos</p>
              </div>
            )}

            {analysis && formatAnalysis(analysis)}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Información Importante
        </h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📊 Estimaciones</h3>
            <p className="text-blue-700">Los valores nutricionales son aproximados y pueden variar según las porciones y preparación.</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">🤖 IA Avanzada</h3>
            <p className="text-amber-700">Utilizamos Gemini AI para analizar tus imágenes con precisión.</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">🔒 Privacidad</h3>
            <p className="text-purple-700">Tus imágenes son procesadas de forma segura y no se almacenan.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
