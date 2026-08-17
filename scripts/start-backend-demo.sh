#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_PATH="${ROOT}/backend/raznaia-demo.db"
export DATABASE_URL="sqlite:///${DB_PATH}"
export SECRET_KEY="${SECRET_KEY:-demo-secret-for-local-testing-only}"
export CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
export APP_ENV=development

cd "${ROOT}/backend"

echo "Initializing SQLite database at ${DB_PATH}..."
python3 - <<'PY'
from app.database import Base, engine
from app.models import Counterparty, Order, OrderStatusHistory, User, Vehicle  # noqa: F401

Base.metadata.create_all(bind=engine)
print("Tables created.")
PY

python3 seed.py

echo "Starting backend on :8000..."
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
