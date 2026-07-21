import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button, Divider } from "../components/UI";
import { PlayerRow } from "../components/PlayerRow";
import { useIdentity } from "../store/store";
import type { RoomView } from "../types";

export default function Lobby({ room }: { room: RoomView }) {
  const nav = useNavigate();
  const { playerId } = useIdentity();
  const isHost = playerId === room.hostId;
  const shareUrl = `${window.location.origin}/join/${room.code}`;

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
  }

  return (
    <>
      <div className="text-center">
        <p className="text-white/50">{room.name}</p>
        <h1 className="mt-1 text-5xl font-bold tracking-[0.15em]">{room.code}</h1>
      </div>

      <div className="mt-5 flex flex-col items-center">
        <div className="rounded-2xl bg-white p-3">
          <QRCodeSVG value={shareUrl} size={132} />
        </div>
        <button onClick={copyLink} className="mt-3 text-ios-blue">
          Copy invite link
        </button>
      </div>

      <div className="mt-5 ios-card divide-y divide-white/5 overflow-hidden">
        <div className="px-4 pt-3 pb-1 text-sm uppercase tracking-wide text-white/40">
          Players · {room.players.length}
        </div>
        {room.players.map((p) => (
          <PlayerRow key={p.id} player={p} />
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-3 pt-6">
        {isHost ? (
          <Button onClick={() => nav(`/room/${room.code}/config`)}>Configure Roles</Button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-4 text-white/50">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ios-green" />
            Waiting for the host to start…
          </div>
        )}
        <Divider />
        <button
          onClick={() => nav("/")}
          className="py-1 text-center text-ios-red/80"
        >
          Leave room
        </button>
      </div>
    </>
  );
}
