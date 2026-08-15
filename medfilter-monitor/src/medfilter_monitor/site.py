"""Экспорт публичной витрины мониторинга."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from html import escape
from pathlib import Path

from .store import Store


def export_site(store: Store, out_dir: str | Path, *, limit: int = 100) -> Path:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    items = store.recent(limit)
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    payload = {
        "generated_at": generated_at,
        "count": len(items),
        "items": items,
    }
    (out / "data.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (out / "index.html").write_text(_render_html(payload), encoding="utf-8")
    return out


def _render_html(payload: dict) -> str:
    rows = []
    for item in payload.get("items") or []:
        price = item.get("price")
        price_s = f"{price:,.0f} ₽".replace(",", " ") if isinstance(price, (int, float)) else "—"
        url = item.get("url") or "#"
        rows.append(
            f"""
            <article class="card">
              <a class="title" href="{escape(url)}" target="_blank" rel="noopener noreferrer">
                {escape(str(item.get("title") or "Без названия"))}
              </a>
              <p class="customer">{escape(str(item.get("customer") or "Заказчик не указан"))}</p>
              <div class="meta">
                <span>{escape(price_s)}</span>
                <span>{escape(str(item.get("published_at") or "—")[:10])}</span>
                <span>score {escape(str(item.get("score") or "—"))}</span>
                <span>{escape(str(item.get("source") or ""))}</span>
              </div>
            </article>
            """
        )

    body = "\n".join(rows) if rows else '<p class="empty">Пока нет данных. Дождитесь следующего цикла мониторинга.</p>'
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Мониторинг закупок фильтров для медтехники</title>
  <meta name="description" content="Публичная витрина агента мониторинга закупок медицинских фильтров в России" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,600&display=swap" rel="stylesheet" />
  <style>
    :root {{
      --bg0: #0f1c24;
      --bg1: #173042;
      --ink: #e8f1f4;
      --muted: #9bb3be;
      --accent: #3ecf9a;
      --line: rgba(232, 241, 244, 0.12);
      --card: rgba(15, 28, 36, 0.55);
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: Manrope, system-ui, sans-serif;
      color: var(--ink);
      background:
        radial-gradient(1200px 600px at 10% -10%, rgba(62, 207, 154, 0.18), transparent 55%),
        radial-gradient(900px 500px at 90% 0%, rgba(74, 144, 226, 0.16), transparent 50%),
        linear-gradient(160deg, var(--bg0), var(--bg1));
      min-height: 100vh;
    }}
    .wrap {{
      width: min(1080px, calc(100% - 2rem));
      margin: 0 auto;
      padding: 2.5rem 0 4rem;
    }}
    header {{
      margin-bottom: 2rem;
      animation: rise 0.7s ease both;
    }}
    .brand {{
      font-family: "Source Serif 4", Georgia, serif;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      line-height: 1.15;
      margin: 0 0 0.6rem;
    }}
    .lead {{
      margin: 0;
      color: var(--muted);
      max-width: 42rem;
      font-size: 1.05rem;
    }}
    .status {{
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.25rem;
      margin-top: 1.25rem;
      color: var(--muted);
      font-size: 0.95rem;
    }}
    .status strong {{ color: var(--accent); font-weight: 700; }}
    .list {{
      display: grid;
      gap: 0.9rem;
    }}
    .card {{
      border: 1px solid var(--line);
      background: var(--card);
      backdrop-filter: blur(8px);
      border-radius: 14px;
      padding: 1rem 1.1rem;
      animation: rise 0.6s ease both;
    }}
    .card:nth-child(2) {{ animation-delay: 0.05s; }}
    .card:nth-child(3) {{ animation-delay: 0.1s; }}
    .title {{
      color: var(--ink);
      text-decoration: none;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 0.35rem;
    }}
    .title:hover {{ color: var(--accent); }}
    .customer {{
      margin: 0 0 0.7rem;
      color: var(--muted);
      font-size: 0.95rem;
    }}
    .meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem 1rem;
      color: #c5d7df;
      font-size: 0.86rem;
    }}
    .empty {{ color: var(--muted); }}
    footer {{
      margin-top: 2rem;
      color: var(--muted);
      font-size: 0.85rem;
    }}
    @keyframes rise {{
      from {{ opacity: 0; transform: translateY(10px); }}
      to {{ opacity: 1; transform: none; }}
    }}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1 class="brand">Фильтры · медтехника · закупки РФ</h1>
      <p class="lead">
        Публичная витрина агента мониторинга: дыхательные и бактериальные фильтры,
        HME/HEPA, диализаторы, инфузионные фильтры и фильтры медицинских газов.
      </p>
      <div class="status">
        <span>Обновлено: <strong>{escape(payload.get("generated_at") or "—")}</strong></span>
        <span>Записей: <strong>{payload.get("count", 0)}</strong></span>
        <span><a href="./data.json" style="color:var(--accent)">data.json</a></span>
      </div>
    </header>
    <section class="list">
      {body}
    </section>
    <footer>
      Агент <code>medfilter-monitor</code> · источники ClearSpending / ЕИС / DaMIA · обновление по расписанию GitHub Actions
    </footer>
  </div>
</body>
</html>
"""
