# Локальный запуск СчётМастер (база + Excel)

При локальном запуске счета и пользователи хранятся в **SQLite** на вашем компьютере.  
Кнопка **Excel** выгружает текущий счёт в файл `.xlsx`.

---

## Вариант A — Windows (проще всего)

1. Скачайте `SchetMaster-Windows.zip` (артефакт сборки или `npm run package:win`).
2. Распакуйте архив.
3. Запустите **`install.bat`** (или сразу `start.bat`).
4. Откройте ярлык **«СчётМастер»**.
5. Войдите: `admin` / `AdminRaznaia2026`.

### Где база данных

`%APPDATA%\SchetMaster\schetmaster.db`

Там же хранятся пользователи и все счета.

### Excel

В шапке программы нажмите **Excel** — скачается файл с листами:
«Реквизиты», «Работы», «Запчасти», «Итоги».

---

## Вариант B — через Node.js (Windows / macOS / Linux)

Нужен [Node.js 20+](https://nodejs.org/).

```bash
cd invoice-app
cp .env.example .env
npm install
npm run build
npm start
```

Откройте в браузере: http://localhost:3000

Для разработки (автоперезагрузка):

```bash
npm run dev
```

### Где база данных

- Linux/macOS: `invoice-app/data/schetmaster.db`
- Windows: `%APPDATA%\SchetMaster\schetmaster.db`

Можно задать свой путь:

```env
DATA_DIR=C:\SchetMaster\data
DB_PATH=C:\SchetMaster\data\schetmaster.db
```

---

## Что уже есть локально

| Функция | Как работает |
|---|---|
| База SQLite | автоматически при `npm start` / `start.bat` |
| Пользователи | регистрация + админ |
| Счета | сохраняются на сервере в БД |
| Excel | кнопка **Excel** в шапке |
| Печать | кнопка **Печать** |

---

## Резервная копия

Скопируйте файл `schetmaster.db` в безопасное место.  
Чтобы восстановить — положите его обратно в ту же папку и перезапустите программу.
