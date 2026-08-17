# Raznaia TMS

Система автоматизации транспортной логистики (MVP). Аналог TransTrade для учебного и продуктового прототипирования.

## Документация

| Файл | Описание |
|------|----------|
| [CHECKLIST-razrabotka-programmy.md](CHECKLIST-razrabotka-programmy.md) | Полный чек-лист разработки (14 этапов) |
| [docs/01-CONCEPT.md](docs/01-CONCEPT.md) | Концепция продукта |
| [docs/02-USER-STORIES.md](docs/02-USER-STORIES.md) | User stories MVP |
| [docs/03-MVP-PLAN-6-WEEKS.md](docs/03-MVP-PLAN-6-WEEKS.md) | План на 6 недель |
| [docs/04-INTEGRATIONS-CHECKLIST.md](docs/04-INTEGRATIONS-CHECKLIST.md) | Чек-лист интеграций |
| [docs/05-TECH-SPEC.md](docs/05-TECH-SPEC.md) | Техническое ТЗ |

## Быстрый старт

### Docker (рекомендуется)

```bash
docker compose up --build
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

Загрузить демо-данные:

```bash
docker compose exec backend python seed.py
```

### Локально (без Docker)

```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg2://raznaia:raznaia@localhost:5432/raznaia
uvicorn app.main:app --reload
```

### Тесты

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

## API (MVP)

| Endpoint | Описание |
|----------|----------|
| `GET /api/v1/clients` | Список клиентов |
| `GET /api/v1/carriers` | Список перевозчиков |
| `GET /api/v1/vehicles` | Список ТС |
| `GET /api/v1/orders` | Список заказов |
| `POST /api/v1/orders` | Создать заказ |
| `PATCH /api/v1/orders/{id}/status` | Сменить статус |
| `GET /api/v1/dashboard` | Статистика |
| `GET /api/v1/orders/{id}/application.pdf` | Заявка (HTML, PDF в v1.1) |

## Статус проекта

- [x] Этап 0–1: концепция, user stories, ТЗ
- [x] Неделя 1 (частично): backend API + Docker
- [ ] Неделя 3: React frontend
- [ ] Неделя 5: JWT auth
- [ ] Неделя 6: релиз v1.0

## Стек

Python 3.12 · FastAPI · PostgreSQL · React (planned) · Docker
