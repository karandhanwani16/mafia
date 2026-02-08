# Build from repo root: docker build -f backend/Dockerfile .
FROM node:20-alpine

WORKDIR /app

# Monorepo: install from root so workspace dependency mafia-shared resolves
COPY package.json package-lock.json* ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY socket-server/package.json socket-server/
COPY shared/package.json shared/constants.js shared/

RUN npm ci --omit=dev

COPY backend ./backend
COPY shared ./shared

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "src/server.js"]
