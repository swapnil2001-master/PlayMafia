# 🕵️ PlayMafia

A realtime, phone-first **Mafia** party game. One host runs the game as **God** on
their phone while everyone else joins from theirs with a room code or QR scan. The
UI is designed to feel like a native iOS app: big tap targets, spring animations,
and no scrolling on the game screens.

The app deliberately keeps a **manual "God" model** — the backend synchronizes state
and hides secret information, while the host narrates and drives every transition.
That keeps it flexible enough for any Mafia house-rules without hard-coding them.

## Tech stack

**Frontend** — React + TypeScript, Vite, TailwindCSS, Framer Motion, React Router,
Zustand, STOMP over SockJS.

**Backend** — Spring Boot 3, Java 17, Spring WebSocket (STOMP). Game state is kept
in memory, so it runs with zero database setup.

## Project layout

```
PlayMafia/
├─ backend/     Spring Boot API + WebSocket game engine
├─ frontend/    React app (iOS-style UI)
└─ docs/        Architecture, REST + WebSocket reference
```

## Running locally

You need **Java 17+**, **Maven**, and **Node 18+**.

### 1. Backend (port 8080)

```bash
cd backend
mvn spring-boot:run
```

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` and `/ws` to the backend, so no
extra config is needed. To play across real phones on your Wi-Fi, run Vite with
`npm run dev -- --host` and open the shown network URL on each device.

## How a game flows

1. **Home** → Create or Join a room.
2. **Lobby** — everyone gathers; the host sees a QR code / invite link to share.
3. **Configure Roles** (host) — pick counts for Mafia, Doctor, Detective, Bodyguard,
   Jester; villagers fill the rest automatically, validated live.
4. **Role Reveal** — each player taps a card to see only their own secret role.
5. **Night → Day → Voting → Result → …** — the host drives phases from the **God**
   screen (which shows every role) while players see only public announcements.
6. **End Game** — the host declares the winner; roles are revealed to all.

See [`docs/architecture.md`](docs/architecture.md), [`docs/api.md`](docs/api.md), and
[`docs/websocket.md`](docs/websocket.md) for details.

## Roadmap

- Predefined role packs (Classic / Advanced / Chaos)
- Spectator mode for eliminated players
- Discussion & voting timers
- Rejoin on refresh (identity is already persisted client-side)
- PWA install support
