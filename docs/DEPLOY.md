# Развёртывание Raznaia TMS (production)

Инструкция для деплоя на VPS или выделенный сервер с Docker Compose.

## Требования

- Docker Engine 24+ и Docker Compose v2
- Открытые порты: `80` (HTTP) и при необходимости `443` (HTTPS)
- Минимум 1 vCPU, 2 GB RAM, 10 GB диск

## 1. Подготовка сервера

```bash
git clone <repository-url> raznaia-tms
cd raznaia-tms
cp .env.prod.example .env
```

Отредактируйте `.env`:

| Переменная | Описание |
|------------|----------|
| `POSTGRES_PASSWORD` | Надёжный пароль PostgreSQL |
| `SECRET_KEY` | Случайная строка для JWT (мин. 32 символа) |
| `CORS_ORIGINS` | Публичный URL фронтенда, например `https://tms.example.com` |
| `HTTP_PORT` | Порт публикации UI (по умолчанию `80`) |

## 2. Запуск production-стека

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Что происходит при старте:

1. PostgreSQL поднимается и проходит healthcheck.
2. Backend запускает `alembic upgrade head` (см. `backend/docker-entrypoint.sh`), затем uvicorn.
3. Frontend собирается в multi-stage образ и отдаётся через nginx (`frontend/Dockerfile.prod`).

Проверка:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost/api/v1/health
```

## 3. Демо-данные (опционально)

```bash
docker compose -f docker-compose.prod.yml exec backend python seed.py
```

Перед сидом убедитесь, что миграции применены (entrypoint делает это автоматически при каждом старте backend).

## 4. Миграции БД

Новые версии приложения применяют миграции автоматически при рестарте backend.

Ручной запуск:

```bash
docker compose -f docker-compose.prod.yml exec backend python -m alembic upgrade head
```

Создание новой миграции (на машине разработчика):

```bash
cd backend
export DATABASE_URL=postgresql+psycopg2://raznaia:raznaia@localhost:5432/raznaia
python -m alembic revision --autogenerate -m "describe change"
python -m alembic upgrade head
```

## 5. HTTPS (опционально)

В `docker-compose.prod.yml` есть профиль `nginx` для TLS-терминации на edge-прокси.

1. Положите сертификаты в `deploy/certs/` (`fullchain.pem`, `privkey.pem`).
2. Обновите `server_name` в `deploy/nginx.prod.conf`.
3. Запустите с профилем:

```bash
docker compose -f docker-compose.prod.yml --profile nginx up -d --build
```

Альтернатива: внешний reverse proxy (Caddy, Traefik, cloud load balancer) перед контейнером `frontend`.

## 6. Обновление релиза

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 7. Резервное копирование БД

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U raznaia raznaia > backup-$(date +%Y%m%d).sql
```

Восстановление:

```bash
cat backup-YYYYMMDD.sql | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U raznaia raznaia
```

## 8. Локальная разработка vs production

| | Development (`docker-compose.yml`) | Production (`docker-compose.prod.yml`) |
|---|-----------------------------------|----------------------------------------|
| Монтирование кода | Да (`./backend`, `./frontend`) | Нет |
| Hot reload backend | `--reload` | Нет |
| Frontend | Vite dev server (`:5173`) | Статика + nginx (`:80`) |
| Миграции | `docker-entrypoint.sh` при старте backend | То же |
| `create_all` в приложении | Удалён — только Alembic | Только Alembic |

## 9. CI

GitHub Actions (`.github/workflows/ci.yml`):

- `pytest` для backend (SQLite в тестах, миграции проверяются на PostgreSQL service)
- `npm run build` для frontend

## 10. Мониторинг и логи

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

Health endpoint: `GET /api/v1/health`
