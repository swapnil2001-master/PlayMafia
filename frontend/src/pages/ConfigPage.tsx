import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen, Title, Button, Stepper, Toggle, Divider } from "../components/UI";
import { api } from "../api/api";
import { useIdentity } from "../store/store";
import { useRoom } from "../hooks/useRoom";
import type { GameConfig } from "../types";

export default function ConfigPage() {
  const nav = useNavigate();
  const { code, playerId } = useIdentity();
  const { room } = useRoom(code, playerId);
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!room) {
    return (
      <Screen>
        <div className="flex flex-1 items-center justify-center text-white/40">Loading…</div>
      </Screen>
    );
  }

  const config = cfg ?? room.config;
  const players = room.players.length;
  const special = config.mafia + config.doctor + config.detective + config.bodyguard + config.jester;
  const villagers = players - special;
  const valid = villagers >= 0 && config.mafia >= 1 && players >= 3;

  const set = (patch: Partial<GameConfig>) => setCfg({ ...config, ...patch });

  async function start() {
    if (!code || !playerId || !valid) return;
    setBusy(true);
    setError("");
    try {
      await api.updateConfig(code, playerId, config);
      await api.start(code, playerId);
      nav(`/room/${code}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Screen>
      <button onClick={() => nav(`/room/${code}`)} className="mb-2 self-start text-ios-blue">
        ‹ Lobby
      </button>
      <Title sub={`${players} players in the room`}>Roles</Title>

      <div className="ios-card divide-y divide-white/5">
        <Stepper label="🔪 Mafia" value={config.mafia} min={1} onChange={(v) => set({ mafia: v })} />
        <Stepper label="🩺 Doctor" value={config.doctor} onChange={(v) => set({ doctor: v })} />
        <Stepper label="🔍 Detective" value={config.detective} onChange={(v) => set({ detective: v })} />
        <Stepper label="🛡️ Bodyguard" value={config.bodyguard} onChange={(v) => set({ bodyguard: v })} />
        <Stepper label="🃏 Jester" value={config.jester} onChange={(v) => set({ jester: v })} />
      </div>

      <div
        className={`mt-3 flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] ${
          valid ? "bg-white/5 text-white/70" : "bg-ios-red/15 text-ios-red"
        }`}
      >
        <span>👤 Villagers (auto)</span>
        <span className="font-semibold tabular-nums">
          {villagers < 0 ? "too many roles" : villagers}
        </span>
      </div>

      <div className="mt-4 ios-card divide-y divide-white/5">
        <Toggle
          label="Anonymous voting"
          value={config.anonymousVoting}
          onChange={(v) => set({ anonymousVoting: v })}
        />
        <Divider />
        <Toggle
          label="Reveal roles at end"
          value={config.revealRolesAtEnd}
          onChange={(v) => set({ revealRolesAtEnd: v })}
        />
      </div>

      {error && <p className="mt-3 text-center text-ios-red">{error}</p>}

      <div className="flex-1" />
      <Button onClick={start} disabled={!valid || busy}>
        {busy ? "Starting…" : "Start Game"}
      </Button>
    </Screen>
  );
}
