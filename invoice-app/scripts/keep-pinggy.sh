#!/usr/bin/env bash
set -euo pipefail
URL_FILE=/opt/cursor/artifacts/PUBLIC_URL.txt
ACCESS_FILE=/workspace/invoice-app/ACCESS.md
while true; do
  LOG=/tmp/pinggy.log
  : > "$LOG"
  ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes \
    -p 443 -R0:127.0.0.1:3000 a.pinggy.io >"$LOG" 2>&1 &
  pid=$!
  url=""
  for _ in $(seq 1 40); do
    sleep 1
    url=$(rg -o 'https://[a-zA-Z0-9.-]+\.(run\.pinggy-free\.link|free\.pinggy\.net)' "$LOG" | head -1 || true)
    if [[ -n "$url" ]]; then break; fi
    if ! kill -0 "$pid" 2>/dev/null; then break; fi
  done
  if [[ -z "$url" ]]; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    sleep 3
    continue
  fi
  alt=$(rg -o 'https://[a-zA-Z0-9.-]+\.(run\.pinggy-free\.link|free\.pinggy\.net)' "$LOG" | sed -n '2p' || true)
  echo "$url" | tee "$URL_FILE"
  cat > "$ACCESS_FILE" <<MD
# Доступ к СчётМастер (из России)

Cloudflare (\`*.trycloudflare.com\`) из РФ часто не открывается.

## Рабочая ссылка сейчас

**${url}**

$( [[ -n "$alt" ]] && echo "Резерв: **${alt}**" )

| Роль | Логин | Пароль |
|---|---|---|
| Админ | \`admin\` | \`AdminRaznaia2026\` |
| Демо | \`demo\` | \`demo123\` |

## Постоянный хостинг (рекомендуется)

Чтобы ссылка не пропадала и стабильно открывалась из России — Render:

1. https://render.com/deploy?repo=https://github.com/SevaGd1978/raznaia
2. Подтвердите Blueprint
3. Получите адрес \`https://schetmaster.onrender.com\`

Пароль админа: \`AdminRaznaia2026\`
MD
  wait "$pid" || true
  sleep 2
done
