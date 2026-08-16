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

ENV PORT=3000 \
    COOKIE_SECURE=true \
    DB_PATH=/data/schetmaster.db \
    NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=180

EXPOSE 3000

USER root
CMD ["sh", "-c", "mkdir -p /data && chown -R node:node /data && exec su -s /bin/sh node -c 'npx tsx server/run.ts'"]
