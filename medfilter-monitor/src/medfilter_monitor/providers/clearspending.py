"""Провайдер ClearSpending (контракты ЕИС через openapi.clearspending.ru)."""

from __future__ import annotations

import logging
from typing import Any

import requests

from ..models import Procurement
from . import Provider

log = logging.getLogger(__name__)

BASE = "https://openapi.clearspending.ru/restapi/v3"


class ClearSpendingProvider(Provider):
    name = "clearspending"

    def __init__(self, session: requests.Session | None = None, timeout: int = 40) -> None:
        self.session = session or requests.Session()
        self.session.headers.setdefault(
            "User-Agent",
            "medfilter-monitor/1.0 (+https://github.com/SevaGd1978/raznaia)",
        )
        self.session.headers.setdefault("Accept", "application/json")
        self.timeout = timeout

    def search(self, query: str, *, limit: int = 25) -> list[Procurement]:
        params = {
            "productsearch": query,
            "perpage": min(limit, 50),
            "page": 1,
            "sort": "-signDate",
        }
        url = f"{BASE}/contracts/search/"
        try:
            resp = self.session.get(url, params=params, timeout=self.timeout)
            resp.raise_for_status()
            payload = resp.json()
        except Exception as exc:  # noqa: BLE001 — собираем мягкие ошибки провайдера
            log.warning("ClearSpending search failed for %r: %s", query, exc)
            return []

        contracts = (payload.get("contracts") or {}).get("data") or []
        items: list[Procurement] = []
        for raw in contracts:
            item = self._map(raw, query)
            if item:
                items.append(item)
        return items

    def _map(self, raw: dict[str, Any], query: str) -> Procurement | None:
        reg = str(raw.get("regNum") or raw.get("regnum") or "").strip()
        if not reg:
            return None
        products = []
        for p in raw.get("products") or []:
            name = (p.get("name") or "").strip()
            if name:
                products.append(name)

        okpd2: list[str] = []
        for p in raw.get("products") or []:
            for key in ("OKPD2", "okpd2", "OKPD", "okpd"):
                val = p.get(key)
                if isinstance(val, dict):
                    code = val.get("code") or val.get("Code")
                    if code:
                        okpd2.append(str(code))
                elif isinstance(val, str) and val:
                    okpd2.append(val)

        customer = raw.get("customer") or {}
        customer_name = customer.get("fullName") or customer.get("shortName") or ""
        price = raw.get("price")
        try:
            price_f = float(price) if price is not None else None
        except (TypeError, ValueError):
            price_f = None

        url = raw.get("contractUrl") or (
            f"https://zakupki.gov.ru/epz/contract/contractCard/common-info.html?reestrNumber={reg}"
        )
        title = _best_title(products, query) or f"Контракт {reg}"
        return Procurement(
            id=f"cs:{reg}",
            title=title,
            source=self.name,
            url=url,
            customer=customer_name,
            region="",
            price=price_f,
            currency=(raw.get("currency") or {}).get("code") or "RUB",
            published_at=str(raw.get("signDate") or raw.get("publishDate") or ""),
            law=str(raw.get("fz") or ""),
            status=str(raw.get("currentContractStage") or ""),
            products=products,
            okpd2=sorted(set(okpd2)),
            query=query,
            raw=raw,
        )


def _best_title(products: list[str], query: str) -> str:
    if not products:
        return ""
    markers = (
        "фильтр",
        "диализатор",
        "тепло/влагообменник",
        "hme",
        "hepa",
        "бактериальн",
    )
    q = (query or "").lower()
    ranked = sorted(
        products,
        key=lambda name: (
            sum(1 for m in markers if m in name.lower()),
            1 if q and any(tok in name.lower() for tok in q.split() if len(tok) > 3) else 0,
            -len(name),
        ),
        reverse=True,
    )
    return ranked[0][:300]
