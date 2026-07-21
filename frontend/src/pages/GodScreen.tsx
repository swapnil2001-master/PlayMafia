import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/UI";
import { PlayerRow } from "../components/PlayerRow";
import { api } from "../api/api";
import { useIdentity } from "../store/store";
import type { PlayerView, RoomView } from "../types";

const phaseLabel: Record<string, string> = {
  NIGHT: "Night",
  DAY: "Day",
  VOTING: "Voting",
  RESULT: "Result",
};

const advanceLabel: Record<string, string> = {
  NIGHT: "Start Day",
  DAY: "Open Voting",
  VOTING: "Show Result",
  RESULT: "Next Night",
};

export default function GodScreen({ room }: { room: RoomView }) {
  const { code, playerId } = useIdentity();
  const [selected, setSelected] = useState<PlayerView | null>(null);
  const [showEnd, setShowEnd] = useState(false);

  const host = playerId!;
  const act = (fn: () => Promise<void>) => fn().catch(() => {}).finally(() => setSelected(null));

  const isMafiaAlive = room.players.some((p) => p.alive && p.role === "Mafia");
  const isDoctorAlive = room.players.some((p) => p.alive && p.role === "Doctor");
  const isDetectiveAlive = room.players.some((p) => p.alive && p.role === "Detective");
  const isBodyguardAlive = room.players.some((p) => p.alive && p.role === "Bodyguard");

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/50">God view · {room.code}</p>
          <h1 className="text-3xl font-bold">
            {phaseLabel[room.phase] ?? room.phase} {room.round}
          </h1>
        </div>
        <span className="rounded-full bg-ios-purple/20 px-3 py-1 text-sm text-ios-purple">
          Narrator
        </span>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto ios-card divide-y divide-white/5">
        <div className="px-4 pt-3 pb-1 text-sm uppercase tracking-wide text-white/40">
          Everyone's roles — keep this phone hidden
        </div>
        {room.players.map((p) => {
          const badges = [];
          if (room.mafiaTargetId === p.id) badges.push("🔪");
          if (room.doctorTargetId === p.id) badges.push("🩺");
          if (room.detectiveTargetId === p.id) badges.push("🔍");
          if (room.bodyguardTargetId === p.id) badges.push("🛡️");

          return (
            <PlayerRow
              key={p.id}
              player={p}
              showRole
              onClick={() => setSelected(p)}
              trailing={
                badges.length > 0 ? (
                  <div className="flex gap-1 text-sm bg-white/10 px-2 py-0.5 rounded-lg">
                    {badges.join(" ")}
                  </div>
                ) : undefined
              }
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Button onClick={() => act(() => api.advance(code!, host))}>
          {advanceLabel[room.phase] ?? "Next"}
        </Button>
        <Button variant="secondary" onClick={() => setShowEnd(true)}>
          End Game
        </Button>
      </div>

      {/* Per-player action sheet */}
      <AnimatePresence>
        {selected && (
          <ActionSheet title={selected.name} onClose={() => setSelected(null)}>
            {selected.alive ? (
              <>
                {/* Night Phase Actions */}
                {room.phase === "NIGHT" && (
                  <>
                    {isMafiaAlive && (
                      <SheetButton
                        color="text-ios-red"
                        onClick={() => act(() => api.setMafiaTarget(code!, host, selected.id))}
                      >
                        🔪 Set Mafia Target
                      </SheetButton>
                    )}
                    {isDoctorAlive && (
                      <SheetButton
                        color={room.mafiaTargetId ? "text-ios-green" : "text-white/30"}
                        disabled={!room.mafiaTargetId && isMafiaAlive}
                        onClick={() => act(() => api.setDoctorTarget(code!, host, selected.id))}
                      >
                        🩺 Set Doctor Target {!room.mafiaTargetId && isMafiaAlive && "(Set Mafia target first)"}
                      </SheetButton>
                    )}
                    {isDetectiveAlive && (
                      <SheetButton
                        color="text-ios-blue"
                        onClick={() => act(() => api.setDetectiveTarget(code!, host, selected.id))}
                      >
                        🔍 Set Detective Target
                      </SheetButton>
                    )}
                    {isBodyguardAlive && (
                      <SheetButton
                        color="text-ios-purple"
                        onClick={() => act(() => api.setBodyguardTarget(code!, host, selected.id))}
                      >
                        🛡️ Set Bodyguard Target
                      </SheetButton>
                    )}
                  </>
                )}

                {/* Day/Morning Actions (Morning only voting option) */}
                {room.phase !== "NIGHT" && (
                  <>
                    <SheetButton
                      color="text-ios-orange"
                      onClick={() => act(() => api.voteOut(code!, host, selected.id))}
                    >
                      🗳️ Vote out
                    </SheetButton>
                    <SheetButton
                      color="text-ios-red"
                      onClick={() => act(() => api.kill(code!, host, selected.id))}
                    >
                      🔪 Kill (manual override)
                    </SheetButton>
                  </>
                )}
              </>
            ) : (
              <SheetButton
                color="text-ios-green"
                onClick={() => act(() => api.revive(code!, host, selected.id))}
              >
                💚 Revive
              </SheetButton>
            )}
          </ActionSheet>
        )}
      </AnimatePresence>

      {/* Winner picker */}
      <AnimatePresence>
        {showEnd && (
          <ActionSheet title="Who won?" onClose={() => setShowEnd(false)}>
            {["town", "mafia", "jester"].map((w) => (
              <SheetButton
                key={w}
                color="text-white"
                onClick={() =>
                  api.end(code!, host, w).catch(() => {}).finally(() => setShowEnd(false))
                }
              >
                {w === "town" ? "🟢 Town" : w === "mafia" ? "🔴 Mafia" : "🟣 Jester"}
              </SheetButton>
            ))}
          </ActionSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ios-card overflow-hidden bg-[#1c1c1e]/95">
          <div className="px-4 py-3 text-center text-sm text-white/50">{title}</div>
          <div className="divide-y divide-white/5">{children}</div>
        </div>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl bg-[#1c1c1e]/95 py-4 text-lg font-semibold text-ios-blue"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

function SheetButton({
  children,
  color,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-4 text-center text-lg font-medium ${color} ${
        disabled ? "opacity-30 cursor-not-allowed" : "active:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
