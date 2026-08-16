#!/usr/bin/env bash
# Keeps a Cloudflare quick tunnel alive and writes the public URL to disk.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL_FILE="${URL_FILE:-/opt/cursor/artifacts/PUBLIC_URL.txt}"
ACCESS_FILE="$ROOT/ACCESS.md"
PORT="${PORT:-3000}"
LOG="${LOG:-/tmp/cloudflared-watch.log}"

mkdir -p "$(dirname "$URL_FILE")"

extract_url() {
  rg -o 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$LOG" | tail -1 || true
}

while true; do
  : > "$LOG"
  cloudflared tunnel --url "http://127.0.0.1:${PORT}" >>"$LOG" 2>&1 &
  pid=$!

  url=""
  for _ in $(seq 1 30); do
    sleep 1
    url="$(extract_url)"
    if [[ -n "$url" ]]; then
      break
    fi
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
  done

  if [[ -z "$url" ]]; then
    echo "tunnel failed to start, retrying..." >&2
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    sleep 3
    continue
  fi

  echo "$url" | tee "$URL_FILE"
  cat > "$ACCESS_FILE" <<EOF
# Доступ к СчётМастер

## Актуальный адрес (сейчас работает)

**${url}**

Старые адреса \`*.trycloudflare.com\` перестают работать после перезапуска туннеля.

## Учётные записи

| Роль | Логин | Пароль |
|---|---|---|
| Админ | \`admin\` | \`AdminRaznaia2026\` |
| Демо | \`demo\` | \`demo123\` |
| Новый | вкладка «Регистрация» | свой пароль (≥ 6 символов) |

## Постоянный хостинг (не пропадает)

Бесплатный Render:

1. Откройте https://render.com/deploy?repo=https://github.com/SevaGd1978/raznaia
2. Подтвердите Blueprint (\`render.yaml\`)
3. Получите постоянный URL вида \`https://schetmaster.onrender.com\`

Пароль админа на Render: \`AdminRaznaia2026\`.
EOF

  wait "$pid" || true
  echo "tunnel exited, restarting in 2s..." >&2
  sleep 2
done
