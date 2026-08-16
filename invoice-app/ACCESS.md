# Доступ к СчётМастер (из России)

Ссылки `*.trycloudflare.com` **из РФ часто не открываются** (блок/фильтр Cloudflare).

## Рабочая ссылка сейчас (не Cloudflare)

**https://fjywc-35-167-27-154.free.pinggy.net**

Резерв: **https://yuepm-35-167-27-154.run.pinggy-free.link**

Ещё варианты (пока жив агент):
- https://yummy-queens-visit.loca.lt
- http://bore.pub:34666

| Роль | Логин | Пароль |
|---|---|---|
| Админ | `admin` | `AdminRaznaia2026` |
| Демо | `demo` | `demo123` |

## Постоянный хостинг из РФ (рекомендуется)

### Вариант A — Render (обычно открывается без VPN)

1. Откройте https://render.com/deploy?repo=https://github.com/SevaGd1978/raznaia  
2. Войдите / зарегистрируйтесь  
3. Deploy → получите `https://….onrender.com`

Пароль админа: `AdminRaznaia2026`

### Вариант B — российский Amvera

1. https://amvera.ru → новый проект из GitHub `SevaGd1978/raznaia`  
2. Каталог приложения: `invoice-app` (есть `amvera.yml` + Dockerfile)  
3. Переменные: `ADMIN_PASSWORD`, `JWT_SECRET`, `COOKIE_SECURE=true`, `PORT=3000`

### Вариант C — Timeweb Cloud Apps

Подключите репозиторий, тип Docker, root `invoice-app`.
