FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && mkdir -p /app/data /tmp \
  && chown -R node:node /app

ENV PORT=3000
ENV COOKIE_SECURE=true
ENV DB_PATH=/tmp/schetmaster.db
USER node
EXPOSE 3000

CMD ["npm", "start"]
