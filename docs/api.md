# REST API

Base path: `/api/rooms`. All responses are JSON. The client stores the `playerId`
returned on create/join as its identity and passes it (or `hostId`) on later calls.

| Method | Path | Body / Query | Purpose |
| --- | --- | --- | --- |
| `POST` | `/` | `{ hostName, roomName? }` | Create a room; caller becomes host. |
| `POST` | `/{code}/join` | `{ name }` | Join an open room. |
| `GET` | `/{code}` | — | Public room snapshot (no roles). |
| `GET` | `/{code}/god` | `?hostId=` | Full snapshot **with** roles (host only). |
| `GET` | `/{code}/role` | `?playerId=` | The caller's own secret role. |
| `POST` | `/{code}/config` | `?hostId=` + `GameConfig` | Update role config (host). |
| `POST` | `/{code}/start` | `?hostId=` | Assign roles, go to Role Reveal (host). |
| `POST` | `/{code}/ready` | `?playerId=` | Mark ready; all ready → Night 1. |
| `POST` | `/{code}/kill` | `{ hostId, targetId }` | Mark a player dead (host). |
| `POST` | `/{code}/revive` | `{ hostId, targetId }` | Bring a player back (host). |
| `POST` | `/{code}/voteout` | `{ hostId, targetId }` | Eliminate by town vote (host). |
| `POST` | `/{code}/advance` | `?hostId=` | Advance the phase (host). |
| `POST` | `/{code}/end` | `?hostId=&winner=` | End game with a winner (host). |
| `POST` | `/{code}/leave` | `?playerId=` | Leave the room. |

### Create / join response

```json
{ "roomCode": "ABCD12", "playerId": "uuid", "host": true }
```

### Errors

Failures return the standard Spring error body with a human-readable `message`
(e.g. `"That name is already taken in this room"`), which the frontend surfaces
directly. Host-only actions return `403` when the `hostId` doesn't match.
