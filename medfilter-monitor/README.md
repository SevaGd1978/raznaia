# Агент мониторинга закупок фильтров для медтехники (РФ)

Постоянно ищет новые **закупки и контракты** по фильтрам для медицинского оборудования
в России (ИВЛ / анестезия / гемодиализ / инфузия / медгазы) и шлёт алерты в Telegram.

## Что умеет

- Несколько источников данных:
  - **ClearSpending** — контракты ЕИС (работает без ключа, лимит API ~100 запросов/сутки)
  - **zakupki.gov.ru HTML** — активные извещения (может быть недоступен из-за рубежа)
  - **DaMIA** — поиск извещений по API (нужен `DAMIA_API_KEY`)
- SQLite-дедупликация: повторно не спамит по одной и той же закупке
- Оценка релевантности (отсекает авто/масло/топливо и т.п.)
- Режимы: разовый `run`, непрерывный `daemon`, GitHub Actions по cron

## Быстрый старт

```bash
cd medfilter-monitor
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
cp .env.example .env   # заполните Telegram / DaMIA при необходимости

# Один цикл (печать в консоль)
python -m medfilter_monitor run --dry-run -v

# Непрерывный мониторинг каждый час
python -m medfilter_monitor daemon --interval 3600

# Последние найденные
python -m medfilter_monitor recent
```

## Telegram

1. Создайте бота у [@BotFather](https://t.me/BotFather), получите токен.
2. Узнайте `chat_id` (себе в личку или в группу).
3. Пропишите в `.env`:

```
TELEGRAM_BOT_TOKEN=123:ABC...
TELEGRAM_CHAT_ID=123456789
```

## GitHub Actions (постоянный мониторинг в облаке)

Workflow: `.github/workflows/medfilter-monitor.yml` (каждые 3 часа).

Добавьте secrets репозитория:

| Secret | Назначение |
|--------|------------|
| `TELEGRAM_BOT_TOKEN` | бот |
| `TELEGRAM_CHAT_ID` | чат |
| `DAMIA_API_KEY` | опционально |

Запуск вручную: Actions → **Medfilter procurement monitor** → Run workflow.

## Cursor Automation

Готовый промпт: [`prompts/cursor-automation.md`](prompts/cursor-automation.md).

## Настройка запросов

Файл [`config/queries.yaml`](config/queries.yaml) — ключевые фразы, маркеры релевантности, порог `min_score`.

## Ограничения

- ЕИС (`zakupki.gov.ru`) часто режет зарубежные IP — для активных извещений лучше DaMIA или запуск из РФ / GitHub Actions.
- ClearSpending отражает в основном **контракты** (уже заключённые), не все свежие извещения.
- У ClearSpending дневной rate-limit; агент делает по одному запросу на фразу из конфига.
