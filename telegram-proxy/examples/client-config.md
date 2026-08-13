# Подключение клиентов и ботов через прокси

## Telegram (телефон / десктоп)

1. Откройте ссылку `https://t.me/proxy?server=...` из вывода `setup.sh`
2. Или: **Настройки → Данные и память → Использовать прокси → Добавить прокси → MTProto**

## SOCKS5 (если используете отдельный SOCKS-прокси)

В Telegram Desktop: тип **SOCKS5**, укажите хост, порт, логин и пароль.

## Python — Telethon

```python
from telethon import TelegramClient

proxy = ("socks5", "127.0.0.1", 1080)  # или socks5 + auth

client = TelegramClient("session", api_id, api_hash, proxy=proxy)
```

## Python — Pyrogram

```python
from pyrogram import Client

app = Client(
    "session",
    api_id=API_ID,
    api_hash=API_HASH,
    proxy=dict(
        scheme="socks5",
        hostname="127.0.0.1",
        port=1080,
        username="user",
        password="pass",
    ),
)
```

## Python — python-telegram-bot

```python
from telegram.request import HTTPXRequest

request = HTTPXRequest(proxy_url="socks5://user:pass@127.0.0.1:1080")
# передать request в Application.builder()
```

MTProto-прокси из этого репозитория работает **нативно в приложении Telegram**, не через SOCKS в коде ботов.
