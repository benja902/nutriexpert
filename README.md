# 🥗 NutriExpert - Sistema Experto de Nutrición

Sistema experto para diagnóstico nutricional y recomendaciones dietéticas personalizadas, desarrollado con FastAPI y React.

## 📋 Características

- 🔐 **Autenticación segura** con JWT
- 🩺 **Motor de inferencia** basado en reglas
- 📊 **Diagnóstico nutricional** automatizado
- 🍽️ **Planes dietéticos personalizados** según:
  - IMC y composición corporal
  - Nivel de actividad física
  - Condiciones preexistentes (diabetes, hipertensión, anemia)
- 📋 **Gestión de reglas** CRUD completo
- 🎨 **Interfaz moderna** con React + TailwindCSS
- 🔔 **Sistema de notificaciones** con mensajes en español

## 🛠️ Tecnologías

### Backend
- **FastAPI** 0.121.0 - Framework web moderno
- **Python** 3.13+
- **SQLite** - Base de datos
- **JWT** - Autenticación (python-jose)
- **Passlib** - Hash de contraseñas (pbkdf2_sha256)
- **Pydantic** - Validación de datos

### Frontend
- **React** 19.1.1
- **Vite** 7.1.9 - Build tool
- **TailwindCSS** 4.1.14 - Estilos
- **React Router** 7.9.4 - Navegación
- **react-hot-toast** - Notificaciones

## 📦 Instalación

### Prerrequisitos
- **Python 3.13+** ([Descargar](https://www.python.org/downloads/))
- **Node.js 18+** ([Descargar](https://nodejs.org/))
- **Git** ([Descargar](https://git-scm.com/))

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/nutriexpert.git
cd nutriexpert
```

### 2️⃣ Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# En Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# En Windows CMD:
.venv\Scripts\activate.bat
# En Linux/Mac:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env y cambiar JWT_SECRET_KEY por una clave segura
```

**Generar JWT_SECRET_KEY segura:**
```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Linux/Mac
openssl rand -hex 32
```

### 3️⃣ Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install
```

## 🚀 Ejecución

### Opción 1: Scripts automatizados (Recomendado)

**Backend:**
```bash
cd backend
# Windows PowerShell:
.\start.ps1
# Windows CMD:
start.bat
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Opción 2: Manual

**Backend:**
```bash
cd backend
.\.venv\Scripts\Activate.ps1  # Activar venv
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 🌐 Acceso

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Documentación API:** http://localhost:8000/docs

## 👤 Usuario Demo

```
Email: demo@demo.com
Password: demodemo
Rol: admin
```

## 📁 Estructura del Proyecto

```
nutriexpert/
├── backend/
│   ├── main.py              # Aplicación FastAPI principal
│   ├── requirements.txt     # Dependencias Python
│   ├── .env.example         # Plantilla de configuración
│   ├── start.ps1            # Script de inicio Windows
│   ├── start.bat            # Script de inicio CMD
│   └── rules.db             # Base de datos SQLite
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Páginas (Login, Register, Dashboard)
│   │   ├── components/      # Componentes (PatientDiag, RulesAdmin)
│   │   ├── utils/           # Utilidades (notifications, api)
│   │   └── main.jsx         # Punto de entrada
│   ├── package.json         # Dependencias Node
│   └── vite.config.js       # Configuración Vite
│
├── .gitignore              # Archivos a ignorar en Git
└── README.md               # Este archivo
```

## 🔐 Seguridad Implementada

- ✅ **JWT tokens** con expiración (8 horas)
- ✅ **Hash de contraseñas** con pbkdf2_sha256 (29,000 iteraciones)
- ✅ **Variables de entorno** para secretos
- ✅ **Validación de datos** con Pydantic
- ✅ **CORS** configurado para orígenes permitidos
- ✅ **Protección de rutas** con dependencias de autenticación

## 🧪 Reglas del Sistema Experto

El sistema incluye reglas predefinidas para:
- Diagnóstico de bajo peso, sobrepeso y obesidad
- Recomendaciones para diabetes
- Ajustes para hipertensión
- Planes para desarrollo muscular
- Manejo de anemia

### Ejemplo de Regla:

```json
{
  "id": "R001",
  "name": "Bajo peso significativo",
  "priority": 10,
  "when": [
    {"fact": "bmi", "op": "<", "value": 18.5}
  ],
  "then": {
    "diagnosis": ["Bajo peso"],
    "diet": {
      "kcal_target": {"method": "mifflin_st_jeor", "surplus_pct": 0.15},
      "macro_split": {"carb_pct": 0.50, "prot_pct": 0.25, "fat_pct": 0.25}
    },
    "explain": "IMC < 18.5: aumentar calorías +15% con macros equilibrados"
  }
}
```

## 📊 API Endpoints

### Autenticación
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Inicio de sesión
- `GET /auth/me` - Información del usuario actual

### Inferencia
- `POST /infer` - Generar diagnóstico y plan nutricional

### Reglas (requiere autenticación)
- `GET /rules` - Listar todas las reglas
- `POST /rules` - Crear nueva regla
- `GET /rules/{id}` - Obtener regla específica
- `PUT /rules/{id}` - Actualizar regla
- `DELETE /rules/{id}` - Eliminar regla

## 🐛 Solución de Problemas

### Backend no inicia
```bash
# Verificar que el entorno virtual esté activado
# Verificar instalación de dependencias
pip list

# Reinstalar si es necesario
pip install -r requirements.txt --force-reinstall
```

### Error de importación en backend
```bash
# Asegurarse de que PYTHONPATH esté configurado
# El script start.ps1 lo hace automáticamente
```

### Puerto 5173 en uso
```bash
# Vite automáticamente usará el siguiente puerto disponible (5174, etc.)
```

### Error de CORS
- Verificar que el frontend esté corriendo en un puerto permitido
- Los puertos permitidos están en `backend/main.py` (origins variable)

## 📝 Variables de Entorno

### Backend (.env)
```bash
JWT_SECRET_KEY=tu-clave-secreta-aqui
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480
DATABASE_URL=sqlite:///./rules.db
ENVIRONMENT=development
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu-email@ejemplo.com

## 🙏 Agradecimientos

- FastAPI por el excelente framework
- React por la librería UI
- TailwindCSS por los estilos
- La comunidad open source

---

⭐ Si te gustó este proyecto, dale una estrella en GitHub!
