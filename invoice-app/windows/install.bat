@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo Установка завершилась с ошибкой.
  pause
  exit /b 1
)
echo.
echo Готово. Ярлык «СчётМастер» добавлен на рабочий стол и в меню Пуск.
pause
endlocal
