import { motion } from "framer-motion";
import { useIdentity } from "../store/store";
import type { RoomView } from "../types";

const phaseUI: Record<string, { emoji: string; title: string; sub: string }> = {
  NIGHT: { emoji: "🌙", title: "Night", sub: "Close your eyes. Please wait…" },
  DAY: { emoji: "☀️", title: "Day", sub: "Discuss who the Mafia might be." },
  VOTING: { emoji: "🗳️", title: "Voting", sub: "Decide together who to vote out." },
  RESULT: { emoji: "📣", title: "Result", sub: "Here's what happened." },
};

export default function PlayerScreen({ room }: { room: RoomView }) {
  const { playerId } = useIdentity();
  const me = room.players.find((p) => p.id === playerId);
  const ui = phaseUI[room.phase] ?? phaseUI.NIGHT;
  const lastEvent = room.log[room.log.length - 1];

  if (me && !me.alive) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="text-7xl">👻</div>
        <h1 className="mt-4 text-3xl font-bold">You're out</h1>
        <p className="mt-2 text-white/50">Stay quiet and watch the rest play out.</p>
      </div>
    );
  }

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
