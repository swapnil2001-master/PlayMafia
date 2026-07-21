import type { GameConfig, JoinResponse, RoleView, RoomView } from "../types";

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  createRoom: (hostName: string, roomName: string) =>
    req<JoinResponse>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ hostName, roomName }),
    }),

  joinRoom: (code: string, name: string) =>
    req<JoinResponse>(`/api/rooms/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getRoom: (code: string) => req<RoomView>(`/api/rooms/${code}`),

  getGodView: (code: string, hostId: string) =>
    req<RoomView>(`/api/rooms/${code}/god?hostId=${hostId}`),

  getRole: (code: string, playerId: string) =>
    req<RoleView>(`/api/rooms/${code}/role?playerId=${playerId}`),

  updateConfig: (code: string, hostId: string, config: GameConfig) =>
    req<void>(`/api/rooms/${code}/config?hostId=${hostId}`, {
      method: "POST",
      body: JSON.stringify(config),
    }),

  start: (code: string, hostId: string) =>
    req<void>(`/api/rooms/${code}/start?hostId=${hostId}`, { method: "POST" }),

  ready: (code: string, playerId: string) =>
    req<void>(`/api/rooms/${code}/ready?playerId=${playerId}`, { method: "POST" }),

  kill: (code: string, hostId: string, targetId: string) =>
    req<void>(`/api/rooms/${code}/kill`, {
      method: "POST",
      body: JSON.stringify({ hostId, targetId }),
    }),

  revive: (code: string, hostId: string, targetId: string) =>
    req<void>(`/api/rooms/${code}/revive`, {
      method: "POST",
      body: JSON.stringify({ hostId, targetId }),
    }),

  voteOut: (code: string, hostId: string, targetId: string) =>
    req<void>(`/api/rooms/${code}/voteout`, {
      method: "POST",
      body: JSON.stringify({ hostId, targetId }),
    }),

  advance: (code: string, hostId: string) =>
    req<void>(`/api/rooms/${code}/advance?hostId=${hostId}`, { method: "POST" }),

  end: (code: string, hostId: string, winner: string) =>
    req<void>(`/api/rooms/${code}/end?hostId=${hostId}&winner=${winner}`, {
      method: "POST",
    }),

  leave: (code: string, playerId: string) =>
    req<void>(`/api/rooms/${code}/leave?playerId=${playerId}`, { method: "POST" }),
};
