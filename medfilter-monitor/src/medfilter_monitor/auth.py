"""Учётные записи для витрины: demo (72ч) и admin."""

from __future__ import annotations

import hashlib
import json
import secrets
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SECRETS = ROOT / ".secrets" / "access.json"


@dataclass
class AccessBundle:
    demo_user: str
    demo_password: str
    demo_expires_at: str
    admin_user: str
    admin_password: str
    salt: str
    demo_hash: str
    admin_hash: str
    created_at: str
    site_url: str = ""

    def to_public_auth_config(self) -> dict:
        """То, что можно встроить в HTML (без plaintext-паролей)."""
        return {
            "salt": self.salt,
            "demo": {
                "user": self.demo_user,
                "hash": self.demo_hash,
                "expires_at": self.demo_expires_at,
            },
            "admin": {
                "user": self.admin_user,
                "hash": self.admin_hash,
            },
        }

    def to_dict(self) -> dict:
        return asdict(self)


def _hash_password(password: str, salt: str) -> str:
    raw = f"{salt}:{password}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def create_access(
    *,
    demo_hours: int = 72,
    site_url: str = "",
    demo_user: str = "demo",
    admin_user: str = "admin",
) -> AccessBundle:
    now = datetime.now(timezone.utc)
    salt = secrets.token_hex(16)
    demo_password = f"demo-{secrets.token_urlsafe(6)}"
    admin_password = f"admin-{secrets.token_urlsafe(9)}"
    expires = now + timedelta(hours=demo_hours)
    return AccessBundle(
        demo_user=demo_user,
        demo_password=demo_password,
        demo_expires_at=expires.strftime("%Y-%m-%dT%H:%M:%SZ"),
        admin_user=admin_user,
        admin_password=admin_password,
        salt=salt,
        demo_hash=_hash_password(demo_password, salt),
        admin_hash=_hash_password(admin_password, salt),
        created_at=now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        site_url=site_url,
    )


def load_or_create_access(
    path: str | Path = DEFAULT_SECRETS,
    *,
    rotate_demo: bool = True,
    site_url: str = "",
) -> AccessBundle:
    """Создаёт новые учётки. Demo всегда на 72ч от генерации; admin можно сохранить."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    existing_admin_password = None
    existing_admin_user = "admin"
    if path.exists() and not rotate_demo:
        try:
            old = json.loads(path.read_text(encoding="utf-8"))
            existing_admin_password = old.get("admin_password")
            existing_admin_user = old.get("admin_user") or "admin"
        except Exception:  # noqa: BLE001
            pass

    bundle = create_access(site_url=site_url, admin_user=existing_admin_user)
    if existing_admin_password:
        bundle.admin_password = existing_admin_password
        bundle.admin_hash = _hash_password(existing_admin_password, bundle.salt)

    path.write_text(json.dumps(bundle.to_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
    _write_access_txt(path.parent / "ACCESS.txt", bundle)
    return bundle


def _write_access_txt(path: Path, bundle: AccessBundle) -> None:
    path.write_text(
        f"""Доступ к витрине мониторинга фильтров
=====================================

Сайт: {bundle.site_url or '(будет указан после деплоя)'}
Создано (UTC): {bundle.created_at}

DEMO (действует 72 часа)
  Логин:    {bundle.demo_user}
  Пароль:   {bundle.demo_password}
  Истекает: {bundle.demo_expires_at}

ADMIN (без срока)
  Логин:    {bundle.admin_user}
  Пароль:   {bundle.admin_password}

Админ видит полный дашборд и ссылку на data.json.
Demo — только просмотр витрины до истечения срока.
""",
        encoding="utf-8",
    )
