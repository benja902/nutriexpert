@echo off
cd /d "%~dp0"
set PYTHONPATH=%CD%

echo.
echo ========================================
echo   NutriExpert Backend - Iniciando...
echo ========================================
echo.

REM Buscar y activar entorno virtual
if exist ".venv\Scripts\activate.bat" (
    echo Activando entorno virtual .venv...
    call .venv\Scripts\activate.bat
    goto :deps
)
if exist "venv\Scripts\activate.bat" (
    echo Activando entorno virtual venv...
    call venv\Scripts\activate.bat
    goto :deps
)
if exist "..\..\.venv\Scripts\activate.bat" (
    echo Activando entorno virtual ..\.venv...
    call ..\..\.venv\Scripts\activate.bat
    goto :deps
)

:deps
echo Verificando dependencias...
python -c "import fastapi, passlib, jose" 2>nul
if errorlevel 1 (
    echo Instalando dependencias faltantes...
    pip install -r requirements.txt
)

echo.
echo Servidor: http://localhost:8000
echo Docs API: http://localhost:8000/docs
echo.

python -m uvicorn main:app --reload --port 8000
