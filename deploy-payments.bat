@echo off
echo ========================================
echo DESPLEGANDO SISTEMA DE PAGOS
echo ========================================
echo.

echo [1/4] Instalando Supabase CLI...
npm install -g supabase
if %errorlevel% neq 0 (
    echo ERROR: No se pudo instalar Supabase CLI
    echo Instalalo manualmente desde: https://supabase.com/docs/guides/cli
    pause
    exit /b 1
)

echo.
echo [2/4] Iniciando sesion en Supabase...
supabase login
if %errorlevel% neq 0 (
    echo ERROR: No se pudo iniciar sesion
    pause
    exit /b 1
)

echo.
echo [3/4] Vinculando proyecto...
supabase link --project-ref ewotgkdjtgisxprsoddg
if %errorlevel% neq 0 (
    echo ADVERTENCIA: Proyecto ya vinculado o error al vincular
)

echo.
echo [4/4] Desplegando Edge Function...
supabase functions deploy create-preference
if %errorlevel% neq 0 (
    echo ERROR: No se pudo desplegar la funcion
    pause
    exit /b 1
)

echo.
echo [5/5] Configurando Access Token...
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-7852065796013084-011818-390c9a7d5860783294957b3791fad73b-245332039
if %errorlevel% neq 0 (
    echo ERROR: No se pudo configurar el Access Token
    pause
    exit /b 1
)

echo.
echo ========================================
echo DESPLIEGUE COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo Ahora ejecuta la migracion SQL en Supabase Dashboard:
echo 1. Ve a: https://supabase.com/dashboard/project/ewotgkdjtgisxprsoddg/sql/new
echo 2. Copia el contenido de: EJECUTAR_EN_SUPABASE.sql
echo 3. Click en Run
echo.
echo Luego prueba en: https://gestionar.app/premium
echo.
pause
