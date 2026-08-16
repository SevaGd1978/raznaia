# Установка СчётМастер на Windows

## Готовый пакет

Скачайте архив:

- артефакт сборки: `/opt/cursor/artifacts/SchetMaster-Windows.zip`
- или соберите сами: `npm run package:win`

### Установка

1. Распакуйте `SchetMaster-Windows.zip`
2. Запустите **`install.bat`**
3. Откройте ярлык **«СчётМастер»** на рабочем столе

Без установки можно сразу запустить **`start.bat`**.

### Вход

- Админ: `admin` / `AdminRaznaia2026`
- Или зарегистрируйте пользователя на экране входа

### Setup.exe (опционально)

На Windows с [Inno Setup](https://jrsoftware.org/isinfo.php):

```bat
ISCC.exe windows\schetmaster.iss
```

Скрипт ожидает уже собранную папку `dist-windows\SchetMaster\`.
