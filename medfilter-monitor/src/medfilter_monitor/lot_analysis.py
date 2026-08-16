"""Разбор лота: цена, НМЦК и связанные поля из HTML/текста."""

from __future__ import annotations

import logging
import re
from html import unescape
from typing import Any

import requests

log = logging.getLogger(__name__)

PRICE_LABELS = (
    "начальная цена",
    "нмцк",
    "нмц",
    "цена контракта",
    "цена договора",
    "максимальная цена",
    "цена лота",
    "стоимость",
    "price",
)


def parse_money(text: str) -> float | None:
    """Достаёт сумму в рублях из произвольной строки."""
    if not text:
        return None
    s = unescape(text)
    s = s.replace("\xa0", " ").replace("&nbsp;", " ")
    # 1 234 567,89 ₽ / 1234567.89 руб. / 119 906 ₽
    patterns = [
        r"(?<!\d)(\d{1,3}(?:[ \u00a0]\d{3})+(?:[.,]\d{1,2})?)\s*(?:₽|руб)",
        r"(?<!\d)(\d{4,12}(?:[.,]\d{1,2})?)\s*(?:₽|руб)",
        r"(?<!\d)(\d{1,3}(?:[ \u00a0]\d{3})+(?:[.,]\d{1,2})?)\s*(?:RUB|рублей)",
        r"(?:нмцк|нмц|цена)[^\d]{0,40}(\d{1,3}(?:[ \u00a0]\d{3})+(?:[.,]\d{1,2})?)",
        r"(?:нмцк|нмц|цена)[^\d]{0,40}(\d{4,12}(?:[.,]\d{1,2})?)",
    ]
    for pat in patterns:
        m = re.search(pat, s, flags=re.I)
        if not m:
            continue
        raw = m.group(1).replace(" ", "").replace("\u00a0", "").replace(",", ".")
        try:
            val = float(raw)
        except ValueError:
            continue
        if 100 <= val <= 5_000_000_000:
            return val
    return None


def extract_price_from_html(html: str) -> tuple[float | None, dict[str, Any]]:
    """Анализирует HTML карточки лота и возвращает (цена, meta)."""
    meta: dict[str, Any] = {}
    text = re.sub(r"<script.*?</script>", " ", html, flags=re.I | re.S)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", "\n", text)
    lines = [unescape(x).strip() for x in text.splitlines()]
    lines = [x for x in lines if x]
    joined = " ".join(lines)

    # 1) Явная метка «Начальная цена» → следующая строка/рядом
    for i, line in enumerate(lines):
        low = line.lower().replace("\xa0", " ")
        if any(lbl in low for lbl in PRICE_LABELS):
            # цена в этой же строке
            p = parse_money(line)
            if p is None and i + 1 < len(lines):
                p = parse_money(lines[i + 1])
            if p is None and i + 2 < len(lines):
                p = parse_money(lines[i + 2])
            if p is not None:
                meta["price_source"] = f"label:{line[:40]}"
                return p, meta

    # 2) Общий поиск по тексту
    p = parse_money(joined)
    if p is not None:
        meta["price_source"] = "body"
        return p, meta

    # 3) JSON-LD / data attributes
    for m in re.finditer(
        r'(?:price|nmck|startPrice|maxPrice)["\']?\s*[:=]\s*["\']?([\d. ]+)',
        html,
        flags=re.I,
    ):
        try:
            val = float(m.group(1).replace(" ", ""))
        except ValueError:
            continue
        if 100 <= val <= 5_000_000_000:
            meta["price_source"] = "attr"
            return val, meta

    return None, meta


def enrich_lot_price(
    url: str,
    *,
    session: requests.Session | None = None,
    timeout: int = 20,
    title: str = "",
) -> tuple[float | None, dict[str, Any]]:
    """Скачивает страницу лота и извлекает цену."""
    # сначала из заголовка сниппета
    p = parse_money(title)
    if p is not None:
        return p, {"price_source": "title"}

    if not url or not url.startswith("http"):
        return None, {}

    sess = session or requests.Session()
    try:
        resp = sess.get(
            url,
            timeout=timeout,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "ru-RU,ru;q=0.9",
            },
        )
        if resp.status_code >= 400:
            return None, {"price_error": resp.status_code}
        return extract_price_from_html(resp.text)
    except Exception as exc:  # noqa: BLE001
        log.debug("price enrich failed %s: %s", url, exc)
        return None, {"price_error": str(exc)}


def format_lot_price(price: float | None, currency: str = "RUB") -> str:
    if price is None:
        return "Цена лота: не указана"
    cur = "₽" if currency in {"RUB", "RUR", "руб", ""} else currency
    return f"Цена лота: {price:,.0f} {cur}".replace(",", " ")
