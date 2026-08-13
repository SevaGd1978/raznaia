#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f .env ]]; then
  echo "Файл .env не найден. Сначала запустите: ./setup.sh"
  exit 1
fi

# shellcheck disable=SC1091
source .env

HOST="${SERVER_HOST:-}"
PORT="${PROXY_PORT:-443}"
SECRET="${MTPROTO_SECRET:-}"

if [[ -z "$HOST" || -z "$SECRET" ]]; then
  echo "В .env должны быть SERVER_HOST и MTPROTO_SECRET"
  exit 1
fi

echo "tg://proxy?server=${HOST}&port=${PORT}&secret=${SECRET}"
echo "https://t.me/proxy?server=${HOST}&port=${PORT}&secret=${SECRET}"
