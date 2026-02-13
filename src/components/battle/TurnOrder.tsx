// src/components/battle/TurnOrder.tsx
import React from "react";
import type { Combatant, TeamId, LogEntry } from "../../types";
import { saveState } from "../../lib/storage";
import { d20 } from "../../lib/dice";
import { TEAM_BG_SOFT, TEAM_BG, uid } from "./battleTheme";

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
  round: number;
  setRound: (n: number) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  onLogEntry: (entry: LogEntry) => void;
};

export default function TurnOrder({ combatants, setCombatants, round, setRound, activeId, setActiveId, onLogEntry }: Props) {
  const pool = combatants.filter((c) => c.inEncounter);
  const ordered = [...pool].sort(
    (a, b) => (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity)
  );

  function rollAllInitiative() {
    const next = combatants.map((c) =>
      c.inEncounter ? { ...c, initiative: d20(c.initMod).total } : c
    );
    setCombatants(next);
    const after = next
      .filter((c) => c.inEncounter)
      .sort(
        (a, b) => (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity)
      );
    const firstId = after[0]?.id ?? null;
    setActiveId(firstId);
    setRound(1);
    saveState({ combatants: next, round: 1, activeId: firstId });
  }

  function nextTurn() {
    if (ordered.length === 0) return;
    const idx = ordered.findIndex((c) => c.id === activeId);
    const nextId = ordered[(idx + 1) % ordered.length]?.id ?? null;
    const wrapped = (idx + 1) % ordered.length === 0;
    const nextRound = wrapped ? round + 1 : round;

    setActiveId(nextId);
    setRound(nextRound);
    saveState({ combatants, round: nextRound, activeId: nextId });

    if (wrapped) {
      const entry: LogEntry = {
        id: uid(),
        ts: Date.now(),
        attackerId: "system",
        attackerName: "Round",
        attackerTeam: 1 as TeamId,
        targetId: "system",
        targetName: `${round} → ${nextRound}`,
        targetTeam: 1 as TeamId,
        actionType: undefined,
        hitorDC: 0,
        raw: 0,
        parts: "",
        total: 0,
        passed: true,
        isCrit: false,
        isFumble: false,
      };
      onLogEntry(entry);
    }
  }

  return (
    <div className="space-y-4 flex flex-col gap-3">
        {/* <h2 className="text-lg font-semibold">🏁 Battle</h2> */}
      <div className="flex items-center justify-around gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-normal" onClick={rollAllInitiative}>
            Roll initiative for all
          </button>
          <div className="badge">
            Round <strong className="ml-1">{round}</strong>
          </div>
          <button className="btn-normal" onClick={nextTurn}>
            Next ▶
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {ordered.map((c) => {
          const bloodied = c.hp <= Math.floor(c.maxHp / 2);
          const active = c.id === activeId;
          const team = (c.team ?? 1) as TeamId;

          return (
            <div
              key={c.id}
              className={`card min-w-[220px] ${TEAM_BG_SOFT[team]} ${
                active ? "ring-2 ring-indigo-400" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{c.name}</div>
                <div className="badge">Init {c.initiative ?? "-"}</div>
              </div>
              <div className="mt-2 text-sm text-slate-300 flex flex-wrap gap-3">
                <div>
                  🛡 AC <span className="font-mono">{c.ac}</span>
                </div>
                <div>
                  ❤️{" "}
                  <span
                    className={`font-mono ${
                      bloodied ? "text-red-400" : ""
                    }`}
                  >
                    {c.hp}/{c.maxHp}
                  </span>
                </div>
                <span className={`badge ${TEAM_BG[team]} text-white`}>
                  Team {team}
                </span>
              </div>
              {(c.status?.length ?? 0) > 0 && (
                <div className="mt-2 text-xs text-slate-400">
                  {c.status?.join(", ")}
                </div>
              )}
            </div>
          );
        })}

        {ordered.length === 0 && (
          <div className="text-slate-400">
            Pick combatants in Roster and toggle “In fight”, then roll
            initiative.
          </div>
        )}
      </div>
    </div>
  );
}
