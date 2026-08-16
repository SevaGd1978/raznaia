"""Классификация заказчиков и справочник постоянных покупателей фильтров."""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field


STATE_MARKERS = (
    "государственн",
    "бюджетн",
    "казенн",
    "муниципальн",
    "фгбу",
    "фгбоу",
    "гбуз",
    "гбу",
    "гауз",
    "мку",
    "мбуз",
    "минздрав",
    "фмба",
    "министерств",
)

PRIVATE_MARKERS = (
    "ооо ",
    "ооо«",
    "ооо\"",
    " акционерн",
    "ао ",
    "ао«",
    "пао ",
    "зао ",
    "общество с ограниченной",
    "частн",
    "клиника ",
    "медицинский центр",
)


# Постоянные / крупные потребители медицинских фильтров (гос + частные сети).
# Собранно из открытых источников: ЕИС/агрегаторы закупок, сайты сетей диализа и клиник.
KNOWN_BUYERS: list[dict] = [
    {
        "name": "ГКБ №1 им. Н.И. Пирогова (Москва)",
        "inn": "7705034715",
        "kind": "state",
        "segment": "диализ / ИВЛ",
        "note": "Регулярные аукционы на высокопоточные диализаторы и расходники гемодиализа.",
        "sources": ["https://www.tenderguru.ru/", "ЕИС"],
    },
    {
        "name": "НМИЦ им. В.А. Алмазова",
        "inn": "7802030429",
        "kind": "state",
        "segment": "диализ / реанимация",
        "note": "Федеральный центр; закупки диализных расходников и фильтров к аппаратам ИВЛ.",
        "sources": ["ЕИС", "zakupkipro"],
    },
    {
        "name": "Свердловская ОКБ №1",
        "inn": "6658081585",
        "kind": "state",
        "segment": "диализ",
        "note": "Крупные 223-ФЗ закупки диализаторов на 2026–2027 гг.",
        "sources": ["ЕИС"],
    },
    {
        "name": "Клиническая больница №50 ФМБА (Саров)",
        "inn": "5254002113",
        "kind": "state",
        "segment": "ИВЛ",
        "note": "Закупки бактериальных фильтров для аппаратов ИВЛ.",
        "sources": ["РосТендер", "ЕИС"],
    },
    {
        "name": "Морозовская ДГКБ (Москва)",
        "inn": "7705031309",
        "kind": "state",
        "segment": "ИВЛ / дыхательные контуры",
        "note": "Детский стационар; фильтры к увлажнителям и ИВЛ.",
        "sources": ["ЕИС / ClearSpending"],
    },
    {
        "name": "Сеть диализных центров «Нефролайн»",
        "inn": "",
        "kind": "private",
        "segment": "гемодиализ",
        "note": "Крупная частная сеть гемодиализа; расходники и диализаторы закупает централизованно.",
        "sources": ["https://nephroline.ru/"],
        "watch_queries": ["Нефролайн диализатор", "Нефролайн закупка"],
    },
    {
        "name": "Fresenius Medical Care / Нефросовет (оператор диализа)",
        "inn": "",
        "kind": "private",
        "segment": "гемодиализ",
        "note": "Частный оператор диализных центров и поставщик расходников Fresenius.",
        "sources": ["открытые тендеры / отраслевые обзоры"],
        "watch_queries": ["Fresenius Medical Care закупка", "Нефросовет диализатор"],
    },
    {
        "name": "АО «Б. Браун Медикал» / диализные центры B.Braun",
        "inn": "",
        "kind": "private",
        "segment": "гемодиализ",
        "note": "Частные диализные центры и поставки диализаторов Avium/Dialog.",
        "sources": ["отраслевые сайты"],
        "watch_queries": ["B.Braun диализатор закупка", "Б Браун диализ тендер"],
    },
    {
        "name": "АО «Группа компаний Медси»",
        "inn": "7710641441",
        "kind": "private",
        "segment": "частные клиники / ИВЛ",
        "note": "Сеть частных клиник; коммерческие и 223-ФЗ закупки расходников.",
        "sources": ["ЕИС / B2B"],
        "watch_queries": ["Медси фильтр дыхательный", "Медси бактериальный фильтр"],
    },
    {
        "name": "АО «Европейский медицинский центр» (EMC)",
        "inn": "",
        "kind": "private",
        "segment": "частные клиники",
        "note": "Частный многопрофильный центр; закупки расходников через коммерческие процедуры.",
        "sources": ["открытые источники"],
        "watch_queries": ["Европейский медицинский центр фильтр", "EMC закупка ИВЛ"],
    },
    {
        "name": "ООО «ИНВИТРО»",
        "inn": "7714047395",
        "kind": "private",
        "segment": "лаборатории / расходники",
        "note": "Крупная частная лабораторная сеть; фильтры и расходные материалы.",
        "sources": ["ЕИС / коммерческие ЭТП"],
        "watch_queries": ["ИНВИТРО закупка фильтр", "INVITRO тендер"],
    },
    {
        "name": "Сеть клиник «Мать и дитя»",
        "inn": "",
        "kind": "private",
        "segment": "частные клиники / неонатология",
        "note": "Частная сеть; дыхательные контуры и фильтры для реанимации/неонатологии.",
        "sources": ["открытые источники"],
        "watch_queries": ["Мать и дитя фильтр дыхательный", "MD Medical Group фильтр"],
    },
]


@dataclass
class BuyerProfile:
    name: str
    kind: str  # state | private | unknown
    inn: str = ""
    segment: str = ""
    note: str = ""
    sources: list[str] = field(default_factory=list)
    hits: int = 0
    total_price: float = 0.0
    last_seen: str = ""
    sample_titles: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


def classify_customer(name: str) -> str:
    low = f" {(name or '').lower()} "
    if any(m in low for m in STATE_MARKERS):
        return "state"
    if any(m in low for m in PRIVATE_MARKERS):
        return "private"
    # ООО/АО в начале
    if re.match(r"^\s*(ооо|ао|пао|зао)\b", low.strip(), re.I):
        return "private"
    return "unknown"


def is_private_customer(name: str) -> bool:
    return classify_customer(name) == "private"
