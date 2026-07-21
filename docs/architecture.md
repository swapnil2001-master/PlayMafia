# Architecture

```
        React (per phone)
              │
      REST  +  WebSocket (STOMP/SockJS)
              │
       Spring Boot backend
              │
      GameEngineService  ── in-memory rooms (ConcurrentHashMap)
```

`GameEngineService` owns all state and every transition; controllers stay thin and
just delegate. After any mutation the engine broadcasts the updated room to the
right topics, so every connected phone stays in sync.

## Hiding secret information

Two projections of the same room are produced:

- **Public view** (`/topic/room/{code}`) — never includes roles, except at game end
  when "Reveal roles" is enabled.
- **God view** (`/topic/god/{code}`) — always includes every role; only the host
  subscribes to it.

Each player's own role is delivered once, privately, to `/topic/player/{playerId}`
during role assignment (and is also fetchable via REST for reconnects).

## State machine

```
WAITING → CONFIG → ROLE_REVEAL → NIGHT → DAY → VOTING → RESULT → NIGHT → … → GAME_END
```

- `WAITING` / `CONFIG` — lobby and role setup.
- `ROLE_REVEAL` — roles assigned; advances to `NIGHT 1` once all players are ready.
- `NIGHT → DAY → VOTING → RESULT` — the host advances each phase manually; `RESULT`
  loops back to the next `NIGHT`.
- `GAME_END` — the host declares a winner (`town` | `mafia` | `jester`).

## Data model

| Entity | Key fields |
| --- | --- |
| `Room` | `code`, `name`, `hostId`, `phase`, `round`, `winner`, `config`, `players[]`, `log[]` |
| `Player` | `id`, `name`, `host`, `alive`, `ready`, `role` |
| `GameConfig` | role counts, `anonymousVoting`, `revealRolesAtEnd` |

## Persistence

State is intentionally in-memory for simplicity and speed — a room lives only while
it's in use and is removed when the last player leaves. Swapping in Redis or Postgres
would only require replacing the `ConcurrentHashMap` in `GameEngineService`.
