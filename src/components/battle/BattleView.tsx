// src/components/battle/BattleView.tsx
import React, { useState } from "react";
import type { Combatant, LogEntry } from "../../types";
import TurnOrder from "./TurnOrder";
import ActionCard from "./ActionCard";
import BattleLog from "./BattleLog";

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
  round: number;
  setRound: (n: number) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  log: LogEntry[];
  setLog: React.Dispatch<React.SetStateAction<LogEntry[]>>;
};

export default function BattleView({
  combatants,
  setCombatants,
  round,
  setRound,
  activeId,
  setActiveId,
  log,
  setLog,
}: Props) {
  const [bgInput, setBgInput] = useState<string>("");

  function applyBackground() {
    const v = bgInput.trim();
    if (!v) return;
    document.body.style.background = v;
  }

  function handleLogEntry(entry: LogEntry) {
    setLog((prev) => [entry, ...prev].slice(0, 200));
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Turn Order / Initiative Controls */}
      <TurnOrder
        combatants={combatants}
        setCombatants={setCombatants}
        round={round}
        setRound={setRound}
        activeId={activeId}
        setActiveId={setActiveId}
        onLogEntry={handleLogEntry}
      />

      {/* Background Color Control */}
      {/* <div className="flex items-center gap-2 justify-end">
        <input
          className="input w-40"
          placeholder="rgb(15,23,42) or #0f172a"
          value={bgInput}
          onChange={(e) => setBgInput(e.target.value)}
        />
        <button className="btn-normal" onClick={applyBackground}>
          Apply BG
        </button>
      </div> */}

      {/* Main Action Card */}
      <ActionCard
        combatants={combatants}
        setCombatants={setCombatants}
        round={round}
        activeId={activeId}
        onLogEntry={handleLogEntry}
      />

      {/* Battle Log */}
      <BattleLog log={log} setLog={setLog} />
    </section>
  );
}
