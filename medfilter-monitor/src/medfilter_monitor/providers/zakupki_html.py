"""HTML-поиск активных извещений на zakupki.gov.ru (ЕИС)."""

from __future__ import annotations

import logging
import re
from html import unescape
from typing import Any
from urllib.parse import urlencode, urljoin

import requests

from ..models import Procurement
from . import Provider

log = logging.getLogger(__name__)

SEARCH_URL = "https://zakupki.gov.ru/epz/order/extendedsearch/results.html"


class ZakupkiHtmlProvider(Provider):
    """Парсер выдачи расширенного поиска ЕИС.

    Сайт ЕИС часто недоступен из зарубежных IP (connection reset).
    Провайдер безопасно возвращает [] при сетевых ошибках.
    """

    name = "zakupki_html"

    def __init__(self, session: requests.Session | None = None, timeout: int = 45) -> None:
        self.session = session or requests.Session()
        self.session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "ru-RU,ru;q=0.9",
            }
        )
        self.timeout = timeout

    def search(self, query: str, *, limit: int = 25) -> list[Procurement]:
        params = {
            "searchString": query,
            "morphology": "on",
            "search-filter": "Дате размещения",
            "pageNumber": 1,
            "sortDirection": "false",
            "recordsPerPage": f"_{min(max(limit, 10), 50)}",
            "showLotsInfoHidden": "false",
            "sortBy": "UPDATE_DATE",
            "fz44": "on",
            "fz223": "on",
            "af": "on",
            "ca": "on",
            "pc": "on",
            "pa": "on",
        }
        url = f"{SEARCH_URL}?{urlencode(params)}"
        try:
            resp = self.session.get(url, timeout=self.timeout)
            resp.raise_for_status()
            html = resp.text
        except Exception as exc:  # noqa: BLE001
            log.warning("zakupki.gov.ru unavailable (%s): %s", query, exc)
            return []

        return self._parse(html, query)[:limit]

    def _parse(self, html: str, query: str) -> list[Procurement]:
        items: list[Procurement] = []
        # Карточки поиска содержат реестровый номер и ссылку на извещение
        pattern = re.compile(
            r'href="(?P<href>/epz/order/notice/[^"]+regNumber=(?P<reg>\d+)[^"]*)"[^>]*>'
            r"(?P<body>.*?)</a>",
            re.I | re.S,
        )
        seen: set[str] = set()
        for match in pattern.finditer(html):
            reg = match.group("reg")
            if reg in seen:
                continue
            seen.add(reg)
            href = urljoin("https://zakupki.gov.ru", unescape(match.group("href")))
            # Вырезаем ближайший текстовый контекст вокруг совпадения
            start = max(0, match.start() - 400)
            end = min(len(html), match.end() + 800)
            chunk = _strip_tags(html[start:end])
            title = chunk[:240].strip() or f"Извещение {reg}"
            price = _extract_price(chunk)
            items.append(
                Procurement(
                    id=f"eis:{reg}",
                    title=title,
                    source=self.name,
                    url=href,
                    price=price,
                    products=[title],
                    query=query,
                    law="",
                    published_at="",
                    raw={"reg": reg},
                )
            )
        return items


def _strip_tags(html: str) -> str:
    text = re.sub(r"<script.*?</script>", " ", html, flags=re.I | re.S)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _extract_price(text: str) -> float | None:
    m = re.search(r"([\d\s]{3,})\s*₽|([\d\s]{3,})\s*руб", text)
    if not m:
        return None
    raw = (m.group(1) or m.group(2) or "").replace(" ", "")
    try:
        return float(raw)
    except ValueError:
        return None
