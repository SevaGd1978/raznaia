# MVP-план на 6 недель

Пошаговый план разработки **Raznaia TMS** — от каркаса до демо v1.0.

**Стек:** Python 3.12 · FastAPI · PostgreSQL · React (Vite) · Docker

---

## Обзор по неделям

| Неделя | Фокус | Результат |
|--------|-------|-----------|
| 1 | Инфраструктура + справочники | API клиентов/перевозчиков, миграции БД |
| 2 | Заказы (ядро) | CRUD заказов, статусы, фильтры |
| 3 | Frontend MVP | UI списков и карточек |
| 4 | Документы + дашборд | PDF-заявка, главная страница |
| 5 | Auth + polish | Логин, валидация, UX-правки |
| 6 | Тесты + релиз | UAT, документация, demo |

---

## Неделя 1 — Фундамент

### День 1–2: Инфраструктура
- [x] Структура репозитория (`backend/`, `docs/`, `docker-compose.yml`)
- [ ] Docker: PostgreSQL + backend
- [ ] FastAPI skeleton: health, CORS, settings
- [ ] Alembic: первая миграция
- [ ] CI: lint + pytest на push

### День 3–4: Модель данных
- [ ] Сущности: `Counterparty` (client/carrier), `Vehicle`, `Order`
- [ ] Enum `OrderStatus`, `CounterpartyType`
- [ ] CRUD API `/api/v1/clients`, `/api/v1/carriers`
- [ ] CRUD API `/api/v1/vehicles`
- [ ] Seed-скрипт с тестовыми данными

### День 5: Проверка
- [ ] Postman/HTTPie: все endpoints работают
- [ ] README: как запустить локально
- [ ] Отметить US-01, US-02, US-03, US-04, US-05 как backend-ready

**Deliverable:** REST API справочников + Swagger `/docs`

---

## Неделя 2 — Заказы

### День 1–2: CRUD заказов
- [ ] `Order` model: маршрут, даты, груз, ставки, FK
- [ ] POST/GET/PATCH/DELETE `/api/v1/orders`
- [ ] Валидация: дата выгрузки ≥ дата погрузки
- [ ] Вычисляемое поле `margin = client_rate - carrier_rate`

### День 3: Workflow статусов
- [ ] PATCH `/api/v1/orders/{id}/status`
- [ ] Правила переходов (draft→confirmed→…)
- [ ] Таблица `order_status_history` (US-10)

### День 4: Фильтры и поиск
- [ ] Query params: status, client_id, date_from, date_to
- [ ] Сортировка по дате погрузки
- [ ] Пагинация (limit/offset)

### День 5: Интеграционные тесты
- [ ] Тест: создать клиента → заказ → сменить статус
- [ ] Тест: некорректный переход статуса → 422

**Deliverable:** полный Order API, US-06–US-09, US-14

---

## Неделя 3 — Frontend

### День 1: Каркас UI
- [x] Vite + React + TypeScript
- [x] React Router: `/`, `/orders`, `/clients`, `/carriers`
- [x] UI-kit: таблица, форма, кнопки, badge статусов
- [x] API client (fetch)

### День 2–3: Справочники
- [x] Страница клиентов: список + модалка создания
- [x] Страница перевозчиков
- [x] Страница ТС с привязкой к перевозчику

### День 4–5: Заказы
- [x] Список заказов с фильтрами
- [x] Карточка заказа: форма + назначение перевозчика
- [x] Смена статуса (dropdown + confirm)
- [x] Отображение маржи

**Deliverable:** работающий UI без auth

---

## Неделя 4 — Документы и дашборд

### День 1–2: PDF-заявка
- [ ] Jinja2/HTML шаблон заявки
- [ ] WeasyPrint или reportlab → PDF
- [ ] GET `/api/v1/orders/{id}/application.pdf`
- [ ] Кнопка «Скачать заявку» в UI

### День 3: Дашборд
- [ ] GET `/api/v1/dashboard` — счётчики по статусам
- [ ] Блок «Заказы на сегодня»
- [ ] Главная страница (US-16)

### День 4–5: Отчёт за период
- [ ] GET `/api/v1/reports/orders?from=&to=`
- [ ] Экспорт CSV
- [ ] Простая страница отчёта (US-13)

**Deliverable:** US-11, US-13, US-16

---

## Неделя 5 — Безопасность и UX

### День 1–2: Аутентификация
- [ ] Модель `User`, JWT login
- [ ] POST `/api/v1/auth/login`
- [ ] Middleware: защита всех routes кроме login
- [ ] Login page + token в localStorage

### День 3: UX-полировка
- [ ] Toast-уведомления об успехе/ошибке
- [ ] Confirm при отмене заказа
- [ ] Empty states («Нет заказов»)
- [ ] Loading skeletons

### День 4–5: Валидация и edge cases
- [ ] Обязательные поля в формах
- [ ] 404/422 человекочитаемые сообщения
- [ ] Мобильная ширина ≥768px (базово)

**Deliverable:** US-15, защищённое приложение

---

## Неделя 6 — Релиз

### День 1–2: Тестирование
- [ ] Прогон 5 UAT-сценариев из чек-листа
- [ ] Исправление блокеров
- [ ] Покрытие unit-тестов ≥60% backend

### День 3: Документация
- [ ] `docs/USER-GUIDE.md` — 5 скриншотов
- [ ] `docs/DEPLOY.md` — деплой на VPS
- [ ] Release notes v1.0

### День 4: Деплой demo
- [ ] Docker Compose prod profile
- [ ] Env: DATABASE_URL, SECRET_KEY
- [ ] Demo-данные при первом запуске

### День 5: Презентация / сдача
- [ ] Demo-сценарий 10 минут
- [ ] Backlog v1.1 (счёт, RBAC, Excel import)

**Deliverable:** Raznaia TMS v1.0 demo

---

## UAT-сценарии (прогнать на неделе 6)

1. **Happy path:** клиент → заказ → перевозчик → статус `completed` → PDF
2. **Фильтр:** найти все заказы `in_transit` за текущую неделю
3. **Отмена:** перевести заказ в `cancelled`, убедиться что нельзя вернуть в `in_transit`
4. **Маржа:** client_rate=50000, carrier_rate=40000 → margin=10000
5. **Auth:** без токена API возвращает 401

---

## Definition of Done (для каждой задачи)

- [ ] Код в main/feature branch, PR reviewed
- [ ] API задокументирован в Swagger
- [ ] Нет блокирующих linter errors
- [ ] Тест на happy path (backend) или ручная проверка (UI)
- [ ] Обновлён README/docs при изменении setup

---

## Риски недельного плана

| Риск | Митигация |
|------|-----------|
| PDF сложнее ожидаемого | Fallback: HTML print в браузере |
| Frontend отстаёт | Неделя 3+: API-first, тест через Swagger |
| Auth блокирует | JWT только в нед.5, до этого open API locally |

---

## После MVP → v1.1 (недели 7–8)

- [ ] Счёт клиенту (US-12)
- [ ] RBAC: роли logist / accountant / admin
- [ ] Импорт Excel (US-20)
- [ ] Чек-лист интеграций → пилот 1С
