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
        {room.players.map((p) => (
          <PlayerRow key={p.id} player={p} showRole onClick={() => setSelected(p)} />
        ))}
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
                <SheetButton
                  color="text-ios-red"
                  onClick={() => act(() => api.kill(code!, host, selected.id))}
                >
                  🔪 Kill (died at night)
                </SheetButton>
                <SheetButton
                  color="text-ios-orange"
                  onClick={() => act(() => api.voteOut(code!, host, selected.id))}
                >
                  🗳️ Vote out
                </SheetButton>
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
}: {
  children: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-4 text-center text-lg font-medium ${color} active:bg-white/5`}
    >
      {children}
    </button>
  );
}
