import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen, Title, Button } from "../components/UI";
import { api } from "../api/api";
import { useIdentity } from "../store/store";

export default function CreateRoom() {
  const nav = useNavigate();
  const setIdentity = useIdentity((s) => s.setIdentity);
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return setError("Enter your name");
    setBusy(true);
    setError("");
    try {
      const res = await api.createRoom(name.trim(), roomName.trim());
      setIdentity(res.roomCode, res.playerId, true);
      nav(`/room/${res.roomCode}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Screen>
      <button onClick={() => nav("/")} className="mb-2 self-start text-ios-blue">
        ‹ Back
      </button>
      <Title sub="You'll be the host and God for this game.">Create Room</Title>

      <div className="flex flex-col gap-3">
        <input
          className="ios-input"
          placeholder="Your name"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="ios-input"
          placeholder="Room name (optional)"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
      </div>

      {error && <p className="mt-3 text-center text-ios-red">{error}</p>}

      <div className="flex-1" />
      <Button onClick={create} disabled={busy}>
        {busy ? "Creating…" : "Create"}
      </Button>
    </Screen>
  );
}
