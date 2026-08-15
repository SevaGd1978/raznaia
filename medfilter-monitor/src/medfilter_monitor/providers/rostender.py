"""Парсер карточек РосТендер для актуальных извещений."""

from __future__ import annotations

import logging
import re
from html import unescape
from typing import Any
from urllib.parse import urljoin

import requests

from ..models import Procurement
from . import Provider

log = logging.getLogger(__name__)


class RosTenderProvider(Provider):
    """Тянет карточки по URL (обычно найденным веб-поиском)."""

    name = "rostender"

    def __init__(self, session: requests.Session | None = None, timeout: int = 25) -> None:
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
        # Прямой HTML-поиск у РосТендер JS-зависим; URL подтягивает WebFreshProvider.
        return []

    def fetch_urls(self, urls: list[str], *, query: str = "") -> list[Procurement]:
        items: list[Procurement] = []
        seen: set[str] = set()
        for url in urls:
            if not url or url in seen:
                continue
            seen.add(url)
            try:
                resp = self.session.get(url, timeout=self.timeout)
                resp.raise_for_status()
                item = parse_rostender_html(resp.text, url=url, query=query)
                if item:
                    items.append(item)
            except Exception as exc:  # noqa: BLE001
                log.warning("RosTender fetch failed %s: %s", url, exc)
        return items


def parse_rostender_html(html: str, *, url: str, query: str = "") -> Procurement | None:
    lines = _lines(html)
    joined = " ".join(lines)

    reg = ""
    m = re.search(r"Закупка[:\s]*([0-9]{11,25})", joined)
    if m:
        reg = m.group(1)
    if not reg:
        m = re.search(r"regNumber=([0-9]{11,25})", html)
        if m:
            reg = m.group(1)
    if not reg:
        m = re.search(r"/(\d{6,})-tender-", url)
        if m:
            reg = m.group(1)

    title = ""
    mt = re.search(r"<title>(.*?)</title>", html, re.I | re.S)
    if mt:
        title = re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", mt.group(1)))).strip()
        title = title.split("|")[0].strip()
    if not title:
        title = next((l for l in lines if "фильтр" in l.lower() or "диализ" in l.lower()), "")[:300]
    if not title:
        title = f"Тендер {reg}" if reg else "Тендер РосТендер"

    customer = _after_label(lines, "Наименование") or _after_label(lines, "Заказчик")
    inn = ""
    for i, line in enumerate(lines):
        if line == "ИНН" and i + 1 < len(lines) and re.fullmatch(r"\d{10,12}", lines[i + 1]):
            inn = lines[i + 1]
            break

    price = None
    mp = re.search(r"([\d\s]{2,}[.,]\d{2})\s*₽", joined)
    if mp:
        try:
            price = float(mp.group(1).replace(" ", "").replace(",", "."))
        except ValueError:
            price = None

    published = ""
    for i, line in enumerate(lines):
        if "Окончание" in line and i + 1 < len(lines):
            published = lines[i + 1]
            break
    law = "44" if "44-ФЗ" in joined else ("223" if "223-ФЗ" in joined else "")

    eid = reg or re.sub(r"\W+", "", url)[-24:]
    return Procurement(
        id=f"rt:{eid}",
        title=title[:400],
        source="rostender",
        url=url,
        customer=customer,
        region="",
        price=price,
        published_at=published,
        law=law,
        status="active",
        products=[title],
        query=query,
        raw={"inn": inn, "reg": reg},
    )


def _lines(html: str) -> list[str]:
    text = re.sub(r"<script.*?</script>", " ", html, flags=re.I | re.S)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", "\n", text)
    out = []
    for raw in text.splitlines():
        line = unescape(raw).strip()
        if line:
            out.append(line)
    return out


def _after_label(lines: list[str], label: str) -> str:
    for i, line in enumerate(lines):
        if line == label and i + 1 < len(lines):
            cand = lines[i + 1]
            if cand not in {"Наименование", "ИНН", "Анализ заказчика", "Заказчик"}:
                return cand
    return ""
