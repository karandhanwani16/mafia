# Build from repo root: docker build -f socket-server/Dockerfile .
FROM node:20-alpine

WORKDIR /app

# Monorepo: install from root so workspace dependency mafia-shared resolves
COPY package.json package-lock.json* ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY socket-server/package.json socket-server/
COPY shared/package.json shared/constants.js shared/

RUN npm ci --omit=dev

COPY socket-server ./socket-server
COPY shared ./shared

WORKDIR /app/socket-server

EXPOSE 3002

CMD ["node", "src/server.js"]
