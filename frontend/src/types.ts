export type Phase =
  | "WAITING"
  | "CONFIG"
  | "ROLE_REVEAL"
  | "NIGHT"
  | "DAY"
  | "VOTING"
  | "RESULT"
  | "GAME_END";

export interface GameConfig {
  mafia: number;
  doctor: number;
  detective: number;
  bodyguard: number;
  jester: number;
  anonymousVoting: boolean;
  revealRolesAtEnd: boolean;
}

export interface PlayerView {
  id: string;
  name: string;
  host: boolean;
  alive: boolean;
  ready: boolean;
  role: string | null;
  team: string | null;
}

export interface RoomView {
  code: string;
  name: string;
  hostId: string;
  phase: Phase;
  round: number;
  winner: string | null;
  config: GameConfig;
  players: PlayerView[];
  log: string[];
}

export interface RoleView {
  role: string;
  label: string;
  description: string;
  team: string;
}

export interface JoinResponse {
  roomCode: string;
  playerId: string;
  host: boolean;
}
