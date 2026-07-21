import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen, Title, Button } from "../components/UI";
import { api } from "../api/api";
import { useIdentity } from "../store/store";

export default function JoinRoom() {
  const nav = useNavigate();
  const params = useParams();
  const setIdentity = useIdentity((s) => s.setIdentity);
  const [code, setCode] = useState((params.code ?? "").toUpperCase());
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function join() {
    if (code.trim().length < 4) return setError("Enter a valid room code");
    if (!name.trim()) return setError("Enter your name");
    setBusy(true);
    setError("");
    try {
      const res = await api.joinRoom(code.trim().toUpperCase(), name.trim());
      setIdentity(res.roomCode, res.playerId, false);
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
      <Title sub="Ask the host for the 6-character room code.">Join Room</Title>

      <div className="flex flex-col gap-3">
        <input
          className="ios-input text-center text-2xl font-semibold tracking-[0.3em]"
          placeholder="CODE"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <input
          className="ios-input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {error && <p className="mt-3 text-center text-ios-red">{error}</p>}

      <div className="flex-1" />
      <Button onClick={join} disabled={busy}>
        {busy ? "Joining…" : "Join"}
      </Button>
    </Screen>
  );
}
