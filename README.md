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

- **UI:** http://localhost:5173
- **API:** http://localhost:8000
- **Swagger:** http://localhost:8000/docs

Загрузить демо-данные:

```bash
docker compose exec backend python seed.py
```

### Локально

**Backend:**

```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg2://raznaia:raznaia@localhost:5432/raznaia
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend проксирует `/api` на `http://localhost:8000`.

### Тесты backend

```bash
cd backend
python3 -m pytest -v
```

### Сборка frontend

```bash
cd frontend
npm run build
```

## Возможности MVP

- Дашборд: заказы по статусам, маржа, заказы на сегодня
- Заказы: список, фильтр, создание, редактирование, смена статуса
- Справочники: клиенты, перевозчики, транспорт
- Заявка: HTML/PDF preview по заказу

## Статус проекта

- [x] Этап 0–1: концепция, user stories, ТЗ
- [x] Неделя 1–2: backend API + Docker
- [x] Неделя 3: React frontend
- [ ] Неделя 5: JWT auth
- [ ] Неделя 6: релиз v1.0

## Стек

Python 3.12 · FastAPI · PostgreSQL · React · TypeScript · Tailwind · Docker
