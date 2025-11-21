# NutriExpert Backend - Sistema Experto de Nutrición

## 🔐 Mejoras de Seguridad Implementadas

### ✅ Cambios Realizados

1. **Autenticación Profesional**
   - ✅ JWT con `python-jose` (reemplaza implementación manual)
   - ✅ Hashing de contraseñas con `passlib` y `pbkdf2_sha256`
   - ✅ Tokens con expiración automática (8 horas)
   - ✅ Validación completa de tokens en todos los endpoints protegidos

2. **Variables de Entorno**
   - ✅ Secrets en archivo `.env` (no en código fuente)
   - ✅ JWT_SECRET_KEY generado aleatoriamente
   - ✅ Configuración separada del código

3. **Validación de Datos**
   - ✅ Validación estricta de Pydantic con rangos:
     - Edad: 1-119 años
     - Peso: 20-300 kg
     - Altura: 50-250 cm
     - IMC: 10-100
   - ✅ Contraseñas mínimo 6 caracteres
   - ✅ Validación de emails con EmailStr

4. **CORS Seguro**
   - ✅ Métodos HTTP específicos (GET, POST, PUT, DELETE)
   - ✅ Headers limitados (Authorization, Content-Type)

5. **Documentación Automática**
   - ✅ Swagger UI en `/docs`
   - ✅ ReDoc en `/redoc`

## 📦 Instalación

### 1. Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus secrets:

```bash
copy .env.example .env
```

**Importante**: Genera un JWT_SECRET_KEY único para producción:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Iniciar el servidor

```bash
# Opción 1: Con uvicorn directamente
$env:PYTHONPATH="d:\nutriExpert\backend"
cd backend
python -m uvicorn main:app --reload --port 8000

# Opción 2: Con script (crear start.ps1)
.\start.ps1
```

## 🚀 Endpoints

### Autenticación

- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión (retorna JWT)   
- `GET /auth/me` - Obtener usuario actual (requiere token)

### Reglas (Solo Nutricionistas)

- `GET /rules` - Listar todas las reglas
- `POST /rules` - Crear nueva regla
- `PUT /rules/{id}` - Actualizar regla
- `DELETE /rules/{id}` - Eliminar regla

### Motor de Inferencia

- `POST /infer` - Diagnosticar paciente y generar plan nutricional

## 🔑 Usuario Demo

Email: `pro@nutri.com`  
Password: `nutri123`  
Rol: `nutritionist`

## 📖 Documentación API

Una vez iniciado el servidor, visita:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔒 Seguridad

### ¿Qué se mejoró?

**ANTES** (❌ Inseguro):
- JWT implementado manualmente con código casero
- Salt de contraseñas hardcodeado en el código
- Secret por defecto "dev-secret"
- Sin validación de rangos en datos
- CORS permisivo (`allow_methods=["*"]`)

**AHORA** (✅ Seguro):
- JWT con librería probada y mantenida (`python-jose`)
- Hashing con `passlib` y `pbkdf2_sha256` (29000 iteraciones)
- Secret único generado aleatoriamente
- Validación estricta con Pydantic Field validators
- CORS restrictivo y específico

### Recomendaciones para Producción

1. **Base de Datos**: Migrar de SQLite a PostgreSQL/MySQL
2. **HTTPS**: Usar certificado SSL/TLS
3. **Rate Limiting**: Implementar límites de peticiones
4. **Logging**: Agregar logs de seguridad
5. **Backups**: Configurar backups automáticos
6. **Monitoring**: Implementar health checks

## 📋 Estructura de Seguridad

```
backend/
├── main.py              # API con seguridad mejorada
├── .env                 # Variables de entorno (NO subir a Git)
├── .env.example         # Plantilla de configuración
├── .gitignore          # Protege archivos sensibles
├── requirements.txt     # Dependencias con versiones
└── rules.db            # Base de datos SQLite
```

## 🧪 Testing

```bash
# Probar registro
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test","password":"test123","role":"patient"}'

# Probar login
curl -X POST "http://localhost:8000/auth/login" \
  -F "username=pro@nutri.com" \
  -F "password=nutri123"
```

## 📊 Comparación

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| JWT | Manual | python-jose ✅ |
| Hashing | PBKDF2 custom | passlib ✅ |
| Salt | Hardcoded | Random por hash ✅ |
| Validación | Básica | Estricta + rangos ✅ |
| Docs API | No | Swagger/ReDoc ✅ |
| Env Vars | Hardcoded | .env ✅ |
| CORS | Permisivo | Restrictivo ✅ |

## ⚠️ Notas Importantes

- La base de datos se regenera automáticamente con el usuario demo
- Los tokens JWT expiran después de 8 horas
- Las contraseñas se hashean con 29000 iteraciones de PBKDF2-SHA256
- El secret JWT debe cambiar en producción

## 🔗 Recursos

- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Passlib Documentation](https://passlib.readthedocs.io/)
- [Python-JOSE](https://python-jose.readthedocs.io/)
