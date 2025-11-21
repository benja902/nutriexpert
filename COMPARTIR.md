# 📦 GUÍA DE COMPARTICIÓN - NutriExpert

## ✅ Archivos QUE DEBES COMPARTIR

### 📁 Backend
```
backend/
├── main.py                ✅ Código principal
├── requirements.txt       ✅ Dependencias Python
├── .env.example          ✅ Plantilla de configuración
├── start.ps1             ✅ Script de inicio PowerShell
├── start.bat             ✅ Script de inicio CMD
├── README.md             ✅ Documentación backend
├── COMO_EJECUTAR.md      ✅ Instrucciones de ejecución
└── .gitignore            ✅ Reglas de exclusión
```

### 📁 Frontend
```
frontend/
├── src/                  ✅ Todo el código fuente
│   ├── pages/
│   ├── components/
│   ├── utils/
│   ├── assets/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── auth.js
├── public/               ✅ Recursos públicos
├── index.html            ✅ HTML principal
├── package.json          ✅ Dependencias y scripts
├── vite.config.js        ✅ Configuración Vite
├── tailwind.config.js    ✅ Configuración TailwindCSS
├── postcss.config.js     ✅ Configuración PostCSS
├── eslint.config.js      ✅ Configuración ESLint
├── README.md             ✅ Documentación frontend
└── .gitignore            ✅ Reglas de exclusión
```

### 📄 Raíz del proyecto
```
nutriexpert/
├── README.md             ✅ Documentación principal
├── .gitignore            ✅ Reglas de exclusión global
├── COMPARTIR.md          ✅ Esta guía
└── LICENSE               ✅ Licencia (opcional)
```

---

## ❌ Archivos QUE NO DEBES COMPARTIR

### 🔒 Secretos y Configuración Personal
```
❌ backend/.env                    # NUNCA compartir (tiene JWT_SECRET_KEY)
❌ backend/*.db                     # Base de datos con datos reales
❌ backend/*.sqlite
❌ backend/*.sqlite3
```

### 📦 Dependencias (se instalan automáticamente)
```
❌ .venv/                          # Entorno virtual Python (muy pesado)
❌ venv/
❌ ENV/
❌ env/
❌ node_modules/                   # Módulos Node (muy pesado, +200MB)
❌ package-lock.json               # Generado automáticamente
```

### 🗑️ Cache y Archivos Temporales
```
❌ __pycache__/                    # Cache de Python
❌ *.pyc
❌ *.pyo
❌ *.py[cod]
❌ dist/                           # Build de producción
❌ build/
❌ *.log                           # Logs
❌ .DS_Store                       # macOS
❌ Thumbs.db                       # Windows
```

### 🛠️ Configuración de IDEs
```
❌ .vscode/                        # Configuración VS Code personal
❌ .idea/                          # IntelliJ/PyCharm
❌ *.swp                           # Vim
```

### 🧪 Archivos de Prueba
```
❌ backend/test-login.html         # Pruebas locales
❌ backend/a.py                    # Scripts temporales
```

---

## 📋 CHECKLIST ANTES DE COMPARTIR

### 1️⃣ Crear .gitignore (✅ Ya creado)
```bash
# Ya tienes el archivo en la raíz del proyecto
```

### 2️⃣ Verificar que .env está excluido
```bash
# En backend/.gitignore y .gitignore raíz
.env
*.env
!.env.example
```

### 3️⃣ Crear .env.example (✅ Ya existe)
```bash
# Copiar .env sin los valores reales
cp backend/.env backend/.env.example
# Editar y reemplazar valores por placeholders
```

### 4️⃣ Limpiar archivos temporales
```bash
# Desde la raíz del proyecto
Remove-Item -Recurse -Force .venv        # Entorno virtual
Remove-Item -Recurse -Force node_modules # Node modules
Remove-Item -Recurse -Force __pycache__  # Cache Python
Remove-Item backend/*.db                 # Bases de datos
Remove-Item backend/test-login.html      # Archivos de prueba
```

### 5️⃣ Crear README.md completo (✅ Ya creado)
```bash
# Documentación en la raíz con:
# - Instalación
# - Configuración
# - Ejecución
# - Estructura
```

