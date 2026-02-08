# Mafia – Socket server

Standalone Socket.IO server for the Mafia game. Run it separately from the REST API (backend) so you can scale or deploy the two services independently.

## Requirements

- Same MongoDB as the backend (shared DB)
- Backend calls this server’s internal API to emit events (e.g. when a game starts)

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and set:
   - `PORT` – e.g. 3002
   - `MONGODB_URI` – same as backend
   - `FRONTEND_URL` – for CORS (e.g. http://localhost:5173)
   - `INTERNAL_API_KEY` – must match `INTERNAL_API_KEY` in the backend

## Run

- Dev: `npm run dev`
- Prod: `npm start`

## Internal API (for the main backend)

The backend triggers socket emits by sending:

- **POST** `/internal/emit`
- Headers: `X-Internal-Key: <INTERNAL_API_KEY>`
- Body: `{ "roomId": "<roomId>", "events": [ { "event": "gameStarted", "payload": { ... } } ] }`

Only the backend should call this; keep `INTERNAL_API_KEY` secret in production.

## Moving to a separate repo

You can copy `socket-server/` into its own repository. Then:

1. Copy the `shared/` folder into the socket-server repo (or publish it as an npm package and depend on it).
2. Point the backend’s `SOCKET_SERVER_URL` at your deployed socket server.
3. Set the same `INTERNAL_API_KEY` on both backend and socket-server.
