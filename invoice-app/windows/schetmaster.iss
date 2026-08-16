; Inno Setup script for СчётМастер
; Build on Windows with Inno Setup Compiler:
;   ISCC.exe windows\schetmaster.iss
;
; Expects packaged folder at dist-windows\SchetMaster\

#define MyAppName "СчётМастер"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "SchetMaster"
#define MyAppExeName "start.bat"

[Setup]
AppId={{8CF2A1B2-7D44-4F3A-9C21-SCHETMASTER01}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\Programs\SchetMaster
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\dist-windows
OutputBaseFilename=SchetMaster-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
SetupIconFile=
UninstallDisplayName={#MyAppName}

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "Создать ярлык на рабочем столе"; GroupDescription: "Дополнительно:"

[Files]
Source: "..\dist-windows\SchetMaster\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\Удалить {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Запустить СчётМастер"; Flags: nowait postinstall skipifsilent shellexec
