// src/components/InitiativeTracker.tsx
import React, { useMemo } from 'react';
import type { Combatant } from '../types';
import { saveState } from '../lib/storage';
import { d20 } from '../lib/dice';

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
  round: number;
  setRound: (n: number) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

export default function InitiativeTracker({
  combatants,
  setCombatants,
  round,
  setRound,
  activeId,
  setActiveId,
}: Props) {
  const ordered = useMemo(() => {
    return [...combatants].sort(
      (a, b) => (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity)
    );
  }, [combatants]);

  function rollAll() {
    const next = combatants.map(c => ({ ...c, initiative: d20(c.initMod).total }));
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

  function prevTurn() {
    if (ordered.length === 0) return;
    const idx = ordered.findIndex(c => c.id === activeId);
    const prevIndex = (idx - 1 + ordered.length) % ordered.length;
    const prevId = ordered[prevIndex]?.id ?? null;
    const prevRound = prevIndex === ordered.length - 1 ? Math.max(1, round - 1) : round;
    setActiveId(prevId);
    setRound(prevRound);
    saveState({ combatants, round: prevRound, activeId: prevId });
  }

  return (
    <section id="initiative" className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">🏁 Initiative</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={rollAll}>Roll all (d20+mod)</button>
          <button className="btn" onClick={prevTurn}>◀ Prev</button>
          <div className="badge">Round <strong className="ml-1">{round}</strong></div>
          <button className="btn" onClick={nextTurn}>Next ▶</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ordered.map(c => (
          <div
            key={c.id}
            className={`card ${c.id === activeId ? 'border-indigo-500 ring-2 ring-indigo-500/30' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.name}</div>
              <div className="badge">Init: {c.initiative ?? '-'}</div>
            </div>

            <div className="mt-2 text-sm text-slate-300 flex flex-wrap gap-3">
              <div>AC <span className="font-mono">{c.ac}</span></div>
              <div>HP <span className="font-mono">{c.hp}/{c.maxHp}</span></div>
              <div>Type <span className="font-mono">{c.type}</span></div>
            </div>

            {c.status && c.status.length > 0 && (
            <div className="mt-2 text-xs text-slate-400">
                {c.status.join(", ")}
            </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                className="btn"
                onClick={() => {
                  setActiveId(c.id);
                  saveState({ combatants, round, activeId: c.id });
                }}
              >
                Set active
              </button>

              <button
                className="btn"
                onClick={() => {
                  const heal = prompt('Heal amount (+) or damage (-):', '0');
                  if (heal === null) return;
                  const amt = parseInt(heal, 10);
                  if (Number.isNaN(amt)) return;
                  const next = combatants.map(x =>
                    x.id === c.id
                      ? { ...x, hp: Math.min(x.maxHp, Math.max(0, x.hp + amt)) }
                      : x
                  );
                  setCombatants(next);
                  saveState({ combatants: next, round, activeId });
                }}
              >
                ± HP
              </button>
            </div>
          </div>
        ))}

        {ordered.length === 0 && (
          <div className="text-slate-400">
            No combatants yet. Add some in the Encounter tab, then roll initiative.
          </div>
        )}
      </div>
    </section>
  );
}
