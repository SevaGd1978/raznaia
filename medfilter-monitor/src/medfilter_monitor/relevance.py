"""Оценка релевантности закупки фильтрам для медтехники."""

from __future__ import annotations

from .models import Procurement


def score_procurement(
    item: Procurement,
    *,
    include_terms: list[str],
    medical_context: list[str],
    exclude_terms: list[str],
) -> int:
    blob = " ".join(
        [
            item.title or "",
            item.customer or "",
            " ".join(item.products),
            " ".join(item.okpd2),
            item.query or "",
        ]
    ).lower()

    for term in exclude_terms:
        if term.lower() in blob:
            return 0

    score = 0
    hits = sum(1 for t in include_terms if t.lower() in blob)
    score += min(55, hits * 18)

    med = sum(1 for t in medical_context if t.lower() in blob)
    score += min(35, med * 12)

    # Бонус за явные «медицинские фильтры»
    strong = (
        "бактериальн" in blob
        or "диализатор" in blob
        or "hme" in blob
        or ("фильтр" in blob and ("ивл" in blob or "дыхательн" in blob or "гемодиализ" in blob))
    )
    if strong:
        score += 20

    if any(code.startswith("32.50") for code in item.okpd2):
        score += 10

    return max(0, min(100, score))
