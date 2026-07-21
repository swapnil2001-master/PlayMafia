import type { PlayerView } from "../types";

const teamColor: Record<string, string> = {
  mafia: "text-ios-red",
  town: "text-ios-green",
  neutral: "text-ios-purple",
};

/** A single player row. Optionally shows role, ready state, and a tap action. */
export function PlayerRow({
  player,
  showRole = false,
  showReady = false,
  onClick,
  trailing,
}: {
  player: PlayerView;
  showRole?: boolean;
  showReady?: boolean;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${
        onClick ? "active:bg-white/5" : ""
      } ${!player.alive ? "opacity-40" : ""}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
        {player.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[17px] font-medium">{player.name}</span>
          {player.host && (
            <span className="rounded-full bg-ios-blue/20 px-2 py-0.5 text-xs text-ios-blue">
              Host
            </span>
          )}
          {!player.alive && <span className="text-xs text-white/40">☠️ out</span>}
        </div>
        {showRole && player.role && (
          <span className={`text-sm ${teamColor[player.team ?? ""] ?? "text-white/60"}`}>
            {player.role}
          </span>
        )}
      </div>
      {showReady &&
        (player.ready ? (
          <span className="text-ios-green">✓ Ready</span>
        ) : (
          <span className="text-white/30">…</span>
        ))}
      {trailing}
    </button>
  );
}
