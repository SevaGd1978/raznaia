"""Модели данных агента мониторинга закупок."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(slots=True)
class Procurement:
    """Унифицированная запись о закупке / контракте."""

    id: str
    title: str
    source: str
    url: str = ""
    customer: str = ""
    region: str = ""
    price: float | None = None
    currency: str = "RUB"
    published_at: str = ""
    law: str = ""
    status: str = ""
    products: list[str] = field(default_factory=list)
    okpd2: list[str] = field(default_factory=list)
    query: str = ""
    score: int = 0
    customer_kind: str = "unknown"  # state | private | unknown
    freshness: str = "unknown"  # fresh | recent | historical | unknown
    raw: dict[str, Any] = field(default_factory=dict, repr=False)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data.pop("raw", None)
        return data

    def short_summary(self) -> str:
        price = f"{self.price:,.0f} {self.currency}".replace(",", " ") if self.price is not None else "н/д"
        products = "; ".join(self.products[:3]) if self.products else self.title
        return (
            f"#{self.id}\n"
            f"{products}\n"
            f"Заказчик: {self.customer or 'н/д'}\n"
            f"Цена: {price}\n"
            f"Дата: {self.published_at or 'н/д'}\n"
            f"Источник: {self.source} | score={self.score}\n"
            f"{self.url}"
        )
