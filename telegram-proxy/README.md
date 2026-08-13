# Telegram MTProto Proxy

Готовый прокси для Telegram на официальном Docker-образе `telegrammessenger/proxy`.

## Что это

MTProto — нативный тип прокси Telegram. Работает в мобильном и десктопном клиенте, помогает при блокировках. Это **не** SOCKS5: для ботов в коде см. [examples/client-config.md](examples/client-config.md).

## Быстрый старт

**Нужно:** VPS/сервер с Linux, Docker и открытый порт (обычно 443).

```bash
cd telegram-proxy
chmod +x setup.sh show-links.sh
./setup.sh
```

Скрипт:
- создаёт `.env` с секретом (`dd` + случайные байты);
- определяет публичный IP;
- запускает прокси через Docker Compose;
- печатает ссылки `tg://` и `https://t.me/proxy?...`.

Повторно показать ссылки:

```bash
./show-links.sh
```

## Ручная настройка

```bash
cp .env.example .env
# отредактируйте MTPROTO_SECRET и SERVER_HOST
docker compose up -d
```

Секрет (32 hex, рекомендуется с префиксом `dd`):

```bash
echo "dd$(head -c 16 /dev/urandom | xxd -ps)"
```

## Параметры (.env)

| Переменная | Описание |
|------------|----------|
| `PROXY_PORT` | Порт на сервере (по умолчанию 443) |
| `MTPROTO_SECRET` | 32 hex-символа, секрет MTProto |
| `SERVER_HOST` | Публичный IP или домен для ссылок |

## Управление

```bash
docker compose ps
docker compose logs -f
docker compose down
docker compose pull && docker compose up -d   # обновление
```

## Регистрация в Telegram

Отправьте секрет боту [@MTProxybot](https://t.me/MTProxybot) — прокси может попасть в список доступных в приложении.

## Безопасность

- Не коммитьте `.env` (секрет = ключ доступа к прокси).
- Ограничьте вход на сервер (SSH, firewall).
- Порт 443 часто проходит фильтры; при необходимости смените `PROXY_PORT` и обновите ссылки.

## Fake TLS (опционально)

Для маскировки под TLS к домену секрет с префиксом `ee` + hex домена:

```bash
# пример для www.google.com
echo -n "ee" && echo -n "www.google.com" | xxd -ps
```

Подробнее: [документация MTProxy](https://github.com/TelegramMessenger/MTProxy).
