# Доступ к СчётМастер

Cloudflare (`*.trycloudflare.com`) из РФ часто не открывается.

## Другой хостинг сейчас (bore.pub — не Cloudflare)

**http://bore.pub:34666**

Резерв (Pinggy):
- https://fjywc-35-167-27-154.free.pinggy.net
- https://yuepm-35-167-27-154.run.pinggy-free.link

| Роль | Логин | Пароль |
|---|---|---|
| Админ | `admin` | `AdminRaznaia2026` |
| Демо | `demo` | `demo123` |

## Постоянный хостинг (нужен ваш вход через GitHub)

Я не могу завершить деплой без вашего входа в GitHub OAuth.

### Render (обычно открывается из РФ)
https://render.com/deploy?repo=https://github.com/SevaGd1978/raznaia

### Amvera (российский)
https://amvera.ru — проект из GitHub, корень репозитория (есть `Dockerfile` + `amvera.yml`)

### GitHub Actions (временный публичный URL)
Workflow: `Host СчётМастер (temporary public URL)`  
Actions → Run workflow → смотрите Job Summary со ссылкой.
