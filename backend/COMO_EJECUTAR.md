# 🚀 Cómo Ejecutar el Backend de NutriExpert

## Método Recomendado (Más Fácil)

### Opción 1: Con archivo BAT (Windows)
```cmd
cd d:\nutriExpert\backend
start.bat
```

### Opción 2: Con script PowerShell
```powershell
cd d:\nutriExpert\backend
.\start.ps1
```

Ambos scripts automáticamente:
- ✅ Detectan y activan el entorno virtual
- ✅ Verifican las dependencias
- ✅ Configuran el PYTHONPATH
- ✅ Inician el servidor

---

## Método Manual (Si los scripts no funcionan)

### 1. Activar el entorno virtual

**En PowerShell:**
```powershell
cd d:\nutriExpert
.\.venv\Scripts\Activate.ps1
```

**En CMD:**
```cmd
cd d:\nutriExpert
.venv\Scripts\activate.bat
```

Deberías ver `(.venv)` al inicio de tu prompt.

### 2. Ir al directorio backend
```bash
cd backend
```

### 3. Iniciar el servidor
```bash
python -m uvicorn main:app --reload --port 8000
```

---

## Verificar que está funcionando

Una vez iniciado, deberías ver:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
✅ Usuario nutricionista demo creado: pro@nutri.com / nutri123
✅ Reglas iniciales cargadas
INFO:     Application startup complete.
```

Abre en tu navegador:
- API: http://localhost:8000
- Documentación Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Solución de Problemas

### Error: "ModuleNotFoundError: No module named 'passlib'"

**Causa:** Las dependencias no están instaladas en tu entorno virtual.

**Solución:**
```powershell
# Activar entorno virtual
cd d:\nutriExpert
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r backend\requirements.txt
```

### Error: "Could not import module 'main'"

**Causa:** PYTHONPATH no está configurado correctamente.

**Solución:** Usa los scripts `start.bat` o `start.ps1` que configuran todo automáticamente.

### El servidor se cierra inmediatamente

**Causa:** Probablemente hay un error en el código o faltan variables de entorno.

**Solución:**
1. Verifica que existe `backend\.env`
2. Si no existe, copia `backend\.env.example` a `backend\.env`
3. Revisa los logs de error en la terminal

---

## Primera Vez (Instalación)

Si es la primera vez que ejecutas el proyecto:

```powershell
# 1. Ir al proyecto
cd d:\nutriExpert

# 2. Activar entorno virtual
.\.venv\Scripts\Activate.ps1

# 3. Instalar dependencias del backend
pip install -r backend\requirements.txt

# 4. Ejecutar el backend
cd backend
.\start.ps1
```

---

## Usuario Demo

Una vez iniciado el servidor, puedes usar estas credenciales:

- **Email:** `pro@nutri.com`
- **Password:** `nutri123`
- **Rol:** Nutricionista

---

## Detener el Servidor

Presiona `Ctrl + C` en la terminal donde está corriendo.

---

## Resumen Rápido

```powershell
# Inicio rápido (desde cualquier terminal)
cd d:\nutriExpert\backend
.\start.ps1

# O más simple:
cd d:\nutriExpert\backend
start.bat
```

¡Eso es todo! 🎉