### 6️⃣ Probar instalación limpia
```bash
# Simular instalación desde cero en otra carpeta
# Para verificar que no falta ningún archivo
```

---

## 🌐 OPCIONES PARA COMPARTIR

### 📊 Opción 1: GitHub (Recomendado)

```bash
# Inicializar repositorio
git init

# Agregar archivos (respetando .gitignore)
git add .

# Crear commit inicial
git commit -m "Initial commit: NutriExpert Sistema Experto"

# Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/nutriexpert.git

# Subir código
git branch -M main
git push -u origin main
```

**Ventajas:**
✅ Control de versiones
✅ Colaboración fácil
✅ Issues y Pull Requests
✅ GitHub Actions para CI/CD
✅ Visibilidad pública o privada

### 📦 Opción 2: Archivo ZIP

```powershell
# Desde PowerShell en la raíz del proyecto
# Excluir carpetas pesadas

$exclude = @('.venv', 'node_modules', '__pycache__', '*.db', '.env')
$source = "d:\nutriExpert"
$destination = "d:\nutriExpert-v1.0.0.zip"

# Crear ZIP sin archivos excluidos
Compress-Archive -Path $source\* -DestinationPath $destination -CompressionLevel Optimal
```

**Ventajas:**
✅ Fácil de compartir
✅ No requiere Git
✅ Portable

**Desventajas:**
❌ Sin control de versiones
❌ Difícil de actualizar

### 🔗 Opción 3: GitLab/Bitbucket

Similar a GitHub, pero en otras plataformas.

---

## 📏 TAMAÑO ESTIMADO

### Con archivos correctos (limpio):
```
📦 ~2-5 MB
├── Código fuente: ~500 KB
├── Documentación: ~50 KB
└── Configuración: ~10 KB
```

### Con archivos incorrectos (sucio):
```
📦 ~500+ MB ❌
├── .venv/: ~200 MB
├── node_modules/: ~300 MB
└── __pycache__/: ~10 MB
```

---

## 🔍 VERIFICAR ANTES DE COMPARTIR

### Comando para verificar estructura:
```powershell
# Ver todos los archivos (sin excluidos)
Get-ChildItem -Recurse -Force | 
  Where-Object { $_.FullName -notmatch 'node_modules|\.venv|__pycache__|\.git' } |
  Select-Object FullName
```

### Verificar que .env NO esté incluido:
```powershell
# Buscar archivos .env
Get-ChildItem -Recurse -Force -Filter ".env" | 
  Where-Object { $_.Name -eq ".env" }

# NO debe encontrar nada (solo .env.example está bien)
```

---

## 📝 INSTRUCCIONES PARA LOS USUARIOS

Incluye esto en tu README.md (✅ ya está incluido):

```markdown
## 📦 Instalación

### 1. Clonar/Descargar el proyecto
### 2. Instalar Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
# Editar .env con valores reales

### 3. Instalar Frontend
cd ../frontend
npm install

### 4. Ejecutar
# Terminal 1 - Backend
cd backend
.\start.ps1

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## ⚠️ IMPORTANTE

### 🚨 NUNCA compartas:
1. ❌ `.env` con JWT_SECRET_KEY real
2. ❌ Bases de datos con datos de usuarios
3. ❌ Contraseñas o tokens reales
4. ❌ Carpetas node_modules o .venv

### ✅ SIEMPRE incluye:
1. ✅ `.env.example` con placeholders
2. ✅ `README.md` con instrucciones completas
3. ✅ `requirements.txt` y `package.json`
4. ✅ `.gitignore` configurado correctamente

---

## 🎯 RESUMEN EJECUTIVO

**Compartir:**
- Todo el código fuente (.py, .jsx, .js)
- Archivos de configuración (.example, .config.js)
- Documentación (.md)
- Scripts de inicio (.ps1, .bat)

**NO compartir:**
- Secretos (.env)
- Dependencias (node_modules, .venv)
- Cache (__pycache__)
- Bases de datos con datos reales
- Configuración personal de IDEs

**Tamaño esperado:** ~2-5 MB
**Plataforma recomendada:** GitHub
