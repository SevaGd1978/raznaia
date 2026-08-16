"""Актуальный веб-поиск извещений (DuckDuckGo) + догрузка карточек."""

from __future__ import annotations

import logging
import re
from html import unescape
from typing import Iterable
from urllib.parse import parse_qs, unquote, urlparse

import requests

from ..lot_analysis import enrich_lot_price, parse_money
from ..models import Procurement
from . import Provider
from .rostender import RosTenderProvider

log = logging.getLogger(__name__)

DDG = "https://html.duckduckgo.com/html/"


class WebFreshProvider(Provider):
    """Ищет свежие закупки в интернете и обогащает карточками РосТендер/ЕИС-ссылками."""

    name = "web_fresh"

    def __init__(
        self,
        session: requests.Session | None = None,
        timeout: int = 25,
        year_hint: int | None = None,
    ) -> None:
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
        from datetime import datetime

        self.year_hint = year_hint or datetime.now().year
        self.rostender = RosTenderProvider(session=self.session, timeout=timeout)

    def search(self, query: str, *, limit: int = 25) -> list[Procurement]:
        q = f"{query} закупка тендер {self.year_hint}"
        hits = self._ddg(q, limit=max(limit, 10))
        rostender_urls = [h["url"] for h in hits if "rostender.info" in h["url"]]
        items = self.rostender.fetch_urls(rostender_urls[:limit], query=query)

        # Прямые ссылки ЕИС / агрегаторов — сохраняем и анализируем цену лота
        for hit in hits:
            url = hit["url"]
            if "rostender.info" in url:
                continue
            if not _looks_like_tender(url, hit["title"]):
                continue
            reg = _extract_reg(url, hit["title"])
            pid = f"web:{reg}" if reg else f"web:{abs(hash(url)) % 10**12}"
            customer = _guess_customer(hit["title"], query)
            price = parse_money(hit["title"]) or parse_money(hit.get("snippet") or "")
            meta: dict = dict(hit)
            # Не ходим на каталоги/категории — только карточки лотов
            if price is None and _is_lot_detail_url(url):
                price, price_meta = enrich_lot_price(
                    url, session=self.session, timeout=min(self.timeout, 15), title=hit["title"]
                )
                meta.update(price_meta)
            items.append(
                Procurement(
                    id=pid,
                    title=hit["title"][:400] or query,
                    source=self.name,
                    url=url,
                    customer=customer,
                    price=price,
                    published_at=str(self.year_hint),
                    status="active",
                    products=[hit["title"]],
                    query=query,
                    raw=meta,
                )
            )
            if len(items) >= limit:
                break

        # добираем цены для rostender-лотов без цены
        for item in items:
            if item.price is None and item.url and "rostender.info" in item.url:
                price, meta = enrich_lot_price(
                    item.url, session=self.session, timeout=min(self.timeout, 15), title=item.title
                )
                if price is not None:
                    item.price = price
                    item.raw.update(meta)
        return items[:limit]

    def _ddg(self, query: str, *, limit: int = 10) -> list[dict]:
        try:
            resp = self.session.post(DDG, data={"q": query}, timeout=self.timeout)
            resp.raise_for_status()
            html = resp.text
        except Exception as exc:  # noqa: BLE001
            log.warning("DuckDuckGo search failed for %r: %s", query, exc)
            return []

        out: list[dict] = []
        # пары ссылка + соседний сниппет
        blocks = re.split(r'class="result__body"|class="result results_links', html)
        for block in blocks:
            m = re.search(
                r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
                block,
                re.I | re.S,
            )
            if not m:
                continue
            href = unescape(m.group(1))
            title = re.sub(r"<[^>]+>", " ", unescape(m.group(2)))
            title = re.sub(r"\s+", " ", title).strip()
            url = _unwrap_ddg(href)
            if not url:
                continue
            sn = re.search(r'class="result__snippet"[^>]*>(.*?)</(?:a|td|div)', block, re.I | re.S)
            snippet = ""
            if sn:
                snippet = re.sub(r"<[^>]+>", " ", unescape(sn.group(1)))
                snippet = re.sub(r"\s+", " ", snippet).strip()
            out.append({"title": title, "url": url, "snippet": snippet})
            if len(out) >= limit:
                break
        if out:
            return out

        # fallback: только ссылки
        for m in re.finditer(
            r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
            html,
            re.I | re.S,
        ):
            href = unescape(m.group(1))
            title = re.sub(r"<[^>]+>", " ", unescape(m.group(2)))
            title = re.sub(r"\s+", " ", title).strip()
            url = _unwrap_ddg(href)
            if not url:
                continue
            out.append({"title": title, "url": url, "snippet": ""})
            if len(out) >= limit:
                break
        return out


def _unwrap_ddg(href: str) -> str:
    if "uddg=" in href:
        qs = parse_qs(urlparse(href).query)
        vals = qs.get("uddg") or []
        if vals:
            return unquote(vals[0])
    if href.startswith("http"):
        return href
    return ""


def _looks_like_tender(url: str, title: str) -> bool:
    blob = f"{url} {title}".lower()
    hosts = (
        "zakupki.gov.ru",
        "rostender.info",
        "tektorg.ru",
        "roseltorg.ru",
        "sberbank-ast.ru",
        "rts-tender.ru",
        "b2b-center.ru",
        "zakupki.kontur.ru",
        "synapsenet.ru",
        "nephroline.ru",
        "belyshkaf.ru",
        "fabrikant.ru",
        "lot-online.ru",
        "bicotender.ru",
        "bazazakazov.ru",
    )
    if any(h in blob for h in hosts):
        return True
    return any(
        k in blob
        for k in (
            "тендер",
            "закуп",
            "фильтр",
            "диализ",
            "ивл",
            "извещен",
            "нмц",
            "неfro",
            "нефролайн",
            "медси",
        )
    )


def _extract_reg(url: str, title: str) -> str:
    for src in (url, title):
        m = re.search(r"(?<!\d)(\d{18,25})(?!\d)", src)
        if m:
            return m.group(1)
        m = re.search(r"regNumber=(\d+)", src)
        if m:
            return m.group(1)
    return ""


def _guess_customer(title: str, query: str) -> str:
    blob = f"{title} {query}".lower()
    mapping = [
        ("нефролайн", "Сеть диализных центров «Нефролайн»"),
        ("медси", "АО «Группа компаний Медси»"),
        ("инвитро", "ООО «ИНВИТРО»"),
        ("invitro", "ООО «ИНВИТРО»"),
        ("fresenius", "Fresenius Medical Care / Нефросовет"),
        ("нефросовет", "Fresenius Medical Care / Нефросовет"),
        ("европейский медицинский", "АО «Европейский медицинский центр» (EMC)"),
        ("мать и дитя", "Сеть клиник «Мать и дитя»"),
        ("пирогов", "ГКБ №1 им. Н.И. Пирогова (Москва)"),
        ("алмазов", "НМИЦ им. В.А. Алмазова"),
    ]
    for key, name in mapping:
        if key in blob:
            return name
    return ""


def _is_lot_detail_url(url: str) -> bool:
    low = url.lower()
    if any(x in low for x in ("/category/", "/search", "/search-tender/", "tendery-filtr", "tendery-na-")):
        return False
    markers = (
        "/tender/",
        "/procedures/",
        "regnumber=",
        "-tender-",
        "/notice/",
        "/epz/order/",
        "/44-fz/procedures/",
        "/223-fz/",
    )
    return any(m in low for m in markers)
