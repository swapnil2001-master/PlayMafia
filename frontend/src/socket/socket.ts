import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const BASE = import.meta.env.VITE_API_BASE ?? "";

/**
 * Creates a STOMP client over SockJS. Subscriptions are registered on connect
 * so they survive reconnects automatically.
 */
export function createStompClient(
  subscriptions: { destination: string; handler: (body: unknown) => void }[],
  onStatus?: (connected: boolean) => void
): Client {
  const client = new Client({
    // SockJS handles the transport; uses BASE URL if configured for production.
    webSocketFactory: () => new SockJS(`${BASE}/ws`) as unknown as WebSocket,
    reconnectDelay: 2000,
    onConnect: () => {
      onStatus?.(true);
      for (const sub of subscriptions) {
        client.subscribe(sub.destination, (message: IMessage) => {
          try {
            sub.handler(message.body ? JSON.parse(message.body) : null);
          } catch {
            sub.handler(message.body);
          }
        });
      }
    },
    onWebSocketClose: () => onStatus?.(false),
  });
  client.activate();
  return client;
}
