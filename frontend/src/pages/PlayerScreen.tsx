import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIdentity } from "../store/store";
import { api } from "../api/api";
import type { RoomView, RoleView } from "../types";

const phaseUI: Record<string, { emoji: string; title: string; sub: string }> = {
  NIGHT: { emoji: "🌙", title: "Night", sub: "Close your eyes. Please wait…" },
  DAY: { emoji: "☀️", title: "Day", sub: "Discuss who the Mafia might be." },
  VOTING: { emoji: "🗳️", title: "Voting", sub: "Decide together who to vote out." },
  RESULT: { emoji: "📣", title: "Result", sub: "Here's what happened." },
};

export default function PlayerScreen({ room }: { room: RoomView }) {
  const { code, playerId } = useIdentity();
  const me = room.players.find((p) => p.id === playerId);
  const ui = phaseUI[room.phase] ?? phaseUI.NIGHT;
  const lastEvent = room.log[room.log.length - 1];

  const [myRole, setMyRole] = useState<RoleView | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [investigationResult, setInvestigationResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code && playerId) {
      api.getRole(code, playerId).then(setMyRole).catch(() => {});
    }
  }, [code, playerId]);

  // Reset local submission states when phase or round changes
  useEffect(() => {
    setSubmitted(null);
    setInvestigationResult(null);
    setError(null);
  }, [room.phase, room.round]);

  if (me && !me.alive) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="text-7xl">👻</div>
        <h1 className="mt-4 text-3xl font-bold">You're out</h1>
        <p className="mt-2 text-white/50">Stay quiet and watch the rest play out.</p>
      </div>
    );
  }

  // Handle active interactive Night actions
  if (room.phase === "NIGHT" && myRole) {
    const isDetective = myRole.role === "DETECTIVE";
    if (isDetective) {
      if (submitted) {
        return (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
            <div className="text-7xl">🔍</div>
            <h1 className="mt-4 text-2xl font-bold text-ios-blue">Investigation Complete</h1>
            {investigationResult && (
              <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xs">
                <p className="text-sm text-white/50">Suspect alignment:</p>
                <p className="text-xl font-bold mt-1">{submitted} is {investigationResult}</p>
              </div>
            )}
            <p className="mt-4 text-sm text-white/40">Waiting for morning to arise...</p>
          </div>
        );
      }

      const targets = room.players.filter((p) => p.alive && !p.host && p.id !== playerId);
      return (
        <div className="flex flex-1 flex-col">
          <div className="text-center py-4">
            <span className="rounded-full bg-ios-blue/20 px-3 py-1 text-sm text-ios-blue font-semibold">
              ROLE: DETECTIVE 🔍
            </span>
            <h1 className="mt-3 text-2xl font-bold">Select player to suspect</h1>
            {error && <p className="mt-2 text-sm text-ios-red">{error}</p>}
          </div>
          <div className="mt-2 flex-1 overflow-y-auto ios-card divide-y divide-white/5">
            {targets.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[17px] font-medium">{p.name}</span>
                <button
                  onClick={() =>
                    api
                      .submitDetectiveAction(code!, playerId!, p.id)
                      .then((res) => {
                        setSubmitted(p.name);
                        setInvestigationResult(`${res.label} (${res.team.toUpperCase()})`);
                      })
                      .catch((err) => setError(err.message))
                  }
                  className="rounded-full bg-ios-blue px-4 py-1.5 text-sm font-semibold text-white active:opacity-75"
                >
                  Suspect 🔍
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // Fallback for Villagers / other non-action roles, or daytime screens
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        key={room.phase}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="text-8xl"
      >
        {ui.emoji}
      </motion.div>
      <h1 className="mt-6 text-4xl font-bold">
        {ui.title} {room.round}
      </h1>
      <p className="mt-2 max-w-xs text-white/50">{ui.sub}</p>

      {lastEvent && (
        <motion.div
          key={lastEvent}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-8 rounded-2xl bg-white/5 px-5 py-3 text-white/80"
        >
          {lastEvent}
        </motion.div>
      )}
    </div>
  );
}
