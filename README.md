# Mafia Game - Web Application

A full-stack multiplayer Mafia game web application built with React, Node.js, Express, Socket.IO, and MongoDB. The **REST API** (backend) and **Socket server** run as separate processes so you can scale or deploy them independently.

This repo is an **npm workspaces monorepo**: `backend`, `frontend`, `socket-server`, and `shared` are workspace packages. Install once at the root and run scripts from the root or from any package.

## Features

- 🎮 Create or join game rooms
- 👥 Support for 5-12 players
- 🎭 Role assignment (Mafia, Civilian, Doctor, Detective)
- 🌙 Night/Day phase gameplay
- 🗳️ Voting system
- 💬 Real-time chat
- 🔄 Real-time game updates via WebSockets
- 🏆 Win condition detection

## Tech Stack

### Backend (REST API)
- Node.js with Express
- MongoDB with Mongoose
- Express Validator for input validation
- Rate limiting for API protection

### Socket server (separate process)
- Socket.IO for real-time communication (join room, night actions, voting, chat)
- Same MongoDB; receives emit requests from the API (e.g. game start)

### Frontend
- React 18
- Redux Toolkit for state management
- React Router for navigation
- Socket.IO Client for real-time updates
- Tailwind CSS for styling
- Vite for build tooling

## Project Structure (monorepo)

```
mafia/
├── package.json           # Root workspace config and scripts
├── package-lock.json       # Single lockfile for all workspaces
├── backend/                # REST API (rooms, game state, start game)
├── socket-server/          # Socket.IO server (real-time events)
├── frontend/               # React frontend application
├── admin/                  # Admin panel (settings, auth in DB)
├── shared/                 # Shared constants (mafia-shared package)
├── docker-compose.yml
├── backend/Dockerfile
├── socket-server/Dockerfile
└── frontend/Dockerfile
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm

### Monorepo setup (one-time)

From the **repo root**:

```bash
npm install
```

This installs dependencies for all workspaces and links the `mafia-shared` package for backend and socket-server.

### Backend Setup

1. From repo root, create backend `.env` (copy from `.env.example`):
```bash
cp backend/.env.example backend/.env
```

2. Update `backend/.env` with your settings (see `.env.example`). Add `SOCKET_SERVER_URL` and `INTERNAL_API_KEY` so the API can notify the socket server when a game starts.

3. Start the backend (from repo root or from `backend/`):
```bash
npm run dev:backend
# or: cd backend && npm run dev
```

The API will run on `http://localhost:3001`.

### Socket server setup (required for real-time play)

1. From repo root, create `socket-server/.env` from `.env.example` and set `PORT=3002`, same `MONGODB_URI` as backend, and `INTERNAL_API_KEY` to match backend’s value.

2. Start the socket server (from repo root or from `socket-server/`):
```bash
npm run dev:socket
# or: cd socket-server && npm run dev
```

The socket server will run on `http://localhost:3002`. The frontend proxies `/socket.io` to this port in development.

### Frontend Setup

1. Create `frontend/.env` (optional in dev; Vite proxies `/api` → 3001 and `/socket.io` → 3002):
```
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3002
# Set to true for testing: Join form defaults to room code 000000 and a random player name (backend must have TESTING_MODE=true too)
# VITE_TESTING_MODE=false
```

2. Start the frontend (from repo root or from `frontend/`):
```bash
npm run dev:frontend
# or: cd frontend && npm run dev
```

The frontend will run on `http://localhost:5173`.

### Admin panel (optional)

The admin panel lets authorized users manage app settings (testing mode, API rate limits, min/max players, maintenance mode) stored in the database.

1. Start the backend (and MongoDB) so the admin app can call the API.
2. From repo root, start the admin frontend:
```bash
npm run dev:admin
```
3. Open `http://localhost:5174`. If no admin user exists yet, you will be prompted to create one (first-time setup). Then sign in and use the dashboard to change settings.
4. Set `SESSION_SECRET` in backend `.env` (or in Docker) for production so admin sessions are secure.

With Docker Compose, the admin app is served on port **8081** by default. Configure your reverse proxy (e.g. `admin.mafia.example.com`) to proxy to that port, or set `ADMIN_PORT` in the root `.env`.

## Game Rules

### Roles
- **Mafia**: Secretly eliminate villagers each night. Win when mafia count equals or exceeds villagers.
- **Civilian**: No special ability. Work with other villagers to identify and eliminate mafia.
- **Doctor**: Can save one player each night from elimination.
- **Detective**: Can investigate one player each night to learn their alignment.

