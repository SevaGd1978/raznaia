"""Оркестратор одного цикла мониторинга."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from .buyers import (
    KNOWN_BUYERS,
    BuyerProfile,
    classify_customer,
    is_private_customer,
)
from .freshness import freshness_label
from .models import Procurement
from .notifiers import Notifier
from .providers import Provider
from .relevance import score_procurement
from .store import Store

log = logging.getLogger(__name__)


@dataclass
class MonitorConfig:
    queries: list[str]
    include_terms: list[str]
    medical_context: list[str]
    exclude_terms: list[str]
    min_score: int = 45
    per_query_limit: int = 25
    max_notify_per_run: int = 30
    max_age_days: int = 180
    private_queries: list[str] = field(default_factory=list)
    require_fresh_for_notify: bool = True


class MonitorAgent:
    def __init__(
        self,
        *,
        store: Store,
        providers: list[Provider],
        notifier: Notifier,
        config: MonitorConfig,
    ) -> None:
        self.store = store
        self.providers = providers
        self.notifier = notifier
        self.config = config

    def run_once(self, *, dry_run: bool = False, notify_existing: bool = False) -> dict[str, Any]:
        run_id = self.store.start_run()
        found: list[Procurement] = []
        new_items: list[Procurement] = []

        try:
            found = self._collect()
            for item in found:
                self.store.upsert(item)
                if notify_existing or self.store.needs_notification(item.id):
                    if self.config.require_fresh_for_notify and item.freshness == "historical":
                        # архив не спамим, но в БД/витрине он остаётся
                        self.store.mark_notified(item.id)
                        continue
                    new_items.append(item)

            uniq: dict[str, Procurement] = {}
            for item in new_items:
                prev = uniq.get(item.id)
                if prev is None or item.score > prev.score:
                    uniq[item.id] = item
            new_items = sorted(uniq.values(), key=lambda x: (-x.score, x.id))
            if len(new_items) > self.config.max_notify_per_run:
                log.info(
                    "Truncating notifications %s → %s",
                    len(new_items),
                    self.config.max_notify_per_run,
                )
                new_items = new_items[: self.config.max_notify_per_run]

            notified = 0
            if new_items:
                notified = self.notifier.send(new_items, dry_run=dry_run)
                for item in new_items:
                    self.store.mark_notified(item.id)

            buyers = self.build_buyer_profiles(found)
            private_items = [i for i in found if i.customer_kind == "private" or is_private_customer(i.customer)]
            fresh_items = [i for i in found if i.freshness in {"fresh", "recent", "unknown"}]

            self.store.finish_run(
                run_id,
                found=len(found),
                new_items=len(new_items),
                notified=notified,
            )
            return {
                "run_id": run_id,
                "found": len(found),
                "fresh": len(fresh_items),
                "private": len(private_items),
                "new": len(new_items),
                "notified": notified,
                "items": [i.to_dict() for i in new_items],
                "buyers": [b.to_dict() for b in buyers],
                "private_items": [i.to_dict() for i in private_items[:50]],
                "fresh_items": [i.to_dict() for i in fresh_items[:50]],
            }
        except Exception as exc:  # noqa: BLE001
            log.exception("Monitor run failed")
            self.store.finish_run(
                run_id,
                found=len(found),
                new_items=len(new_items),
                notified=0,
                error=str(exc),
            )
            raise

    def _collect(self) -> list[Procurement]:
        by_id: dict[str, Procurement] = {}
        queries = list(self.config.queries) + list(self.config.private_queries)
        # watch-запросы из справочника частных сетей
        for buyer in KNOWN_BUYERS:
            if buyer.get("kind") == "private":
                queries.extend(buyer.get("watch_queries") or [])
        # unique preserve order
        seen_q: set[str] = set()
        ordered_queries = []
        for q in queries:
            if q not in seen_q:
                seen_q.add(q)
                ordered_queries.append(q)

        for query in ordered_queries:
            for provider in self.providers:
                try:
                    results = provider.search(query, limit=self.config.per_query_limit)
                except Exception as exc:  # noqa: BLE001
                    log.warning("Provider %s failed on %r: %s", provider.name, query, exc)
                    continue
                for item in results:
                    item.query = query
                    item.customer_kind = classify_customer(item.customer)
                    item.freshness = freshness_label(item.published_at, max_age_days=self.config.max_age_days)
                    # ClearSpending часто отдаёт архив — помечаем и понижаем для алертов
                    if item.source == "clearspending" and item.freshness == "historical":
                        pass
                    elif item.source in {"web_fresh", "rostender", "zakupki_html", "damia"}:
                        if not item.published_at:
                            item.freshness = "fresh"
                    item.score = score_procurement(
                        item,
                        include_terms=self.config.include_terms,
                        medical_context=self.config.medical_context,
                        exclude_terms=self.config.exclude_terms,
                    )
                    # бонус за актуальность и частный сегмент
                    if item.freshness == "fresh":
                        item.score = min(100, item.score + 8)
                    if item.customer_kind == "private":
                        item.score = min(100, item.score + 5)
                    if item.score < self.config.min_score:
                        continue
                    prev = by_id.get(item.id)
                    if prev is None or item.score > prev.score:
                        by_id[item.id] = item
        return list(by_id.values())

    def build_buyer_profiles(self, items: list[Procurement] | None = None) -> list[BuyerProfile]:
        items = items if items is not None else []
        profiles: dict[str, BuyerProfile] = {}

        for known in KNOWN_BUYERS:
            key = (known.get("inn") or known["name"]).lower()
            profiles[key] = BuyerProfile(
                name=known["name"],
                kind=known.get("kind", "unknown"),
                inn=known.get("inn", ""),
                segment=known.get("segment", ""),
                note=known.get("note", ""),
                sources=list(known.get("sources") or []),
            )

        for item in items:
            name = (item.customer or "").strip()
            if not name:
                continue
            key = name.lower()
            # merge into known by substring / inn
            matched = None
            for k, prof in profiles.items():
                if prof.inn and prof.inn in (item.raw.get("inn") or ""):
                    matched = k
                    break
                if prof.name.lower()[:20] in key or key[:20] in prof.name.lower():
                    matched = k
                    break
            if matched is None:
                profiles[key] = BuyerProfile(
                    name=name,
                    kind=classify_customer(name),
                    segment="наблюдение по закупкам",
                )
                matched = key
            prof = profiles[matched]
            prof.hits += 1
            if item.price:
                prof.total_price += float(item.price)
            if item.published_at and (not prof.last_seen or item.published_at > prof.last_seen):
                prof.last_seen = item.published_at
            if item.title and item.title not in prof.sample_titles:
                prof.sample_titles.append(item.title[:180])
                prof.sample_titles = prof.sample_titles[:5]

        ranked = sorted(profiles.values(), key=lambda p: (-p.hits, -p.total_price, p.name))
        return ranked
