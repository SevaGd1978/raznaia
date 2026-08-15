"""Провайдер DaMIA API-Закупки (требует DAMIA_API_KEY)."""

from __future__ import annotations

import logging
from typing import Any

import requests

from ..models import Procurement
from . import Provider

log = logging.getLogger(__name__)

BASE = "https://api.damia.ru/zakupki"


class DamiaProvider(Provider):
    name = "damia"

    def __init__(
        self,
        api_key: str,
        session: requests.Session | None = None,
        timeout: int = 40,
        laws: list[int] | None = None,
    ) -> None:
        if not api_key:
            raise ValueError("DAMIA_API_KEY is required")
        self.api_key = api_key
        self.laws = laws or [44, 223]
        self.session = session or requests.Session()
        self.timeout = timeout

    def search(self, query: str, *, limit: int = 25) -> list[Procurement]:
        items: list[Procurement] = []
        for law in self.laws:
            params = {
                "q": query,
                "fz": law,
                "page": 1,
                "format": 2,
                "key": self.api_key,
            }
            url = f"{BASE}/zsearch"
            try:
                resp = self.session.get(url, params=params, timeout=self.timeout)
                resp.raise_for_status()
                payload = resp.json()
            except Exception as exc:  # noqa: BLE001
                log.warning("Damia search failed for %r fz=%s: %s", query, law, exc)
                continue

            if isinstance(payload, str):
                log.warning("Damia error: %s", payload)
                continue

            rows = self._extract_rows(payload)
            for raw in rows[:limit]:
                item = self._map(raw, query, law)
                if item:
                    items.append(item)
        return items

    def _extract_rows(self, payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, list):
            return [x for x in payload if isinstance(x, dict)]
        if isinstance(payload, dict):
            for key in ("data", "items", "result", "zakupki", "list"):
                val = payload.get(key)
                if isinstance(val, list):
                    return [x for x in val if isinstance(x, dict)]
                if isinstance(val, dict):
                    # grouped by year / id
                    rows: list[dict[str, Any]] = []
                    for nested in val.values():
                        if isinstance(nested, list):
                            rows.extend(x for x in nested if isinstance(x, dict))
                        elif isinstance(nested, dict):
                            rows.append(nested)
                    if rows:
                        return rows
            # flat object keyed by reg numbers
            if all(isinstance(v, dict) for v in payload.values()):
                return list(payload.values())
        return []

    def _map(self, raw: dict[str, Any], query: str, law: int) -> Procurement | None:
        reg = str(
            raw.get("regn")
            or raw.get("regNum")
            or raw.get("notificationNumber")
            or raw.get("id")
            or ""
        ).strip()
        if not reg:
            return None
        title = str(raw.get("object") or raw.get("title") or raw.get("name") or f"Закупка {reg}")
        price = raw.get("price") or raw.get("maxPrice") or raw.get("nmck")
        try:
            price_f = float(price) if price is not None else None
        except (TypeError, ValueError):
            price_f = None
        url = raw.get("url") or (
            f"https://zakupki.gov.ru/epz/order/notice/view/common-info.html?regNumber={reg}"
        )
        return Procurement(
            id=f"damia:{reg}",
            title=title,
            source=self.name,
            url=url,
            customer=str(raw.get("customer") or raw.get("customerName") or ""),
            region=str(raw.get("region") or ""),
            price=price_f,
            published_at=str(raw.get("date") or raw.get("publishDate") or ""),
            law=str(law),
            status=str(raw.get("status") or ""),
            products=[title],
            query=query,
            raw=raw,
        )
