# Build from repo root: docker build -f admin/Dockerfile .
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY admin/package.json admin/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY socket-server/package.json socket-server/
COPY shared/package.json shared/constants.js shared/

RUN npm ci

COPY admin ./admin
COPY shared ./shared

WORKDIR /app/admin

# Use same-origin in Docker; override with build-arg in production if admin is on different host
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/admin/dist /usr/share/nginx/html
COPY admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
