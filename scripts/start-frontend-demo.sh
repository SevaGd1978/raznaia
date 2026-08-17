#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export VITE_API_PROXY_TARGET="${VITE_API_PROXY_TARGET:-http://127.0.0.1:8000}"

cd "${ROOT}/frontend"
echo "Starting frontend on :5173 (API proxy -> ${VITE_API_PROXY_TARGET})..."
exec npm run dev -- --host 0.0.0.0 --port 5173
