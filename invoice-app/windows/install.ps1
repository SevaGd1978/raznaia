# Установка СчётМастер в профиль пользователя Windows
$ErrorActionPreference = 'Stop'

$Source = Split-Path -Parent $MyInvocation.MyCommand.Path
$Target = Join-Path $env:LOCALAPPDATA 'Programs\SchetMaster'

Write-Host "Установка СчётМастер..."
Write-Host "Источник: $Source"
Write-Host "Папка:    $Target"

New-Item -ItemType Directory -Force -Path $Target | Out-Null

# Копируем runtime + app + bat-файлы
$items = @('runtime', 'app', 'start.bat', 'uninstall.ps1', 'README-WINDOWS.txt')
foreach ($item in $items) {
  $from = Join-Path $Source $item
  $to = Join-Path $Target $item
  if (Test-Path $from) {
    if (Test-Path $to) { Remove-Item -Recurse -Force $to }
    Copy-Item -Recurse -Force $from $to
  }
}

$StartBat = Join-Path $Target 'start.bat'
$Wsh = New-Object -ComObject WScript.Shell

$Desktop = [Environment]::GetFolderPath('Desktop')
$DesktopLnk = Join-Path $Desktop 'СчётМастер.lnk'
$Shortcut = $Wsh.CreateShortcut($DesktopLnk)
$Shortcut.TargetPath = $StartBat
$Shortcut.WorkingDirectory = $Target
$Shortcut.WindowStyle = 1
$Shortcut.Description = 'СчётМастер — счета с НДС'
$Shortcut.Save()

$StartMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$StartLnk = Join-Path $StartMenu 'СчётМастер.lnk'
$Shortcut2 = $Wsh.CreateShortcut($StartLnk)
$Shortcut2.TargetPath = $StartBat
$Shortcut2.WorkingDirectory = $Target
$Shortcut2.WindowStyle = 1
$Shortcut2.Description = 'СчётМастер — счета с НДС'
$Shortcut2.Save()

Write-Host "Установка завершена."
Write-Host "Запуск: $StartBat"
