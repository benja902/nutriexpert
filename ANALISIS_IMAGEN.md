# 📸 Análisis Nutricional por Imagen

## Descripción

Nueva funcionalidad que permite a los usuarios subir imágenes de sus comidas y obtener un análisis nutricional detallado usando inteligencia artificial (Gemini AI).

## Características

### 🎨 Interfaz
- **Diseño moderno y saludable** con colores verdes (emerald/teal) que transmiten salud y frescura
- **Carga de imágenes drag & drop** o click para seleccionar
- **Vista previa instantánea** de la imagen cargada
- **Validación de archivos**: Solo imágenes (PNG, JPG, WEBP) menores a 5MB
- **Responsive**: Se adapta a dispositivos móviles y desktop

### 🤖 Análisis con IA
- Utiliza **Gemini 2.5 Flash** para análisis rápido y preciso
- Proporciona:
  - ✅ Identificación de alimentos presentes
  - ✅ Calorías totales estimadas
  - ✅ Desglose de macronutrientes (proteínas, carbohidratos, grasas)
  - ✅ Micronutrientes destacables (vitaminas, minerales)
  - ✅ Consideraciones de salud
  - ✅ Recomendaciones nutricionales personalizadas

### 🔒 Seguridad
- **Autenticación requerida**: Solo usuarios logueados pueden usar la función
- **Procesamiento seguro**: Las imágenes no se almacenan en el servidor
- **Validación de tokens JWT** para todas las peticiones

## Cómo Usar

### Para Usuarios

1. **Inicia sesión** en el sistema
2. Ve a la pestaña **"📸 Análisis por Imagen"**
3. **Sube una foto** de tu comida:
   - Haz clic en el área de carga
   - O arrastra y suelta la imagen
4. Haz clic en **"Analizar Imagen"**
5. Espera unos segundos mientras la IA procesa tu imagen
6. ¡Listo! Verás el análisis completo

### Consejos para Mejores Resultados

- 📷 Usa imágenes **claras y bien iluminadas**
- 🍽️ Captura el **plato completo desde arriba**
- 🌟 Evita **sombras o reflejos** que oculten los alimentos
- 📏 Incluye elementos de referencia para mejor estimación de porciones

## Implementación Técnica

### Backend (FastAPI)

**Archivo**: `backend/main.py`

```python
@app.post("/analyze-image")
async def analyze_image(request: ImageAnalysisRequest, user: dict = Depends(get_current_user)):
    """Analiza una imagen de comida y retorna información nutricional detallada"""
    # 1. Valida autenticación
    # 2. Decodifica imagen base64
    # 3. Usa Gemini AI para análisis
    # 4. Retorna resultado estructurado
```

**Dependencias añadidas**:
- `google-generativeai`: Cliente para Gemini AI
- `Pillow`: Procesamiento de imágenes
- `requests`: HTTP requests (ya incluido)

### Frontend (React)

**Archivo**: `frontend/src/pages/ImageAnalysis.jsx`

**Componentes principales**:
1. **Upload Section**: Área de carga con preview
2. **Results Section**: Muestra el análisis formateado
3. **Tips Section**: Consejos para mejores resultados
4. **Info Cards**: Información sobre el servicio

**Características visuales**:
- Gradientes verdes saludables (emerald-500 a teal-500)
- Iconos SVG personalizados
- Animaciones suaves (loading spinner)
- Diseño en grid responsive
- Scroll suave en resultados largos

### Integración

**Ruta**: `/analyze-image` (POST)

**Headers necesarios**:
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "prompt": "Analiza el plato en esta imagen..."
}
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "analysis": "**Análisis Nutricional**\n\n1. Alimentos identificados: ...",
  "user": "usuario@email.com"
}
```

## Configuración

### Variables de Entorno

El API key de Gemini está hardcoded en `main.py`:
```python
GEMINI_API_KEY = "AIzaSyB9mu55iCvCwRyc8LJX9_FvQ8Jac0afsNE"
```

**⚠️ RECOMENDACIÓN**: Mover a `.env` en producción:
```env
GEMINI_API_KEY=tu_api_key_aqui
```

### Instalación de Dependencias

```bash
# Backend
cd backend
pip install -r requirements.txt

# O instalar manualmente:
pip install google-generativeai Pillow requests
```

```bash
# Frontend (no requiere nuevas dependencias)
cd frontend
npm install
```

## Limitaciones Conocidas

1. **Estimaciones aproximadas**: Los valores nutricionales son aproximados
2. **Dependencia de IA**: Requiere conexión a internet y API key válido
3. **Tamaño de imagen**: Máximo 5MB por imagen
4. **Rate limits**: Sujeto a límites de la API de Gemini

## Próximas Mejoras

- [ ] Guardar historial de análisis
- [ ] Comparar múltiples comidas
- [ ] Integración con planes nutricionales
- [ ] Reconocimiento de porciones más preciso
- [ ] Sugerencias de recetas similares más saludables
- [ ] Exportar análisis a PDF

## Soporte

Para problemas o sugerencias, contacta al equipo de desarrollo.

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0.0
