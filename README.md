# CargoDesk

Демо веб-приложения для автоматизации транспортной логистики (в духе TransTrade).

## Возможности

- Лендинг продукта
- Рабочий стол логиста: обзор, заказы, клиенты, исполнители, документы, отчёты
- Создание заказов и контрагентов (данные в `localStorage`)
- Смена статусов перевозки и расчёт маржи

## Запуск

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
npm run preview
```

## Деплой (GitHub Pages)

Сборка под путь `/raznaia/`:

```bash
npm run build:pages
```

Ветка `gh-pages` уже содержит статический билд. Чтобы сайт открылся по адресу
`https://sevagd1978.github.io/raznaia/`, включите Pages в настройках репозитория:

**Settings → Pages → Build and deployment → Deploy from a branch → Branch: `gh-pages` / `/` (root) → Save**
