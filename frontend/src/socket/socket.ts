import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Creates a STOMP client over SockJS. Subscriptions are registered on connect
 * so they survive reconnects automatically.
 */
export function createStompClient(
  subscriptions: { destination: string; handler: (body: unknown) => void }[],
  onStatus?: (connected: boolean) => void
): Client {
  const client = new Client({
    // SockJS handles the transport; the proxy forwards /ws to the backend.
    webSocketFactory: () => new SockJS("/ws") as unknown as WebSocket,
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
