"""Фильтры актуальности дат закупок."""

from __future__ import annotations

import re
from datetime import datetime, timedelta


def parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    s = str(value).strip()
    for fmt in (
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d.%m.%Y %H:%M",
        "%d.%m.%Y",
        "%Y",
    ):
        try:
            return datetime.strptime(s[:19] if "T" in s or " " in s else s[:10] if fmt != "%Y" else s[:4], fmt)
        except ValueError:
            continue
    m = re.search(r"(20\d{2})", s)
    if m:
        try:
            return datetime(int(m.group(1)), 1, 1)
        except ValueError:
            return None
    return None


def is_fresh(value: str | None, *, max_age_days: int, now: datetime | None = None) -> bool:
    """True если дата свежая или неизвестна у live-источников (пусть решают score/source)."""
    dt = parse_date(value)
    if dt is None:
        return True
    now = now or datetime.now()
    # даты без времени считаем концом дня
    return dt >= now - timedelta(days=max_age_days)


def freshness_label(value: str | None, *, max_age_days: int = 180) -> str:
    dt = parse_date(value)
    if dt is None:
        return "unknown"
    age = (datetime.now() - dt).days
    if age <= max_age_days:
        return "fresh"
    if age <= 365:
        return "recent"
    return "historical"
