"""SQLite-хранилище увиденных закупок."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .models import Procurement


class Store:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(self.path)
        self._conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        self._conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS procurements (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                source TEXT NOT NULL,
                url TEXT,
                customer TEXT,
                region TEXT,
                price REAL,
                currency TEXT,
                published_at TEXT,
                law TEXT,
                status TEXT,
                products_json TEXT,
                okpd2_json TEXT,
                query TEXT,
                score INTEGER,
                customer_kind TEXT DEFAULT 'unknown',
                freshness TEXT DEFAULT 'unknown',
                first_seen_at TEXT NOT NULL,
                last_seen_at TEXT NOT NULL,
                notified INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at TEXT NOT NULL,
                finished_at TEXT,
                found INTEGER DEFAULT 0,
                new_items INTEGER DEFAULT 0,
                notified INTEGER DEFAULT 0,
                error TEXT
            );
            """
        )
        cols = {r[1] for r in self._conn.execute("PRAGMA table_info(procurements)").fetchall()}
        if "customer_kind" not in cols:
            self._conn.execute(
                "ALTER TABLE procurements ADD COLUMN customer_kind TEXT DEFAULT 'unknown'"
            )
        if "freshness" not in cols:
            self._conn.execute(
                "ALTER TABLE procurements ADD COLUMN freshness TEXT DEFAULT 'unknown'"
            )
        self._conn.commit()

    def close(self) -> None:
        self._conn.close()

    def start_run(self) -> int:
        cur = self._conn.execute(
            "INSERT INTO runs (started_at) VALUES (?)",
            (_utcnow(),),
        )
        self._conn.commit()
        return int(cur.lastrowid)

    def finish_run(
        self,
        run_id: int,
        *,
        found: int,
        new_items: int,
        notified: int,
        error: str | None = None,
    ) -> None:
        self._conn.execute(
            """
            UPDATE runs
            SET finished_at = ?, found = ?, new_items = ?, notified = ?, error = ?
            WHERE id = ?
            """,
            (_utcnow(), found, new_items, notified, error, run_id),
        )
        self._conn.commit()

    def upsert(self, item: Procurement) -> bool:
        """Возвращает True, если запись новая."""
        now = _utcnow()
        existing = self._conn.execute(
            "SELECT id, notified FROM procurements WHERE id = ?",
            (item.id,),
        ).fetchone()
        if existing:
            self._conn.execute(
                """
                UPDATE procurements
                SET title = ?, source = ?, url = ?, customer = ?, region = ?,
                    price = ?, currency = ?, published_at = ?, law = ?, status = ?,
                    products_json = ?, okpd2_json = ?, query = ?, score = ?,
                    customer_kind = ?, freshness = ?, last_seen_at = ?
                WHERE id = ?
                """,
                (
                    item.title,
                    item.source,
                    item.url,
                    item.customer,
                    item.region,
                    item.price,
                    item.currency,
                    item.published_at,
                    item.law,
                    item.status,
                    json.dumps(item.products, ensure_ascii=False),
                    json.dumps(item.okpd2, ensure_ascii=False),
                    item.query,
                    item.score,
                    item.customer_kind,
                    item.freshness,
                    now,
                    item.id,
                ),
            )
            self._conn.commit()
            return False

        self._conn.execute(
            """
            INSERT INTO procurements (
                id, title, source, url, customer, region, price, currency,
                published_at, law, status, products_json, okpd2_json, query,
                score, customer_kind, freshness, first_seen_at, last_seen_at, notified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """,
            (
                item.id,
                item.title,
                item.source,
                item.url,
                item.customer,
                item.region,
                item.price,
                item.currency,
                item.published_at,
                item.law,
                item.status,
                json.dumps(item.products, ensure_ascii=False),
                json.dumps(item.okpd2, ensure_ascii=False),
                item.query,
                item.score,
                item.customer_kind,
                item.freshness,
                now,
                now,
            ),
        )
        self._conn.commit()
        return True

    def needs_notification(self, item_id: str) -> bool:
        row = self._conn.execute(
            "SELECT notified FROM procurements WHERE id = ?",
            (item_id,),
        ).fetchone()
        return bool(row) and int(row["notified"]) == 0

    def mark_notified(self, item_id: str) -> None:
        self._conn.execute(
            "UPDATE procurements SET notified = 1 WHERE id = ?",
            (item_id,),
        )
        self._conn.commit()

    def recent(self, limit: int = 20, *, fresh_only: bool = False) -> list[dict]:
        if fresh_only:
            rows = self._conn.execute(
                """
                SELECT id, title, customer, price, published_at, url, score, source,
                       first_seen_at, customer_kind, freshness, law
                FROM procurements
                WHERE freshness IN ('fresh', 'recent', 'unknown')
                   OR source IN ('web_fresh', 'rostender', 'zakupki_html', 'damia')
                ORDER BY first_seen_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        else:
            rows = self._conn.execute(
                """
                SELECT id, title, customer, price, published_at, url, score, source,
                       first_seen_at, customer_kind, freshness, law
                FROM procurements
                ORDER BY first_seen_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def private_recent(self, limit: int = 50) -> list[dict]:
        rows = self._conn.execute(
            """
            SELECT id, title, customer, price, published_at, url, score, source,
                   first_seen_at, customer_kind, freshness, law
            FROM procurements
            WHERE customer_kind = 'private'
               OR lower(customer) LIKE '%ооо%'
               OR lower(customer) LIKE 'ао %'
               OR lower(customer) LIKE '%акционерн%'
            ORDER BY first_seen_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()
