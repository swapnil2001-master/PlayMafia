import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/UI";
import { PlayerRow } from "../components/PlayerRow";
import { useIdentity } from "../store/store";
import type { RoomView } from "../types";

const winnerUI: Record<string, { emoji: string; label: string; color: string }> = {
  town: { emoji: "🟢", label: "Town wins!", color: "text-ios-green" },
  mafia: { emoji: "🔴", label: "Mafia wins!", color: "text-ios-red" },
  jester: { emoji: "🃏", label: "The Jester wins!", color: "text-ios-purple" },
};

export default function Result({ room }: { room: RoomView }) {
  const nav = useNavigate();
  const clear = useIdentity((s) => s.clear);
  const win = winnerUI[room.winner ?? ""] ?? { emoji: "🏁", label: "Game over", color: "text-white" };
  const rolesKnown = room.players.some((p) => p.role);

  return (
    <div className="flex flex-1 flex-col">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="mt-6 text-center"
      >
        <div className="text-7xl">{win.emoji}</div>
        <h1 className={`mt-3 text-4xl font-bold ${win.color}`}>{win.label}</h1>
      </motion.div>

      {rolesKnown && (
        <div className="mt-6 ios-card divide-y divide-white/5 overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-sm uppercase tracking-wide text-white/40">
            Roles revealed
          </div>
          {room.players.map((p) => (
            <PlayerRow key={p.id} player={p} showRole />
          ))}
        </div>
      )}

      <div className="flex-1" />
      <Button
        onClick={() => {
          clear();
          nav("/");
        }}
      >
        Back to Home
      </Button>
    </div>
  );
}
