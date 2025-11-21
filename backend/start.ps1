# Script para iniciar el servidor NutriExpert Backend

Write-Host "🚀 Iniciando NutriExpert Backend..." -ForegroundColor Green
Write-Host ""

# Buscar y activar entorno virtual si existe
$venvPath = $null
$possibleVenvs = @(".venv", "venv", "../.venv", "env")

foreach ($path in $possibleVenvs) {
    $fullPath = Join-Path $PSScriptRoot $path
    if (Test-Path $fullPath) {
        $venvPath = $fullPath
        break
    }
}

if ($venvPath) {
    Write-Host "🔧 Activando entorno virtual en: $venvPath" -ForegroundColor Yellow
    $activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
    if (Test-Path $activateScript) {
        & $activateScript
        Write-Host "✅ Entorno virtual activado" -ForegroundColor Green
    }
}

# Establecer PYTHONPATH
$env:PYTHONPATH = $PSScriptRoot

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Advertencia: No se encontró archivo .env" -ForegroundColor Yellow
    Write-Host "   Copiando desde .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "   ⚠️  IMPORTANTE: Edita .env y configura tu JWT_SECRET_KEY único" -ForegroundColor Red
    Write-Host ""
}

# Verificar dependencias
Write-Host "🔍 Verificando dependencias..." -ForegroundColor Cyan
$checkDeps = python -c "try: import fastapi, passlib, jose; print('OK')
except: print('FALTAN')" 2>$null

if ($checkDeps -ne "OK") {
    Write-Host "⚠️  Faltan dependencias. Instalando..." -ForegroundColor Yellow
    pip install -r requirements.txt
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    Write-Host ""
}

# Iniciar servidor
Write-Host "📡 Servidor corriendo en: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📡 Túnel VS Code: Verifica el puerto 8000 en la pestaña 'Ports'" -ForegroundColor Cyan
Write-Host "📖 Documentación API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
