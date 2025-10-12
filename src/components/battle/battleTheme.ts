// src/components/battle/battleTheme.ts

import type { TeamId } from "../../types";

// Subtle team-tinted background (same idea as Roster soft BG)
export const TEAM_BG_SOFT: Record<TeamId, string> = {
  1: "bg-blue-500/10",
  2: "bg-red-500/10",
  3: "bg-emerald-500/10",
  4: "bg-purple-500/10",
  5: "bg-amber-500/10",
};

export const TEAM_BG: Record<TeamId, string> = {
  1: "bg-blue-600",
  2: "bg-red-600",
  3: "bg-emerald-600",
  4: "bg-purple-600",
  5: "bg-amber-600",
};

export const TEAM_TEXT: Record<TeamId, string> = {
  1: "text-blue-300",
  2: "text-red-300",
  3: "text-emerald-300",
  4: "text-purple-300",
  5: "text-amber-300",
};

// Utility for quick IDs in logs
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
