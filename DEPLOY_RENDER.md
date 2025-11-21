# 🚀 Guía de Despliegue en Render

## Paso 1: Preparar GitHub

```bash
# Inicializar git (si no lo has hecho)
git init
git add .
git commit -m "Preparar para despliegue en Render"

# Crear repositorio en GitHub y subir
git remote add origin https://github.com/TU_USUARIO/nutriexpert.git
git branch -M main
git push -u origin main
```

## Paso 2: Desplegar Backend en Render

1. Ve a https://render.com y crea cuenta
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configuración:

```
Name: nutriexpert-backend
Environment: Python 3
Region: Oregon (US West)
Branch: main
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

5. **Variables de entorno** (Add Environment Variable):

```
JWT_SECRET_KEY=<genera con: openssl rand -hex 32>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480
ENVIRONMENT=production
DATABASE_URL=sqlite:///./rules.db
```

6. Click en **"Create Web Service"**
7. Espera 5-10 minutos al deploy
8. **Copia la URL** (ej: `https://nutriexpert-backend.onrender.com`)

## Paso 3: Desplegar Frontend en Render

1. Click en **"New +"** → **"Static Site"**
2. Selecciona el mismo repositorio
3. Configuración:

```
Name: nutriexpert-frontend
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Variables de entorno**:

```
VITE_API_URL=https://nutriexpert-backend.onrender.com
```
*(Reemplaza con la URL real de tu backend)*

5. Click en **"Create Static Site"**
6. Espera 3-5 minutos al deploy

## Paso 4: Probar

1. Abre la URL del frontend: `https://nutriexpert-frontend.onrender.com`
2. Login con: `pro@nutri.com` / `nutri123`
3. Prueba todas las funciones

## 🐛 Solución de Problemas

### Backend no inicia
- Verifica que las variables de entorno estén configuradas
- Revisa los logs: Click en tu servicio → Logs

### Frontend no conecta al backend
- Verifica que `VITE_API_URL` tenga la URL correcta del backend
- Agrega `/` al final si es necesario
- Redeploy del frontend

### CORS Error
Ya está configurado en `main.py` con `allow_origins=["*"]`

## 💰 Plan Gratuito de Render

- ✅ 750 horas/mes gratis
- ✅ Auto-deploy desde GitHub
- ⚠️ El servicio se "duerme" después de 15 min sin uso
- ⚠️ Primer request puede tardar 30-60 segundos

## 🎯 URLs Finales

Después del deploy tendrás:

- **Frontend:** `https://nutriexpert-frontend.onrender.com`
- **Backend:** `https://nutriexpert-backend.onrender.com`
- **API Docs:** `https://nutriexpert-backend.onrender.com/docs`

## 📝 Comandos Git Útiles

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "Actualización"

# Push (auto-deploy en Render)
git push origin main
```

## ✅ Checklist

- [ ] Código subido a GitHub
- [ ] Backend desplegado en Render
- [ ] Variables de entorno configuradas
- [ ] Frontend desplegado en Render
- [ ] VITE_API_URL actualizada
- [ ] App funciona correctamente
- [ ] Usuario demo puede hacer login
