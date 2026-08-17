# Web-демо для тестирования (без Docker)

Быстрый запуск Raznaia TMS на SQLite для проверки в браузере.

## Локально

```bash
# терминал 1
./scripts/start-backend-demo.sh

# терминал 2
./scripts/start-frontend-demo.sh
```

- UI: http://localhost:5173
- Логин: `admin@raznaia.local` / `admin123`

## Публичный URL (Cloudflare Tunnel)

Если нужен доступ из интернета для теста:

```bash
./scripts/start-backend-demo.sh   # tmux или отдельный терминал
./scripts/start-frontend-demo.sh
cloudflared tunnel --url http://127.0.0.1:5173
```

Скопируйте URL вида `https://*.trycloudflare.com` из вывода cloudflared.

> **Примечание:** tunnel URL временный и действует, пока запущен cloudflared.

## Переменные

| Переменная | По умолчанию |
|------------|--------------|
| `DATABASE_URL` | `sqlite:///backend/raznaia-demo.db` |
| `SECRET_KEY` | demo secret (только для теста) |
