"""Оркестратор одного цикла мониторинга."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

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
        error: str | None = None
        found: list[Procurement] = []
        new_items: list[Procurement] = []

        try:
            found = self._collect()
            for item in found:
                self.store.upsert(item)
                if notify_existing or self.store.needs_notification(item.id):
                    new_items.append(item)

            # Дедуп по id внутри батча
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
                # Остальные уже в БД; в следующих циклах не придут как new
                new_items = new_items[: self.config.max_notify_per_run]

            notified = 0
            if new_items:
                notified = self.notifier.send(new_items, dry_run=dry_run)
                for item in new_items:
                    self.store.mark_notified(item.id)

            self.store.finish_run(
                run_id,
                found=len(found),
                new_items=len(new_items),
                notified=notified,
            )
            return {
                "run_id": run_id,
                "found": len(found),
                "new": len(new_items),
                "notified": notified,
                "items": [i.to_dict() for i in new_items],
            }
        except Exception as exc:  # noqa: BLE001
            error = str(exc)
            log.exception("Monitor run failed")
            self.store.finish_run(
                run_id,
                found=len(found),
                new_items=len(new_items),
                notified=0,
                error=error,
            )
            raise

    def _collect(self) -> list[Procurement]:
        by_id: dict[str, Procurement] = {}
        for query in self.config.queries:
            for provider in self.providers:
                try:
                    results = provider.search(query, limit=self.config.per_query_limit)
                except Exception as exc:  # noqa: BLE001
                    log.warning("Provider %s failed on %r: %s", provider.name, query, exc)
                    continue
                for item in results:
                    item.query = query
                    item.score = score_procurement(
                        item,
                        include_terms=self.config.include_terms,
                        medical_context=self.config.medical_context,
                        exclude_terms=self.config.exclude_terms,
                    )
                    if item.score < self.config.min_score:
                        continue
                    prev = by_id.get(item.id)
                    if prev is None or item.score > prev.score:
                        by_id[item.id] = item
        return list(by_id.values())
