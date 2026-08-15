"""Уведомления."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod

import requests

from .models import Procurement

log = logging.getLogger(__name__)


class Notifier(ABC):
    @abstractmethod
    def send(self, items: list[Procurement], *, dry_run: bool = False) -> int:
        """Отправляет уведомления, возвращает число успешно отправленных."""


class ConsoleNotifier(Notifier):
    def __init__(self, max_print: int = 15) -> None:
        self.max_print = max_print

    def send(self, items: list[Procurement], *, dry_run: bool = False) -> int:
        prefix = "[DRY] " if dry_run else ""
        shown = items[: self.max_print]
        for item in shown:
            print(f"{prefix}---\n{item.short_summary()}\n")
        if len(items) > self.max_print:
            print(f"{prefix}… и ещё {len(items) - self.max_print} позиций")
        return len(items)


class TelegramNotifier(Notifier):
    def __init__(self, bot_token: str, chat_id: str, timeout: int = 30) -> None:
        if not bot_token or not chat_id:
            raise ValueError("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required")
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.timeout = timeout
        self.session = requests.Session()

    def send(self, items: list[Procurement], *, dry_run: bool = False) -> int:
        if dry_run:
            return ConsoleNotifier().send(items, dry_run=True)

        sent = 0
        for item in items:
            text = (
                "🩺 <b>Новая закупка: фильтры / медтехника</b>\n"
                f"<code>{_esc(item.id)}</code>\n"
                f"{_esc(item.title[:350])}\n"
                f"Заказчик: {_esc(item.customer or 'н/д')}\n"
                f"Цена: {_price(item)}\n"
                f"Дата: {_esc(item.published_at or 'н/д')}\n"
                f"Score: {item.score} | {_esc(item.source)}\n"
                f'<a href="{_esc(item.url)}">Открыть</a>'
            )
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            try:
                resp = self.session.post(
                    url,
                    json={
                        "chat_id": self.chat_id,
                        "text": text,
                        "parse_mode": "HTML",
                        "disable_web_page_preview": True,
                    },
                    timeout=self.timeout,
                )
                resp.raise_for_status()
                sent += 1
            except Exception as exc:  # noqa: BLE001
                log.error("Telegram send failed for %s: %s", item.id, exc)
        return sent


class MultiNotifier(Notifier):
    def __init__(self, notifiers: list[Notifier]) -> None:
        self.notifiers = notifiers

    def send(self, items: list[Procurement], *, dry_run: bool = False) -> int:
        if not items:
            return 0
        total = 0
        for n in self.notifiers:
            total = max(total, n.send(items, dry_run=dry_run))
        return total


def _esc(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _price(item: Procurement) -> str:
    if item.price is None:
        return "н/д"
    return f"{item.price:,.0f} {item.currency}".replace(",", " ")
