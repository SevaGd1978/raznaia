# Удаление СчётМастер (ярлыки и программа). База в %APPDATA%\SchetMaster сохраняется.
$ErrorActionPreference = 'Continue'

$Target = Join-Path $env:LOCALAPPDATA 'Programs\SchetMaster'
$DesktopLnk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'СчётМастер.lnk'
$StartLnk = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\СчётМастер.lnk'

foreach ($lnk in @($DesktopLnk, $StartLnk)) {
  if (Test-Path $lnk) { Remove-Item -Force $lnk }
}

if (Test-Path $Target) {
  Remove-Item -Recurse -Force $Target
  Write-Host "Папка программы удалена: $Target"
}

Write-Host "Готово. База данных (если была) осталась в %APPDATA%\SchetMaster"
pause
