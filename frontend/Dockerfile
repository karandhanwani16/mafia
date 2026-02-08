# Build from repo root: docker build -f frontend/Dockerfile .
# Stage 1: build
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Monorepo: install from root (frontend has no workspace deps but uses root lockfile)
COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
COPY socket-server/package.json socket-server/
COPY shared/package.json shared/constants.js shared/

RUN npm ci

COPY frontend ./frontend
COPY backend ./backend
COPY socket-server ./socket-server
COPY shared ./shared

WORKDIR /app/frontend

# Build with relative API/Socket URLs so nginx can proxy /api and /socket.io
ENV VITE_API_URL=
ENV VITE_SOCKET_URL=

# Work around npm optional deps bug: ensure Rollup's Linux binary is present for Docker build
RUN npm install @rollup/rollup-linux-x64-gnu --no-save


RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
