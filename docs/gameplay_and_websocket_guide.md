# 🕵️ PlayMafia - System Architecture, Gameplay Logic & WebSocket Guide

Comprehensive documentation explaining how **PlayMafia** works under the hood: from gameplay mechanics, role assignments, and phase state machine to real-time WebSocket messaging and browser transport architecture.

---

## 📑 Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Role Distribution & Host (God) Isolation](#2-role-distribution--host-god-isolation)
3. [Game Loop & State Machine](#3-game-loop--state-machine)
4. [Night Phase & Detective Digital Checks](#4-night-phase--detective-digital-checks)
5. [Morning Audio Chime & Phase Transitions](#5-morning-audio-chime--phase-transitions)
6. [WebSocket Protocol & STOMP Infrastructure](#6-websocket-protocol--stomp-infrastructure)
7. [Topic-Based Security & Data Isolation](#7-topic-based-security--data-isolation)
8. [Connection Resilience & Reconnection Strategy](#8-connection-resilience--reconnection-strategy)

---

## 1. High-Level Architecture

PlayMafia is built on a **REST-for-Mutations, WebSocket-for-State** architecture.

```
   ┌─────────────────────────────────────────────────────────┐
   │                     Host (God Phone)                    │
   └────────────────────────────┬────────────────────────────┘
                                │ Subscribes to /topic/god/{code}
                                ▼ (Includes secret roles & night targets)
 ┌──────────────────────────────────────────────────────────────┐
 │                    Spring Boot Backend                       │
 │  • GameEngineService (In-memory state: ConcurrentHashMap)    │
 │  • SimpMessagingTemplate (STOMP over SockJS)                │
 └──────────────────────────────┬───────────────────────────────┘
                                ▲ (Hides secret roles)
                                │ Subscribes to /topic/room/{code}
   ┌────────────────────────────┴────────────────────────────┐
   │                   Players (Player Phones)               │
   └─────────────────────────────────────────────────────────┘
```

- **Backend:** Spring Boot 3 app running Java 17/26. Rooms live in memory (`ConcurrentHashMap`), making deployment instant with zero database setup.
- **Frontend:** React + TypeScript + Vite + TailwindCSS + Framer Motion.
- **Real-Time Push:** WebSockets push state snapshots after every action, ensuring all phones update simultaneously without polling.

---

## 2. Role Distribution & Host (God) Isolation

The room creator automatically becomes the **Host / God** (Narrator).

- **Host Exclusion:** When the game starts in [`GameEngineService.java`](file:///Users/swapnilsaurav/PlayMafia/backend/src/main/java/com/playmafia/service/GameEngineService.java#L99-L143), the host is filtered out of the deck assignment (`!p.isHost()`).
- **Narrator Status:** God is assigned `role = null`, remains alive as an untouchable supervisor, and cannot be targeted for kills, saves, investigations, or vote-outs.
- **Player Deck:** Active player slots are randomly assigned roles (`MAFIA`, `DOCTOR`, `DETECTIVE`, `BODYGUARD`, `JESTER`, `VILLAGER`).

---

## 3. Game Loop & State Machine

The game flows sequentially through strict phases:

```
WAITING / CONFIG ──► ROLE_REVEAL ──► NIGHT ──► DAY ──► VOTING ──► RESULT ──► NIGHT ... ──► GAME_END
```

| Phase | Description |
| :--- | :--- |
| `WAITING` / `CONFIG` | Lobby setup. Host selects role counts on [`ConfigPage.tsx`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/pages/ConfigPage.tsx). |
| `ROLE_REVEAL` | Players flip a 3D card on [`RoleReveal.tsx`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/pages/RoleReveal.tsx) to see their secret role and tap **Ready**. When everyone is ready, the game enters `NIGHT 1`. |
| `NIGHT` | Night actions. Most players see a dark screen while God records night actions and Detective performs a secret check. |
| `DAY` | Morning arrives with a chime audio alert. Players discuss night outcomes logged in the public room log. |
| `VOTING` | Town discussion & voting. Host executes the town's chosen vote-out on [`GodScreen.tsx`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/pages/GodScreen.tsx). |
| `RESULT` | Summary of the round. God advances the room to the next `NIGHT`. |
| `GAME_END` | Winner declared (`Town`, `Mafia`, or `Jester`). All roles are revealed to everyone on [`Result.tsx`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/pages/Result.tsx). |

---

## 4. Night Phase & Detective Digital Checks

### A. Player Screen Behavior ([`PlayerScreen.tsx`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/pages/PlayerScreen.tsx#L48-L100))
- **Villagers, Mafia, Doctor, Bodyguard & Jester:** All see the dark night screen (`🌙 Night - Close your eyes. Please wait...`).
- **Detective:** The Detective receives an interactive night screen on their phone allowing them to select a suspect. Upon selection, the target's alignment (e.g. `Mafia (MAFIA)` or `Villager (TOWN)`) is displayed **strictly on the Detective's device**.

### B. God Screen & Supervision Panel ([`GodScreen.tsx`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/pages/GodScreen.tsx#L50-L71))
God narrates the night ("Mafia wake up... Doctor wake up...") and inputs real-life choices:
- `Set Mafia Target`: Records the player targeted for elimination.
- `Set Doctor Target`: Records the player targeted for protection (disabled until Mafia target is selected).
- **Live Supervision Status Panel:** Real-time summary card updating on God's phone as actions take place:
  - 🔪 **Mafia action:** Killed [Player A]
  - 🩺 **Doctor action:** Saved [Player B]
  - 🔍 **Detective action:** Suspected [Player C] *(updates live via WebSocket when Detective taps their screen)*

---

## 5. Morning Audio Chime & Phase Transitions

When God clicks **"Start Day"**, [`advancePhase`](file:///Users/swapnilsaurav/PlayMafia/backend/src/main/java/com/playmafia/service/GameEngineService.java#L197-L235) resolves the night actions:
1. If Doctor/Bodyguard protected the Mafia target, the attack is prevented (`"An attack was prevented during the night."`).
2. Otherwise, the targeted player dies (`"[Player] died at night."`).
3. Night targets are reset, round advances, and phase changes to `DAY`.

### Web Audio API Chime ([`sound.ts`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/utils/sound.ts))
Transitioning from `NIGHT` to `DAY` triggers `playMorningSound()`. This synthesizes an ascending major C-major arpeggio chime (C5 ➔ E5 ➔ G5 ➔ C6) using the native browser **Web Audio API**. It is completely offline, lightweight, and requires no external MP3/WAV assets.

---

## 6. WebSocket Protocol & STOMP Infrastructure

PlayMafia layers **STOMP** over **SockJS** for real-time messaging.

### Backend Configuration ([`WebSocketConfig.java`](file:///Users/swapnilsaurav/PlayMafia/backend/src/main/java/com/playmafia/config/WebSocketConfig.java))
```java
@Override
public void configureMessageBroker(MessageBrokerRegistry config) {
    config.enableSimpleBroker("/topic");
    config.setApplicationDestinationPrefixes("/app");
}

@Override
public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws")
            .setAllowedOrigins(allowedOrigins)
            .withSockJS();
}
```

### STOMP Client Setup ([`socket.ts`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/socket/socket.ts))
```typescript
export function createStompClient(
  subscriptions: { destination: string; handler: (body: unknown) => void }[],
  onStatus?: (connected: boolean) => void
): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS("/ws") as unknown as WebSocket,
    reconnectDelay: 2000,
    onConnect: () => {
      onStatus?.(true);
      for (const sub of subscriptions) {
        client.subscribe(sub.destination, (message) => {
          sub.handler(JSON.parse(message.body));
        });
      }
    },
  });
  client.activate();
  return client;
}
```

---

## 7. Topic-Based Security & Data Isolation

To prevent cheating, server broadcasts use distinct WebSocket channels:

| Topic Destination | Subscriber | Included Payload | Role Visibility |
| :--- | :--- | :--- | :--- |
| `/topic/room/{code}` | Regular Players | `RoomView` | Secret roles & night targets are **hidden (`null`)**. |
| `/topic/god/{code}` | Host (God) | `RoomView` | All secret roles & live night target IDs are **included**. |
| `/topic/player/{playerId}` | Individual Player | `RoleView` | Private message containing only that player's secret role. |

In the frontend custom hook [`useRoom.ts`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/hooks/useRoom.ts#L23-L27), topic selection is handled automatically:
```typescript
const destination = hostId ? `/topic/god/${code}` : `/topic/room/${code}`;
```

---

## 8. Connection Resilience & Reconnection Strategy

- **Initial Seeding:** Before the WebSocket connection completes, [`useRoom.ts`](file:///Users/swapnilsaurav/PlayMafia/frontend/src/hooks/useRoom.ts#L20-L21) fetches a REST snapshot (`/api/rooms/{code}`) so the UI renders instantly without waiting for socket handshakes.
- **Automatic Reconnection:** If a phone locks its screen or briefly drops Wi-Fi connection, STOMP automatically retries every 2000ms (`reconnectDelay: 2000`) and resubscribes to the topic.
- **Polyfill Fix:** An inline script in [`index.html`](file:///Users/swapnilsaurav/PlayMafia/frontend/index.html#L12-L18) defines `window.global = window`, preventing `ReferenceError: global is not defined` crashes when SockJS executes in Vite browser environments.
