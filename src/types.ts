export type TeamId = 1 | 2 | 3 | 4 | 5;

export type Status =
  | "Normal"
  | "Paralyzed"
  | "Prone"
  | "Stunned"
  | "Poisoned"
  | "Restrained"
  | "Blinded"
  | "Frightened"
  | "Grappled"
  | "Unconscious";

export type Attack = {
  id: string;
  name: string;
  toHitMod: number;
  damage: string; // e.g. "1d8+3"
};

export type Combatant = {
  id: string;
  name: string;
  type: "PC" | "NPC" | "Monster";
  team?: TeamId;          // team number (1..5)
  inEncounter?: boolean;  // include in current fight
  speed?: number;
  status?: Status[];
  ac: number;
  hp: number;
  maxHp: number;
  initMod: number;
  initiative?: number;
  attacks: Attack[];
};

export type AppState = {
  combatants: Combatant[];
  round: number;
  activeId: string | null;
  log: LogEntry[];
};

/** UI prefs for the battle log */
export type LogSettings = {
  newestFirst: boolean;
  compact: boolean;
};

/** A single structured battle log line */
export type LogEntry = {
  id: string;
  ts: number;

  attackerId: string;
  attackerName: string;
  attackerTeam: TeamId;

  targetId: string;
  targetName: string;
  targetTeam: TeamId;

  toHitMod: number;
  raw: number;         // natural d20
  parts: string;       // details of roll
  total: number;       // raw + mod
  passed: boolean;     // hit or miss
  isCrit: boolean;     // nat 20
  isFumble: boolean;   // nat 1

  damage?: number;     // present only on hit
  died?: boolean;      // target dropped to 0 HP
};