import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Local identity for this device. Persisted so a page refresh keeps you in the room. */
interface Identity {
  code: string | null;
  playerId: string | null;
  isHost: boolean;
  setIdentity: (code: string, playerId: string, isHost: boolean) => void;
  clear: () => void;
}

export const useIdentity = create<Identity>()(
  persist(
    (set) => ({
      code: null,
      playerId: null,
      isHost: false,
      setIdentity: (code, playerId, isHost) => set({ code, playerId, isHost }),
      clear: () => set({ code: null, playerId: null, isHost: false }),
    }),
    { name: "playmafia-identity" }
  )
);
