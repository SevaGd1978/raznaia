# Доступ к СчётМастер

## Актуальный адрес (сейчас работает)

**https://interim-moore-secrets-currencies.trycloudflare.com**

Старый адрес `https://dns-stylish-hide-dishes.trycloudflare.com` больше не действует — это был временный туннель.

Резервный туннель (до ~60 минут):  
https://hqikt-44-236-205-197.run.pinggy-free.link

## Учётные записи

| Роль | Логин | Пароль |
|---|---|---|
| Админ | `admin` | `AdminRaznaia2026` |
| Демо | `demo` | `demo123` |
| Новый | вкладка «Регистрация» | свой пароль (≥ 6 символов) |

## Постоянный хостинг (не пропадает)

Бесплатный Render (рекомендуется):

1. Смержите PR в `main` (или укажите ветку `cursor/invoice-module-vat22-8cf2` при деплое)
2. Откройте: https://render.com/deploy?repo=https://github.com/SevaGd1978/raznaia
3. Подтвердите Blueprint (`render.yaml`)
4. После деплоя Render выдаст постоянный URL вида `https://schetmaster.onrender.com`

Пароль админа на Render: `AdminRaznaia2026` (из `render.yaml`).

Локально / VPS:

```bash
cd invoice-app
cp .env.example .env
npm install && npm run build && npm start
```
