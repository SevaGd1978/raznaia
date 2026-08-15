"""Экспорт публичной витрины мониторинга."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from typing import Any

from .auth import AccessBundle, load_or_create_access
from .buyers import KNOWN_BUYERS
from .store import Store


def export_site(
    store: Store,
    out_dir: str | Path,
    *,
    limit: int = 100,
    single_file: bool = False,
    buyers: list[dict[str, Any]] | None = None,
    access: AccessBundle | None = None,
    site_url: str = "",
) -> Path:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    items = store.recent(limit)
    fresh_items = store.recent(limit, fresh_only=True)
    private_items = store.private_recent(limit)

    if buyers is None:
        buyers = [
            {
                "name": b["name"],
                "kind": b.get("kind", "unknown"),
                "inn": b.get("inn", ""),
                "segment": b.get("segment", ""),
                "note": b.get("note", ""),
                "sources": b.get("sources", []),
                "hits": 0,
                "total_price": 0,
                "last_seen": "",
                "sample_titles": [],
            }
            for b in KNOWN_BUYERS
        ]

    if access is None:
        access = load_or_create_access(site_url=site_url)
    elif site_url and not access.site_url:
        access.site_url = site_url

    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    payload = {
        "generated_at": generated_at,
        "count": len(items),
        "fresh_count": len(fresh_items),
        "private_count": len(private_items),
        "items": fresh_items or items,
        "all_items": items,
        "private_items": private_items,
        "buyers": buyers,
        "auth": access.to_public_auth_config(),
        "demo_expires_at": access.demo_expires_at,
    }
    # data.json без auth-хешей наружу не отдаём целиком — только данные
    public_data = {
        k: v for k, v in payload.items() if k not in {"auth"}
    }
    (out / "data.json").write_text(
        json.dumps(public_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    html = _render_html(payload, access=access)
    if single_file:
        boot = json.dumps(payload, ensure_ascii=False).replace("<", "\\u003c")
        html = html.replace(
            "</body>",
            f'<script type="application/json" id="boot-data">{boot}</script>\n</body>',
        )
    (out / "index.html").write_text(html, encoding="utf-8")
    return out


def _card(item: dict) -> str:
    price = item.get("price")
    price_s = f"{price:,.0f} ₽".replace(",", " ") if isinstance(price, (int, float)) else "—"
    url = item.get("url") or "#"
    kind = item.get("customer_kind") or "unknown"
    fresh = item.get("freshness") or "unknown"
    return f"""
            <article class="card">
              <a class="title" href="{escape(url)}" target="_blank" rel="noopener noreferrer">
                {escape(str(item.get("title") or "Без названия"))}
              </a>
              <p class="customer">{escape(str(item.get("customer") or "Заказчик не указан"))}</p>
              <div class="meta">
                <span>{escape(price_s)}</span>
                <span>{escape(str(item.get("published_at") or "—")[:10])}</span>
                <span class="tag">{escape(fresh)}</span>
                <span class="tag">{escape(kind)}</span>
                <span>{escape(str(item.get("source") or ""))}</span>
              </div>
            </article>
            """


def _buyer_card(buyer: dict) -> str:
    kind = buyer.get("kind") or "unknown"
    hits = buyer.get("hits") or 0
    note = buyer.get("note") or ""
    sources = ", ".join(buyer.get("sources") or [])
    return f"""
            <article class="card buyer">
              <h3>{escape(str(buyer.get("name") or ""))}</h3>
              <p class="customer">{escape(str(buyer.get("segment") or ""))}</p>
              <p class="note">{escape(note)}</p>
              <div class="meta">
                <span class="tag">{escape(kind)}</span>
                <span>хитов: {hits}</span>
                <span>ИНН: {escape(str(buyer.get("inn") or "—"))}</span>
                <span>{escape(sources[:80])}</span>
              </div>
            </article>
            """


def _render_html(payload: dict, *, access: AccessBundle) -> str:
    fresh_rows = "\n".join(_card(i) for i in (payload.get("items") or [])[:40])
    private_rows = "\n".join(_card(i) for i in (payload.get("private_items") or [])[:30])
    if not private_rows:
        private_buyers = [b for b in (payload.get("buyers") or []) if b.get("kind") == "private"]
        private_rows = "\n".join(_buyer_card(b) for b in private_buyers[:20])
        if private_rows:
            private_rows = (
                '<p class="note">Активных частных лотов в этой выборке нет — ниже цели постоянного мониторинга.</p>\n'
                + private_rows
            )
    buyer_rows = "\n".join(_buyer_card(b) for b in (payload.get("buyers") or [])[:20])
    if not fresh_rows:
        fresh_rows = '<p class="empty">Пока нет свежих позиций — дождитесь следующего цикла.</p>'
    if not private_rows:
        private_rows = '<p class="empty">Частных закупок в этой выборке пока нет.</p>'
    if not buyer_rows:
        buyer_rows = '<p class="empty">Справочник заказчиков пуст.</p>'

    auth_json = json.dumps(access.to_public_auth_config(), ensure_ascii=False).replace("<", "\\u003c")
    demo_exp = escape(access.demo_expires_at)

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Мониторинг закупок фильтров для медтехники</title>
  <meta name="description" content="Актуальные закупки медицинских фильтров — demo 72ч и admin доступ" />
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
      --warn: #f0c674;
      --danger: #ff7b72;
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
    .wrap {{ width: min(1100px, calc(100% - 2rem)); margin: 0 auto; padding: 2.5rem 0 4rem; }}
    header {{ margin-bottom: 2rem; animation: rise 0.7s ease both; }}
    .brand {{
      font-family: "Source Serif 4", Georgia, serif;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      line-height: 1.15; margin: 0 0 0.6rem;
    }}
    .lead {{ margin: 0; color: var(--muted); max-width: 46rem; font-size: 1.05rem; }}
    .status {{
      display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem;
      margin-top: 1.25rem; color: var(--muted); font-size: 0.95rem;
    }}
    .status strong {{ color: var(--accent); font-weight: 700; }}
    h2 {{
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 1.45rem; margin: 2rem 0 0.85rem;
    }}
    .list {{ display: grid; gap: 0.9rem; }}
    .card {{
      border: 1px solid var(--line); background: var(--card);
      backdrop-filter: blur(8px); border-radius: 14px; padding: 1rem 1.1rem;
      animation: rise 0.6s ease both;
    }}
    .card h3 {{ margin: 0 0 0.35rem; font-size: 1.05rem; }}
    .note {{ color: var(--muted); margin: 0 0 0.7rem; font-size: 0.92rem; }}
    .title {{ color: var(--ink); text-decoration: none; font-weight: 700; display: inline-block; margin-bottom: 0.35rem; }}
    .title:hover {{ color: var(--accent); }}
    .customer {{ margin: 0 0 0.7rem; color: var(--muted); font-size: 0.95rem; }}
    .meta {{ display: flex; flex-wrap: wrap; gap: 0.55rem 1rem; color: #c5d7df; font-size: 0.86rem; }}
    .tag {{
      border: 1px solid var(--line); border-radius: 999px; padding: 0.1rem 0.55rem;
      color: var(--warn);
    }}
    .empty {{ color: var(--muted); }}
    footer {{ margin-top: 2rem; color: var(--muted); font-size: 0.85rem; }}
    #app {{ display: none; }}
    #login-gate {{
      min-height: 100vh; display: grid; place-items: center; padding: 1.5rem;
    }}
    .login-card {{
      width: min(420px, 100%);
      border: 1px solid var(--line);
      background: var(--card);
      backdrop-filter: blur(10px);
      border-radius: 18px;
      padding: 1.6rem 1.5rem 1.4rem;
      animation: rise 0.55s ease both;
    }}
    .login-card h1 {{
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 1.55rem; margin: 0 0 0.4rem;
    }}
    .login-card p {{ color: var(--muted); margin: 0 0 1.1rem; font-size: 0.95rem; }}
    label {{ display: block; font-size: 0.85rem; color: var(--muted); margin: 0.7rem 0 0.3rem; }}
    input {{
      width: 100%; border-radius: 10px; border: 1px solid var(--line);
      background: rgba(0,0,0,0.25); color: var(--ink);
      padding: 0.7rem 0.8rem; font: inherit;
    }}
    button {{
      margin-top: 1rem; width: 100%; border: 0; border-radius: 10px;
      background: var(--accent); color: #062016; font-weight: 700;
      padding: 0.75rem 1rem; cursor: pointer; font: inherit;
    }}
    button.secondary {{
      background: transparent; color: var(--muted); border: 1px solid var(--line); margin-top: 0.55rem;
    }}
    .err {{ color: var(--danger); min-height: 1.2em; margin-top: 0.6rem; font-size: 0.9rem; }}
    .hint {{ margin-top: 1rem; font-size: 0.82rem; color: var(--muted); }}
    .topbar {{
      display: flex; flex-wrap: wrap; gap: 0.6rem 1rem; align-items: center;
      margin-bottom: 1rem; color: var(--muted); font-size: 0.9rem;
    }}
    .topbar .role {{ color: var(--accent); font-weight: 700; }}
    .admin-only {{ display: none; }}
    body.role-admin .admin-only {{ display: inline; }}
    @keyframes rise {{ from {{ opacity: 0; transform: translateY(10px); }} to {{ opacity: 1; transform: none; }} }}
  </style>
</head>
<body>
  <div id="login-gate">
    <form class="login-card" id="login-form">
      <h1>Вход на витрину</h1>
      <p>Demo действует 72 часа (до <strong>{demo_exp}</strong>). Admin — постоянный доступ.</p>
      <label for="user">Логин</label>
      <input id="user" name="user" autocomplete="username" required placeholder="demo или admin" />
      <label for="pass">Пароль</label>
      <input id="pass" name="pass" type="password" autocomplete="current-password" required />
      <button type="submit">Войти</button>
      <div class="err" id="login-error"></div>
      <div class="hint">После входа сессия хранится в этом браузере до выхода или истечения demo.</div>
    </form>
  </div>

  <div id="app">
  <div class="wrap">
    <div class="topbar">
      <span>Роль: <span class="role" id="role-label">—</span></span>
      <span id="session-info"></span>
      <button type="button" class="secondary" id="logout-btn" style="width:auto;padding:0.35rem 0.8rem;margin:0">Выйти</button>
    </div>
    <header>
      <h1 class="brand">Фильтры · медтехника · актуальные закупки</h1>
      <p class="lead">
        Свежие извещения из сети, учреждения с постоянным спросом на медицинские фильтры
        и отдельный мониторинг частных фирм (клиники, сети диализа, коммерческие закупки).
      </p>
      <div class="status">
        <span>Обновлено: <strong>{escape(payload.get("generated_at") or "—")}</strong></span>
        <span>Свежих: <strong>{payload.get("fresh_count", 0)}</strong></span>
        <span>Частных: <strong>{payload.get("private_count", 0)}</strong></span>
        <span class="admin-only"><a href="./data.json" style="color:var(--accent)">data.json</a></span>
      </div>
    </header>

    <h2>Актуальные закупки</h2>
    <section class="list">{fresh_rows}</section>

    <h2>Постоянные заказчики</h2>
    <section class="list">{buyer_rows}</section>

    <h2>Частные фирмы</h2>
    <section class="list">{private_rows}</section>

    <footer>
      Агент <code>medfilter-monitor</code> · demo 72ч / admin · источники: веб / РосТендер / ClearSpending / ЕИС / DaMIA
    </footer>
  </div>
  </div>

  <script id="auth-config" type="application/json">{auth_json}</script>
  <script>
  (function () {{
    const cfg = JSON.parse(document.getElementById('auth-config').textContent);
    const KEY = 'medfilter_auth_v1';
    const gate = document.getElementById('login-gate');
    const app = document.getElementById('app');
    const err = document.getElementById('login-error');
    const form = document.getElementById('login-form');

    async function sha256Hex(text) {{
      const data = new TextEncoder().encode(text);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }}

    function readSession() {{
      try {{ return JSON.parse(sessionStorage.getItem(KEY) || 'null'); }} catch (_) {{ return null; }}
    }}
    function writeSession(s) {{ sessionStorage.setItem(KEY, JSON.stringify(s)); }}
    function clearSession() {{ sessionStorage.removeItem(KEY); }}

    function showApp(session) {{
      gate.style.display = 'none';
      app.style.display = 'block';
      document.body.classList.toggle('role-admin', session.role === 'admin');
      document.getElementById('role-label').textContent = session.role;
      const info = document.getElementById('session-info');
      if (session.role === 'demo' && session.expires_at) {{
        info.textContent = 'demo до ' + session.expires_at;
      }} else {{
        info.textContent = 'полный доступ';
      }}
    }}

    function showLogin(message) {{
      gate.style.display = 'grid';
      app.style.display = 'none';
      document.body.classList.remove('role-admin');
      if (message) err.textContent = message;
    }}

    function demoValid() {{
      const exp = Date.parse(cfg.demo.expires_at);
      return Number.isFinite(exp) && Date.now() <= exp;
    }}

    async function tryRestore() {{
      const s = readSession();
      if (!s || !s.role) return showLogin('');
      if (s.role === 'demo') {{
        if (!demoValid() || (s.expires_at && Date.now() > Date.parse(s.expires_at))) {{
          clearSession();
          return showLogin('Срок demo-доступа истёк (72 часа).');
        }}
      }}
      showApp(s);
    }}

    form.addEventListener('submit', async (e) => {{
      e.preventDefault();
      err.textContent = '';
      const user = document.getElementById('user').value.trim();
      const pass = document.getElementById('pass').value;
      const hashed = await sha256Hex(cfg.salt + ':' + pass);

      if (user === cfg.admin.user && hashed === cfg.admin.hash) {{
        const s = {{ role: 'admin', at: new Date().toISOString() }};
        writeSession(s);
        showApp(s);
        return;
      }}
      if (user === cfg.demo.user && hashed === cfg.demo.hash) {{
        if (!demoValid()) {{
          err.textContent = 'Demo-доступ истёк (лимит 72 часа).';
          return;
        }}
        const s = {{ role: 'demo', expires_at: cfg.demo.expires_at, at: new Date().toISOString() }};
        writeSession(s);
        showApp(s);
        return;
      }}
      err.textContent = 'Неверный логин или пароль.';
    }});

    document.getElementById('logout-btn').addEventListener('click', () => {{
      clearSession();
      showLogin('');
    }});

    tryRestore();
  }})();
  </script>
</body>
</html>
"""
