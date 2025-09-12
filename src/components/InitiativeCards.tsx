import React, { useMemo } from "react";
import type { Combatant } from "../types";
import { saveState } from "../lib/storage";
import { d20 } from "../lib/dice";

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
  round: number;
  setRound: (n: number) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

export default function InitiativeCards({
  combatants,
  setCombatants,
  round,
  setRound,
  activeId,
  setActiveId,
}: Props) {
  const ordered = useMemo(
    () =>
      [...combatants].sort(
        (a, b) => (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity)
      ),
    [combatants]
  );

  function rollAll() {
    const next = combatants.map(c => ({
      ...c,
      initiative: d20(c.initMod).total,
    }));
    setCombatants(next);
    const first =
      [...next].sort(
        (a, b) => (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity)
      )[0]?.id ?? null;
    setActiveId(first);
    setRound(1);
    saveState({ combatants: next, round: 1, activeId: first });
  }

  function nextTurn() {
    if (ordered.length === 0) return;
    const idx = ordered.findIndex(c => c.id === activeId);
    const nextId = ordered[(idx + 1) % ordered.length]?.id ?? null;
    const nextRound = (idx + 1) % ordered.length === 0 ? round + 1 : round;
    setActiveId(nextId);
    setRound(nextRound);
    saveState({ combatants, round: nextRound, activeId: nextId });
  }

  return (
    <section id="initiative" className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">🏁 Initiative</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={rollAll}>
            Roll all
          </button>
          <button className="btn" onClick={nextTurn}>
            Next ▶
          </button>
        </div>
        <span className="badge">Round {round}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {ordered.map(c => (
          <div
            key={c.id}
            className={`card flex-1 min-w-[200px] ${
              c.id === activeId ? "border-indigo-500 ring-2 ring-indigo-500/50" : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">{c.name}</span>
              <span className="badge">Init {c.initiative ?? "-"}</span>
            </div>
            <div className="text-sm text-slate-300">
              HP {c.hp}/{c.maxHp} • AC {c.ac} • {c.type}
            </div>
          </div>
        ))}
        {ordered.length === 0 && (
          <div className="text-slate-400">Roll initiative to start combat!</div>
        )}
      </div>
    </section>
  );
}
