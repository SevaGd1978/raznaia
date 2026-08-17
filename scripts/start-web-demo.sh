#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_PATH="${ROOT}/backend/raznaia-demo.db"
PORT="${PORT:-8080}"

export DATABASE_URL="sqlite:///${DB_PATH}"
export SECRET_KEY="${SECRET_KEY:-demo-secret-for-local-testing-only}"
export APP_ENV=development
export STATIC_ROOT="${ROOT}/frontend/dist"
export CORS_ORIGINS="*"

echo "Building frontend..."
cd "${ROOT}/frontend"
npm run build

cd "${ROOT}/backend"
echo "Initializing SQLite database at ${DB_PATH}..."
python3 - <<'PY'
from app.database import Base, engine
from app.models import Counterparty, Order, OrderStatusHistory, User, Vehicle  # noqa: F401

Base.metadata.create_all(bind=engine)
print("Tables created.")
PY

python3 seed.py

echo "Starting unified web server on http://0.0.0.0:${PORT}"
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
