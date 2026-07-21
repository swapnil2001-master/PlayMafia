import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/UI";
import { api } from "../api/api";
import { useIdentity } from "../store/store";
import type { RoleView, RoomView } from "../types";

const roleEmoji: Record<string, string> = {
  VILLAGER: "👤",
  MAFIA: "🔪",
  DOCTOR: "🩺",
  DETECTIVE: "🔍",
  BODYGUARD: "🛡️",
  JESTER: "🃏",
};

export default function RoleReveal({ room }: { room: RoomView }) {
  const { code, playerId } = useIdentity();
  const [role, setRole] = useState<RoleView | null>(null);
  const [revealed, setRevealed] = useState(false);
  const me = room.players.find((p) => p.id === playerId);
  const iAmReady = me?.ready ?? false;

  useEffect(() => {
    if (code && playerId) api.getRole(code, playerId).then(setRole).catch(() => {});
  }, [code, playerId]);

  const ready = () => code && playerId && api.ready(code, playerId).catch(() => {});
  const readyCount = room.players.filter((p) => p.ready).length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-2 text-center text-white/50">
        Tap the card to see your secret role
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="[perspective:1200px]">
          <motion.button
            onClick={() => setRevealed(true)}
            className="relative h-72 w-56"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: revealed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
          >
            {/* Back of the card */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-3xl bg-gradient-to-br from-ios-blue to-ios-purple text-6xl shadow-card"
              style={{ backfaceVisibility: "hidden" }}
            >
              🕵️
            </div>
            {/* Face of the card */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/10 p-6 text-center backdrop-blur-xl"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <span className="text-6xl">{role ? roleEmoji[role.role] : "…"}</span>
              <span className="text-3xl font-bold">{role?.label ?? ""}</span>
              <span className="text-sm text-white/60">{role?.description}</span>
            </div>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-center text-ios-orange"
          >
            🤫 Keep this secret.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="pb-2 text-center text-sm text-white/40">
        {readyCount}/{room.players.length} players ready
      </div>
      <Button onClick={ready} disabled={!revealed || iAmReady} variant="success">
        {iAmReady ? "Waiting for others…" : "I'm Ready"}
      </Button>
    </div>
  );
}
