"""CLI агента мониторинга закупок фильтров для медтехники."""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path

import yaml
from dotenv import load_dotenv

from .agent import MonitorAgent, MonitorConfig
from .notifiers import ConsoleNotifier, MultiNotifier, TelegramNotifier
from .providers.clearspending import ClearSpendingProvider
from .providers.damia import DamiaProvider
from .providers.web_fresh import WebFreshProvider
from .providers.zakupki_html import ZakupkiHtmlProvider
from .store import Store

log = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = ROOT / "config" / "queries.yaml"
DEFAULT_DB = ROOT / "data" / "procurements.db"


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    parser = argparse.ArgumentParser(
        prog="medfilter-monitor",
        description="Мониторинг закупок фильтров для медицинского оборудования в РФ",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    run_p = sub.add_parser("run", help="Один цикл проверки")
    _add_common(run_p)
    run_p.add_argument("--dry-run", action="store_true", help="Не слать Telegram, только печать")
    run_p.add_argument(
        "--notify-existing",
        action="store_true",
        help="Уведомить и по уже известным записям (для теста)",
    )

    daemon_p = sub.add_parser("daemon", help="Непрерывный мониторинг")
    _add_common(daemon_p)
    daemon_p.add_argument(
        "--interval",
        type=int,
        default=int(os.getenv("MONITOR_INTERVAL_SEC", "3600")),
        help="Интервал между циклами, сек (по умолчанию 3600)",
    )
    daemon_p.add_argument("--dry-run", action="store_true")

    recent_p = sub.add_parser("recent", help="Показать последние найденные закупки")
    recent_p.add_argument("-v", "--verbose", action="store_true")
    recent_p.add_argument("--db", type=Path, default=DEFAULT_DB)
    recent_p.add_argument("--limit", type=int, default=20)

    export_p = sub.add_parser("export-site", help="Собрать публичную HTML-витрину")
    export_p.add_argument("-v", "--verbose", action="store_true")
    export_p.add_argument("--db", type=Path, default=DEFAULT_DB)
    export_p.add_argument("--out", type=Path, default=ROOT / "public")
    export_p.add_argument("--limit", type=int, default=100)
    export_p.add_argument(
        "--single-file",
        action="store_true",
        help="Встроить JSON в HTML (удобно для ZeroDeploy Drop)",
    )

    args = parser.parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if getattr(args, "verbose", False) else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    if args.cmd == "recent":
        store = Store(args.db)
        print(json.dumps(store.recent(args.limit), ensure_ascii=False, indent=2))
        store.close()
        return 0

    if args.cmd == "export-site":
        from .agent import MonitorAgent
        from .site import export_site

        store = Store(args.db)
        # если есть данные в БД — считаем профили покупателей по ним
        from .models import Procurement

        recent = store.recent(300)
        items = [
            Procurement(
                id=r["id"],
                title=r.get("title") or "",
                source=r.get("source") or "",
                url=r.get("url") or "",
                customer=r.get("customer") or "",
                price=r.get("price"),
                published_at=r.get("published_at") or "",
                customer_kind=r.get("customer_kind") or "unknown",
                freshness=r.get("freshness") or "unknown",
                score=int(r.get("score") or 0),
            )
            for r in recent
        ]
        # минимальный agent только для профилей
        agent = MonitorAgent(
            store=store,
            providers=[],
            notifier=ConsoleNotifier(),
            config=MonitorConfig(
                queries=[],
                include_terms=[],
                medical_context=[],
                exclude_terms=[],
            ),
        )
        buyers = [b.to_dict() for b in agent.build_buyer_profiles(items)]
        out = export_site(
            store,
            args.out,
            limit=args.limit,
            single_file=args.single_file,
            buyers=buyers,
        )
        store.close()
        print(json.dumps({"out": str(out), "buyers": len(buyers)}, ensure_ascii=False))
        return 0

    agent = _build_agent(args)
    try:
        if args.cmd == "run":
            result = agent.run_once(dry_run=args.dry_run, notify_existing=args.notify_existing)
            summary = {
                k: v
                for k, v in result.items()
                if k not in {"items", "buyers", "private_items", "fresh_items"}
            }
            print(json.dumps(summary, ensure_ascii=False, indent=2))
            if args.dry_run or args.verbose:
                print(json.dumps({
                    "fresh_items": result.get("fresh_items", [])[:20],
                    "private_items": result.get("private_items", [])[:20],
                    "buyers": result.get("buyers", [])[:15],
                    "new_items": result.get("items", [])[:20],
                }, ensure_ascii=False, indent=2))
            return 0

        if args.cmd == "daemon":
            log.info("Daemon started, interval=%ss", args.interval)
            while True:
                try:
                    result = agent.run_once(dry_run=args.dry_run)
                    log.info(
                        "Cycle done: found=%s new=%s notified=%s",
                        result["found"],
                        result["new"],
                        result["notified"],
                    )
                except Exception:  # noqa: BLE001
                    log.exception("Cycle failed; will retry")
                time.sleep(max(60, args.interval))
    finally:
        agent.store.close()
    return 0

def _add_common(p: argparse.ArgumentParser) -> None:
    p.add_argument("-v", "--verbose", action="store_true")
    p.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    p.add_argument("--db", type=Path, default=Path(os.getenv("MONITOR_DB", str(DEFAULT_DB))))
    p.add_argument(
        "--providers",
        default=os.getenv(
            "MONITOR_PROVIDERS",
            "web_fresh,clearspending,zakupki_html,damia",
        ),
        help="Список провайдеров через запятую",
    )


def _build_agent(args: argparse.Namespace) -> MonitorAgent:
    cfg_raw = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    config = MonitorConfig(
        queries=list(cfg_raw.get("queries") or []),
        include_terms=list(cfg_raw.get("include_terms") or []),
        medical_context=list(cfg_raw.get("medical_context") or []),
        exclude_terms=list(cfg_raw.get("exclude_terms") or []),
        min_score=int(cfg_raw.get("min_score", 45)),
        per_query_limit=int(cfg_raw.get("per_query_limit", 25)),
        max_notify_per_run=int(cfg_raw.get("max_notify_per_run", 30)),
        max_age_days=int(cfg_raw.get("max_age_days", 200)),
        private_queries=list(cfg_raw.get("private_queries") or []),
        require_fresh_for_notify=bool(cfg_raw.get("require_fresh_for_notify", True)),
    )

    wanted = {x.strip() for x in str(args.providers).split(",") if x.strip()}
    providers = []
    if "web_fresh" in wanted:
        providers.append(WebFreshProvider())
    if "clearspending" in wanted:
        providers.append(ClearSpendingProvider())
    if "zakupki_html" in wanted:
        providers.append(ZakupkiHtmlProvider())
    if "damia" in wanted:
        key = os.getenv("DAMIA_API_KEY", "").strip()
        if key:
            providers.append(DamiaProvider(key, laws=list(cfg_raw.get("laws") or [44, 223])))
        else:
            log.info("Damia skipped: DAMIA_API_KEY not set")

    if not providers:
        raise SystemExit("No providers configured")

    notifiers: list = []
    tg_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    tg_chat = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if tg_token and tg_chat:
        notifiers.append(TelegramNotifier(tg_token, tg_chat))
    else:
        log.info("Telegram disabled: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID")
        notifiers.append(ConsoleNotifier())
    # В verbose всегда дублируем краткий вывод в консоль
    if getattr(args, "verbose", False) and not any(isinstance(n, ConsoleNotifier) for n in notifiers):
        notifiers.insert(0, ConsoleNotifier())

    return MonitorAgent(
        store=Store(args.db),
        providers=providers,
        notifier=MultiNotifier(notifiers),
        config=config,
    )


if __name__ == "__main__":
    sys.exit(main())
