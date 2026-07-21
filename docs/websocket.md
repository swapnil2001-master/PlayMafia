# WebSocket

Transport is **STOMP over SockJS**. The endpoint is `/ws` (proxied to the backend
in dev). State changes are made via REST; the server pushes the resulting state to
subscribers — clients don't send game commands over the socket.

## Topics

| Destination | Payload | Who subscribes |
| --- | --- | --- |
| `/topic/room/{code}` | `RoomView` (roles hidden) | Every player |
| `/topic/god/{code}` | `RoomView` (roles included) | Host only |
| `/topic/player/{playerId}` | `RoleView` | That one player, at role assignment |

## Broadcast timing

Every engine mutation (join, config, start, ready, kill, revive, vote-out, advance,
end, leave) ends by publishing the updated snapshot to both `/topic/room/{code}` and
`/topic/god/{code}`. Because subscriptions are re-registered on each STOMP connect,
they survive automatic reconnects.

## Client example

```ts
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const client = new Client({
  webSocketFactory: () => new SockJS("/ws"),
  onConnect: () => {
    client.subscribe(`/topic/room/${code}`, (m) => render(JSON.parse(m.body)));
  },
});
client.activate();
```
