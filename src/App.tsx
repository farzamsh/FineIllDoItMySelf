import React, { useEffect, useMemo, useState } from "react";
import { LogEntry, type AppState, type Combatant } from "./types";
import { loadState, saveState } from "./lib/storage";
import Layout from "./Layout";

const INITIAL: AppState = {
  combatants: [],
  round: 1,
  activeId: null,
  log: [],
};

export default function App() {
  const [combatants, setCombatants] = useState<Combatant[]>(
    loadState(INITIAL).combatants
  );
  const [round, setRound] = useState<number>(loadState(INITIAL).round);
  const [activeId, setActiveId] = useState<string | null>(
    loadState(INITIAL).activeId
  );
  const [log, setLog] = useState<LogEntry[]>(
    loadState(INITIAL).log ?? []
  );

  // Keep localStorage fresh on any change
  useEffect(() => {
    saveState({ combatants, round, activeId, log });
  }, [combatants, round, activeId, log]);

  // Seed with a sample encounter (optional)
  const hasNoData = useMemo(() => combatants.length === 0, [combatants.length]);
  useEffect(() => {
    if (hasNoData) {
      const sample: Combatant[] = [
        {
          id: (crypto as any)?.randomUUID?.() || "pc1",
          name: "Ari (PC)",
          type: "PC",
          ac: 15,
          hp: 27,
          maxHp: 27,
          initMod: 3,
          status: ["Normal"],
          attacks: [
            { id: "atk1", name: "Longsword", hitorDC: 5, damage: "1d8+3" },
          ],
        },
        {
          id: (crypto as any)?.randomUUID?.() || "m1",
          name: "Goblin",
          type: "Monster",
          ac: 15,
          hp: 7,
          maxHp: 7,
          initMod: 2,
          status: ["Normal"],
          attacks: [
            { id: "atk2", name: "Scimitar", hitorDC: 4, damage: "1d6+2" },
          ],
        },
      ];
      setCombatants(sample);
      saveState({ combatants: sample, round: 1, activeId: null, log: [] });
    }
  }, [hasNoData]);

  return (
    <Layout
      combatants={combatants}
      setCombatants={setCombatants}
      round={round}
      setRound={setRound}
      activeId={activeId}
      setActiveId={setActiveId}
      log={log}
      setLog={setLog}
    />
  );
}
