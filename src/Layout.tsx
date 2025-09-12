import React, { useState } from "react";

// NEW views
import RosterManager from "./components/RosterManager";
import BattleView from "./components/BattleView";

// Legacy views (keep working while you transition)
import EncounterCards from "./components/EncounterCards";
import InitiativeCards from "./components/InitiativeCards";

import DiceRoller from "./components/DiceRoller";
import type { Combatant } from "./types";

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
  round: number;
  setRound: (n: number) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded transition-colors ${
      active ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-200"
    }`}
  >
    {children}
  </button>
);

function Layout({
  combatants,
  setCombatants,
  round,
  setRound,
  activeId,
  setActiveId,
}: Props) {
  // Default to the new flow
  const [tab, setTab] = useState<
    "roster" | "battle" | "encounter" | "initiative" | "dice"
  >("roster");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100">
      {/* Header with Tabs */}
      <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-sm md:text-base font-semibold tracking-wide">
              ⚔️ DnD Combat Manager
            </h1>
            <nav className="flex flex-wrap gap-2 text-sm">
              {/* New flow tabs */}
              <TabButton active={tab === "roster"} onClick={() => setTab("roster")}>
                🧙 Roster
              </TabButton>
              <TabButton active={tab === "battle"} onClick={() => setTab("battle")}>
                🏁 Battle
              </TabButton>

              {/* Legacy tabs (keep for now) */}
              {/* <TabButton
                active={tab === "encounter"}
                onClick={() => setTab("encounter")}
              >
                📋 Encounter (old)
              </TabButton>
              <TabButton
                active={tab === "initiative"}
                onClick={() => setTab("initiative")}
              >
                ⏱️ Initiative (old)
              </TabButton> */}

              {/* Dice tab */}
              {/* <TabButton active={tab === "dice"} onClick={() => setTab("dice")}>
                🎲 Dice567890
              </TabButton> */}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* New flow */}
        {tab === "roster" && (
          <RosterManager combatants={combatants} setCombatants={setCombatants} />
        )}

        {tab === "battle" && (
          <BattleView
            combatants={combatants}
            setCombatants={setCombatants}
            round={round}
            setRound={setRound}
            activeId={activeId}
            setActiveId={setActiveId}
          />
        )}

        {/* Legacy flow (still available) */}
        {tab === "encounter" && (
          <EncounterCards combatants={combatants} setCombatants={setCombatants} />
        )}

        {tab === "initiative" && (
          <InitiativeCards
            combatants={combatants}
            setCombatants={setCombatants}
            round={round}
            setRound={setRound}
            activeId={activeId}
            setActiveId={setActiveId}
          />
        )}

        {/* Dice */}
        {tab === "dice" && <DiceRoller />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-xs text-slate-500">
        Local-only • Autosaves in your browser • Export/Import JSON
      </footer>
    </div>
  );
}

export default Layout;
