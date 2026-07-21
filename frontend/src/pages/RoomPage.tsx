import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "../components/UI";
import { useIdentity } from "../store/store";
import { useRoom } from "../hooks/useRoom";
import { playMorningSound } from "../utils/sound";
import Lobby from "./Lobby";
import RoleReveal from "./RoleReveal";
import GodScreen from "./GodScreen";
import PlayerScreen from "./PlayerScreen";
import Result from "./Result";

export default function RoomPage() {
  const nav = useNavigate();
  const { code: routeCode } = useParams();
  const { code, playerId, isHost } = useIdentity();

  // Host subscribes to the God topic (roles included); players to the public one.
  const { room, connected } = useRoom(code, isHost ? playerId : undefined);

  const prevPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (room) {
      if (prevPhaseRef.current === "NIGHT" && room.phase === "DAY") {
        playMorningSound();
      }
      prevPhaseRef.current = room.phase;
    }
  }, [room?.phase]);

  // If we have no identity for this room, send the user to join it.
  useEffect(() => {
    if (routeCode && !playerId) nav(`/join/${routeCode}`);
  }, [routeCode, playerId, nav]);

  if (!room) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/40">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          {connected ? "Loading room…" : "Connecting…"}
        </div>
      </Screen>
    );
  }

  const inGame =
    room.phase === "NIGHT" ||
    room.phase === "DAY" ||
    room.phase === "VOTING" ||
    room.phase === "RESULT";

  return (
    <Screen>
      {(room.phase === "WAITING" || room.phase === "CONFIG") && <Lobby room={room} />}
      {room.phase === "ROLE_REVEAL" && <RoleReveal room={room} />}
      {inGame && (isHost ? <GodScreen room={room} /> : <PlayerScreen room={room} />)}
      {room.phase === "GAME_END" && <Result room={room} />}
    </Screen>
  );
}