### Phases
1. **Night Phase**: Mafia chooses a kill target, Doctor chooses a save target, Detective investigates a player.
2. **Day Phase**: Results are revealed, players discuss and vote to eliminate suspected mafia.
3. **Voting**: Majority vote eliminates a player. Game continues until win condition is met.

### Win Conditions
- **Mafia Wins**: When mafia count >= non-mafia count
- **Villagers Win**: When all mafia members are eliminated

## API Endpoints

### Room Management
- `POST /api/rooms` - Create a new room
- `POST /api/rooms/:roomId/join` - Join a room
- `GET /api/rooms/:roomId` - Get room status
- `POST /api/rooms/:roomId/start` - Start the game
- `DELETE /api/rooms/:roomId` - Delete a room

### Game Actions
- `POST /api/game/:gameId/action` - Submit night action
- `POST /api/game/:gameId/vote` - Submit vote
- `GET /api/game/:gameId/state` - Get game state

## Socket.IO Events

### Client → Server
- `joinRoom` - Join a room via socket
- `leaveRoom` - Leave a room
- `submitNightAction` - Submit role action
- `submitVote` - Submit vote
- `sendChatMessage` - Send chat message

### Server → Client
- `roomUpdate` - Room state changed
- `gameStarted` - Game initialization
- `phaseChanged` - Phase transition
- `nightActionRequired` - Prompt for night action
- `dayPhaseStarted` - Day phase begins
- `voteUpdate` - Voting progress
- `voteResults` - Voting results
- `gameEnd` - Game finished
- `chatMessage` - Chat message
- `playerEliminated` - Player elimination
- `error` - Error messages

## Development

### Running locally (all three)

From repo root you can use:

- `npm run dev:backend` – API (or `cd backend && npm run dev`)
- `npm run dev:socket` – Socket server (or `cd socket-server && npm run dev`)
- `npm run dev:frontend` – Frontend (or `cd frontend && npm run dev`)
- `npm run dev:admin` – Admin panel (or `cd admin && npm run dev`)

Or run all workspaces that have a `dev` script at once (three terminals recommended for logs):

```bash
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

### Building for Production

From repo root:

- Backend: `npm run start:backend` (or `cd backend && npm start`)
- Socket server: `npm run start:socket` (or `cd socket-server && npm start`)
- Frontend: `npm run build` then serve `frontend/dist` (e.g. `cd frontend && npm run preview`)

## Docker deployment

The app is containerized so you can run everything with Docker Compose (MongoDB + API + Socket server + Frontend behind nginx).

### Prerequisites
- Docker and Docker Compose

### Run with Docker Compose

From the repo root:

```bash
docker compose up --build
```

- **App (single entry):** open **http://localhost** (port 80). Nginx serves the frontend and proxies `/api` to the backend and `/socket.io` to the socket server.
- **MongoDB:** internal on port 27017 (optionally exposed for tools).
- **Backend:** internal on 3001 (no need to expose).
- **Socket server:** internal on 3002 (no need to expose).

### Optional env file

Create a `.env` in the repo root to override defaults:

```env
# Public URL the browser uses (for CORS). Use your domain in production.
FRONTEND_URL=http://localhost

# Shared secret between backend and socket-server (set a strong value in production)
INTERNAL_API_KEY=dev-internal-key

# Port for the frontend (nginx)
PORT=80

# Port for the admin panel (default 8081)
ADMIN_PORT=8081

# Admin session secret (set a strong value in production)
SESSION_SECRET=change-me-in-production-admin
```

For production, set `FRONTEND_URL` to your real URL (e.g. `https://mafia.example.com`), a strong `INTERNAL_API_KEY`, and a strong `SESSION_SECRET`.

### Build images only

```bash
docker compose build
```

### Run in background

```bash
docker compose up -d --build
docker compose logs -f   # follow logs
docker compose down     # stop and remove containers
```

Data is persisted in a named volume `mafia-mongo-data` for MongoDB.

## Security Features

- Server-side role assignment (never trust client)
- Input validation and sanitization
- Rate limiting on API endpoints
- Role-based data filtering
- Secure WebSocket connections

## Future Enhancements

- Voice chat integration
- Player rankings and statistics
- Game history and replays
- AI bots for practice
- Mobile app support
- Additional roles (Serial Killer, Spy, Bodyguard, etc.)

## License

ISC
