import json
from pathlib import Path

from medfilter_monitor.agent import MonitorAgent, MonitorConfig
from medfilter_monitor.models import Procurement
from medfilter_monitor.notifiers import ConsoleNotifier
from medfilter_monitor.providers import Provider
from medfilter_monitor.store import Store


class FakeProvider(Provider):
    name = "fake"

    def __init__(self, items: list[Procurement]):
        self.items = items

    def search(self, query: str, *, limit: int = 25) -> list[Procurement]:
        return list(self.items)


def test_agent_dedup_and_notify(tmp_path: Path):
    db = tmp_path / "t.db"
    store = Store(db)
    item = Procurement(
        id="eis:1",
        title="Бактериальный фильтр для аппарата ИВЛ",
        source="fake",
        customer="ГБУЗ Клиника",
        products=["бактериальный фильтр дыхательный"],
        url="https://example.test/1",
    )
    agent = MonitorAgent(
        store=store,
        providers=[FakeProvider([item])],
        notifier=ConsoleNotifier(),
        config=MonitorConfig(
            queries=["фильтр дыхательный"],
            include_terms=["фильтр", "бактериальн", "дыхательн", "ивл"],
            medical_context=["медицин", "гбуз", "клиник", "ивл"],
            exclude_terms=["маслян"],
            min_score=30,
        ),
    )
    r1 = agent.run_once(dry_run=True)
    assert r1["new"] == 1
    r2 = agent.run_once(dry_run=True)
    assert r2["new"] == 0
    recent = store.recent()
    assert recent[0]["id"] == "eis:1"
    store.close()


def test_clearspending_mapper_smoke():
    from medfilter_monitor.providers.clearspending import ClearSpendingProvider

    raw = {
        "regNum": "123",
        "price": 1500,
        "signDate": "2024-06-01T00:00:00",
        "customer": {"fullName": "ГБУЗ Тест"},
        "currency": {"code": "RUB"},
        "products": [{"name": "Диализатор для гемодиализа", "OKPD2": {"code": "32.50.21"}}],
        "contractUrl": "https://example.test",
    }
    p = ClearSpendingProvider()
    item = p._map(raw, "диализатор")
    assert item is not None
    assert item.id == "cs:123"
    assert "Диализатор" in item.title
    assert "32.50.21" in item.okpd2
