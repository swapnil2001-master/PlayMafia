import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Screen, Button } from "../components/UI";
import { useIdentity } from "../store/store";

export default function Home() {
  const nav = useNavigate();
  const { code } = useIdentity();

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mb-4 text-7xl"
        >
          🕵️
        </motion.div>
        <h1 className="text-5xl font-bold tracking-tight">PlayMafia</h1>
        <p className="mt-2 text-white/50">The classic party game, on your phones.</p>
      </div>

      <div className="flex flex-col gap-3 pb-4">
        <Button onClick={() => nav("/create")}>Create Room</Button>
        <Button variant="secondary" onClick={() => nav("/join")}>
          Join Room
        </Button>
        {code && (
          <button
            onClick={() => nav(`/room/${code}`)}
            className="mt-2 text-center text-ios-blue"
          >
            Return to room {code}
          </button>
        )}
      </div>
    </Screen>
  );
}
