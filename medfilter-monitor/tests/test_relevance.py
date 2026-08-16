from medfilter_monitor.models import Procurement
from medfilter_monitor.relevance import score_procurement


CFG = {
    "include_terms": [
        "фильтр",
        "диализатор",
        "бактериальн",
        "дыхательн",
        "ивл",
        "гемодиализ",
        "hme",
    ],
    "medical_context": ["медицин", "здравоохран", "больниц", "ивл", "диализ"],
    "exclude_terms": ["автомобил", "маслян", "топливн"],
}


def test_score_medical_breathing_filter_high():
    item = Procurement(
        id="1",
        title="Тепло/влагообменник/бактериальный фильтр для ИВЛ",
        source="test",
        customer="ГБУЗ Городская больница",
        products=["бактериальный фильтр дыхательный"],
    )
    score = score_procurement(item, **CFG)
    assert score >= 45


def test_score_excludes_car_oil_filter():
    item = Procurement(
        id="2",
        title="Фильтр масляный автомобильный",
        source="test",
        products=["фильтр масляный"],
    )
    assert score_procurement(item, **CFG) == 0


def test_procurement_summary_contains_id():
    item = Procurement(id="cs:123", title="Диализатор", source="t", price=1000)
    text = item.short_summary()
    assert "cs:123" in text
    assert "1 000" in text or "1000" in text
