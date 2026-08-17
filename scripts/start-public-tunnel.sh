#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8080}"
LOG="/tmp/cloudflared-web.log"

pkill -f "cloudflared tunnel --url http://127.0.0.1:${PORT}" 2>/dev/null || true
rm -f "$LOG"

echo "Starting Cloudflare tunnel for port ${PORT}..."
/tmp/cloudflared tunnel --url "http://127.0.0.1:${PORT}" 2>&1 | tee "$LOG" &
TUNNEL_PID=$!

for i in $(seq 1 20); do
  URL=$(rg -o 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" 2>/dev/null | head -1 || true)
  if [ -n "$URL" ]; then
    echo ""
    echo "============================================"
    echo "  PUBLIC URL: $URL"
    echo "  Login: admin@raznaia.local / admin123"
    echo "============================================"
    echo ""
    exit 0
  fi
  sleep 1
done

echo "Tunnel failed to start. Log:"
cat "$LOG"
kill "$TUNNEL_PID" 2>/dev/null || true
exit 1
