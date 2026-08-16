# raznaia · СчётМастер

Веб-модуль счетов с входом, регистрацией и админ-паролем.

## Windows

Готовый установщик/portable: артефакт `SchetMaster-Windows.zip`  
(сборка: `cd invoice-app && npm run package:win`).

На ПК: распаковать → `install.bat` → ярлык «СчётМастер».

## Сейчас онлайн

См. актуальный URL в [`invoice-app/ACCESS.md`](invoice-app/ACCESS.md).

Постоянный бесплатный хостинг (Render):  
https://render.com/deploy?repo=https://github.com/SevaGd1978/raznaia

```bash
cd invoice-app
cp .env.example .env
npm install
npm run build
npm start
```

- Пользователи регистрируются сами
- Админ: логин `admin`, пароль из `ADMIN_PASSWORD`
- Работы (нормочасы), запчасти, НДС 22%
