import { useEffect, useRef, useState } from "react";
import type { Client } from "@stomp/stompjs";
import { createStompClient } from "../socket/socket";
import { api } from "../api/api";
import type { RoomView } from "../types";

/**
 * Subscribes to a room's live state. When {@code hostId} is provided, it also
 * subscribes to the God topic (which includes every player's role).
 */
export function useRoom(code: string | null, hostId?: string | null) {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!code) return;

    // Seed with a REST snapshot so the UI is not blank before the socket connects.
    const fetcher = hostId ? api.getGodView(code, hostId) : api.getRoom(code);
    fetcher.then(setRoom).catch(() => {});

    const destination = hostId ? `/topic/god/${code}` : `/topic/room/${code}`;
    const client = createStompClient(
      [{ destination, handler: (body) => setRoom(body as RoomView) }],
      setConnected
    );
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [code, hostId]);

  return { room, connected };
}
