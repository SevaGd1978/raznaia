# СчётМастер

Веб-модуль выставления счетов с авторизацией.

## Возможности

- Регистрация и вход по логину/паролю
- Администратор: логин `admin` + пароль `ADMIN_PASSWORD`
- Черновики счетов на сервере (SQLite)
- Работы в нормочасах и запасные части
- НДС 22%, предпросмотр и печать

## Локальный запуск

```bash
cd invoice-app
cp .env.example .env
npm install
npm run build
npm start
```

Откройте http://localhost:3000

Режим разработки (Vite + API):

```bash
npm run dev
```

## Учётные записи

| Роль | Логин | Пароль |
|---|---|---|
| Админ | `admin` | значение `ADMIN_PASSWORD` из `.env` (по умолчанию `AdminRaznaia2026`) |
| Пользователь | через форму «Регистрация» | свой пароль (≥ 6 символов) |

## Переменные окружения

- `PORT` — порт сервера (3000)
- `ADMIN_PASSWORD` — пароль администратора
- `JWT_SECRET` — секрет подписи сессий
- `COOKIE_SECURE=true` — только для HTTPS

## Локально (база + Excel)

См. подробную инструкцию: [LOCAL.md](./LOCAL.md)

Кратко:

```bash
cd invoice-app
cp .env.example .env
npm install
npm run build
npm start
```

Откройте http://localhost:3000 — кнопка **Excel** в шапке выгружает счёт.
