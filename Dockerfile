FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY invoice-app/package.json invoice-app/package-lock.json ./
RUN npm ci
COPY invoice-app/ ./
RUN npm run build \
  && mkdir -p /app/data /data \
  && chown -R node:node /app /data \
  && npm prune --omit=dev

ENV PORT=8080 \
    HOST=0.0.0.0 \
    COOKIE_SECURE=true \
    DB_PATH=/data/schetmaster.db \
    NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=512

EXPOSE 8080

USER root
CMD ["sh", "-c", "mkdir -p /data && chown -R node:node /data && exec setpriv --reuid=node --regid=node --init-groups -- /usr/local/bin/node --import tsx /app/server/run.ts"]
