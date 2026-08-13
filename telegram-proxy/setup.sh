#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[+]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[x]${NC} $*" >&2; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Не найдено: $1"
    exit 1
  fi
}

generate_secret() {
  local raw
  raw="$(head -c 16 /dev/urandom | xxd -ps)"
  echo "dd${raw}"
}

detect_public_ip() {
  curl -4 -fsS --max-time 5 https://api.ipify.org 2>/dev/null \
    || curl -4 -fsS --max-time 5 https://ifconfig.me 2>/dev/null \
    || true
}

print_links() {
  local host="$1"
  local port="$2"
  local secret="$3"

  local tg_link="tg://proxy?server=${host}&port=${port}&secret=${secret}"
  local web_link="https://t.me/proxy?server=${host}&port=${port}&secret=${secret}"

  echo ""
  info "Готовые ссылки для Telegram:"
  echo "  tg://  $tg_link"
  echo "  web    $web_link"
  echo ""
  info "Ручная настройка: Настройки → Данные и память → Использовать прокси → MTProto"
  echo "  Сервер: $host"
  echo "  Порт:   $port"
  echo "  Секрет: $secret"
  echo ""
}

if ! docker compose version >/dev/null 2>&1; then
  err "Нужен Docker Compose (docker compose). Установите Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

require_cmd curl
require_cmd xxd

ENV_FILE=".env"

if [[ -f "$ENV_FILE" ]]; then
  warn "Файл .env уже существует. Используются текущие настройки."
  # shellcheck disable=SC1090
  source "$ENV_FILE"
else
  info "Создаю .env с новым секретом..."
  SECRET="$(generate_secret)"
  HOST="$(detect_public_ip)"

  if [[ -z "$HOST" ]]; then
    warn "Не удалось определить публичный IP автоматически."
    read -r -p "Введите IP или домен сервера: " HOST
  else
    info "Определён публичный IP: $HOST"
  fi

  cat > "$ENV_FILE" <<EOF
PROXY_PORT=443
MTPROTO_SECRET=${SECRET}
SERVER_HOST=${HOST}
EOF
  chmod 600 "$ENV_FILE"
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [[ -z "${MTPROTO_SECRET:-}" ]]; then
  err "MTPROTO_SECRET не задан в .env"
  exit 1
fi

if [[ ${#MTPROTO_SECRET} -ne 32 ]] || ! [[ "$MTPROTO_SECRET" =~ ^[0-9a-f]+$ ]]; then
  err "MTPROTO_SECRET должен быть 32 hex-символа (строчные a-f)"
  exit 1
fi

PORT="${PROXY_PORT:-443}"
HOST="${SERVER_HOST:-}"

if [[ -z "$HOST" ]]; then
  HOST="$(detect_public_ip)"
  if [[ -z "$HOST" ]]; then
    read -r -p "Введите IP или домен сервера: " HOST
  fi
  echo "SERVER_HOST=${HOST}" >> "$ENV_FILE"
fi

info "Запуск MTProto прокси (порт ${PORT})..."
docker compose up -d

sleep 2

if docker compose ps --status running | grep -q mtproto-proxy; then
  info "Прокси запущен."
else
  warn "Контейнер может ещё стартовать. Проверьте: docker compose logs -f"
fi

print_links "$HOST" "$PORT" "$MTPROTO_SECRET"

info "Регистрация в @MTProxybot (опционально): отправьте боту секрет ${MTPROTO_SECRET}"
info "Остановка: docker compose down | Логи: docker compose logs -f"
