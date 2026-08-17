# Raznaia TMS

Полноценная web-система автоматизации транспортной логистики (MVP v0.2).

## Возможности

- JWT-авторизация и защищённый API
- Дашборд: статистика, маржа, заказы на сегодня
- Заказы: CRUD, workflow статусов, история, назначение перевозчика/ТС
- Справочники: клиенты, перевозчики, транспорт
- PDF-заявка (WeasyPrint)
- Отчёты за период (JSON + CSV)
- Docker dev + production, Alembic, CI

## Документация

| Файл | Описание |
|------|----------|
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | Руководство пользователя |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Production-деплой |
| [docs/01-CONCEPT.md](docs/01-CONCEPT.md) | Концепция продукта |
| [docs/03-MVP-PLAN-6-WEEKS.md](docs/03-MVP-PLAN-6-WEEKS.md) | План разработки |
| [CHECKLIST-razrabotka-programmy.md](CHECKLIST-razrabotka-programmy.md) | Полный чек-лист (14 этапов) |

## Быстрый старт (разработка)

```bash
docker compose up --build
docker compose exec backend python seed.py
```

| Сервис | URL |
|--------|-----|
| **UI** | http://localhost:5173 |
| **API** | http://localhost:8000/docs |
| **Логин** | admin@raznaia.local / admin123 |

## Production

```bash
cp .env.prod.example .env
# отредактируйте POSTGRES_PASSWORD и SECRET_KEY
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python seed.py
```

Подробнее: [docs/DEPLOY.md](docs/DEPLOY.md)

## Тесты

```bash
cd backend && python3 -m pytest -v
cd frontend && npm run build
```

CI: `.github/workflows/ci.yml`

## Стек

Python 3.12 · FastAPI · PostgreSQL · Alembic · React · TypeScript · Tailwind · Docker

## Статус v0.2

- [x] Backend API + миграции
- [x] JWT auth
- [x] React UI + login
- [x] PDF + отчёты
- [x] Production Docker + CI
- [ ] RBAC (несколько ролей)
- [ ] Интеграции (1С, ЭДО, АТИ)
