@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "SCHETMASTER_PACKAGED=1"
set "PORT=3781"
set "HOST=127.0.0.1"
set "COOKIE_SECURE=false"
if not defined ADMIN_PASSWORD set "ADMIN_PASSWORD=AdminRaznaia2026"
if not defined JWT_SECRET set "JWT_SECRET=schetmaster-windows-local-secret"
if not defined DATA_DIR set "DATA_DIR=%APPDATA%\SchetMaster"
if not defined DB_PATH set "DB_PATH=%DATA_DIR%\schetmaster.db"

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

echo.
echo  СчётМастер запускается...
echo  Адрес: http://127.0.0.1:%PORT%
echo  Админ: login admin / пароль %ADMIN_PASSWORD%
echo  Данные: %DATA_DIR%
echo.

start "" "http://127.0.0.1:%PORT%"
"%~dp0runtime\node.exe" "%~dp0runtime\node_modules\tsx\dist\cli.mjs" "%~dp0app\server\run.ts"
endlocal
