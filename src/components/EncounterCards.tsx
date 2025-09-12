import React from "react";
import type { Combatant, Attack,Status } from "../types";
import { saveState } from "../lib/storage";
import { d20, rollDice } from "../lib/dice";

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
};

export default function EncounterCards({ combatants, setCombatants }: Props) {
  function update(c: Combatant) {
    const next = combatants.map(x => (x.id === c.id ? c : x));
    setCombatants(next);
    saveState({ combatants: next, round: 1, activeId: null });
  }

  function adjustHP(c: Combatant, delta: number) {
    const next = combatants.map(x =>
      x.id === c.id
        ? {
            ...c,
            hp: Math.min(c.maxHp, Math.max(0, c.hp + delta)),
          }
        : x
    );
    setCombatants(next);
    saveState({ combatants: next, round: 1, activeId: null });
  }

  function rollAttack(c: Combatant, a: Attack) {
    const hit = d20(a.toHitMod);
    const dmg = rollDice(a.damage);
    alert(
      `${c.name} → ${a.name}\nTo-hit: ${hit.total} (${hit.parts.join(
        " "
      )})\nDamage: ${dmg.total} (${dmg.parts.join(" ")})`
    );
  }

  return (
    <section id="encounter" className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-lg font-semibold mb-3">🧙 Encounter</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {combatants.map(c => (
          <div
            key={c.id}
            className={`card border-2 ${
              c.type === "PC"
                ? "border-blue-500"
                : c.type === "NPC"
                ? "border-green-500"
                : "border-red-500"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <input
                className="input font-bold"
                value={c.name}
                onChange={e => update({ ...c, name: e.target.value })}
              />
              <span className="badge">{c.type}</span>
            </div>

            <div className="mb-2">
              <label className="label">HP</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-3 bg-green-500"
                    style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                  ></div>
                </div>
                <span className="font-mono text-sm">
                  {c.hp}/{c.maxHp}
                </span>
              </div>
              <div className="flex gap-1 mt-1">
                <button className="btn px-2 py-1" onClick={() => adjustHP(c, +1)}>
                  +1
                </button>
                <button className="btn px-2 py-1" onClick={() => adjustHP(c, -1)}>
                  -1
                </button>
              </div>
            </div>

            <div className="flex gap-3 text-sm text-slate-300 mb-2">
              <div>🛡 AC {c.ac}</div>
              <div>🎲 Init {c.initiative ?? c.initMod}</div>
            </div>

                        {c.status && c.status.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
                {c.status.map((st, i) => (
                <span key={i} className="badge bg-yellow-800">
                    {st}
                </span>
                ))}
            </div>
            )}


            <div className="space-y-1">
              {c.attacks.map(a => (
                <div key={a.id} className="flex gap-2 items-center">
                  <button className="btn flex-1" onClick={() => rollAttack(c, a)}>
                    {a.name} ⚔️
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {combatants.length === 0 && (
          <div className="text-slate-400">No combatants yet. Add some first!</div>
        )}
      </div>
    </section>
  );
}
