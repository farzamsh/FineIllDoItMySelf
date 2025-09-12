// src/components/EncounterTable.tsx
import React, { useMemo, useState } from 'react';
import type { Combatant, Attack, Status } from '../types';
import { saveState } from '../lib/storage';
import { d20, rollDice } from '../lib/dice';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
};

export default function EncounterTable({ combatants, setCombatants }: Props) {
  const [filter, setFilter] = useState('');
  const filtered = useMemo(
    () =>
      filter.trim()
        ? combatants.filter(c =>
            c.name.toLowerCase().includes(filter.toLowerCase())
          )
        : combatants,
    [combatants, filter]
  );

  function addCombatant() {
    const c: Combatant = {
      id: uid(),
      name: 'New',
      type: 'Monster',
      ac: 12,
      hp: 10,
      maxHp: 10,
      initMod: 2,
      status: [],
      attacks: [{ id: uid(), name: 'Claw', toHitMod: 4, damage: '1d6+2' }],
    };
    const next = [c, ...combatants];
    setCombatants(next);
    saveState({ combatants: next, round: 1, activeId: null });
  }

  function update(c: Combatant) {
    const next = combatants.map(x => (x.id === c.id ? c : x));
    setCombatants(next);
    saveState({ combatants: next, round: 1, activeId: null });
  }

  function remove(id: string) {
    const next = combatants.filter(c => c.id !== id);
    setCombatants(next);
    saveState({ combatants: next, round: 1, activeId: null });
  }

  function rollAttack(c: Combatant, a: Attack) {
    const hit = d20(a.toHitMod);
    const dmg = rollDice(a.damage);
    alert(
      `${c.name} → ${a.name}\nTo-hit: ${hit.total} (${hit.parts
        .filter(Boolean)
        .join(' ')})\nDamage: ${dmg.total} (${dmg.parts.join(' ')})`
    );
  }

  return (
    <section id="encounter" className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">🧙 Encounter</h2>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Filter by name…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <button className="btn" onClick={addCombatant}>
            + Add
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-300">
            <tr>
              <th className="py-2 pr-2">Name</th>
              <th className="py-2 pr-2">Type</th>
              <th className="py-2 pr-2">AC</th>
              <th className="py-2 pr-2">HP</th>
              <th className="py-2 pr-2">Init mod</th>
              <th className="py-2 pr-2">Conditions</th>
              <th className="py-2 pr-2">Attacks</th>
              <th className="py-2 pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(c => (
              <tr key={c.id} className="align-top">
                <td className="py-2 pr-2">
                  <input
                    className="input w-44"
                    value={c.name}
                    onChange={e => update({ ...c, name: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-2">
                  <select
                    className="select"
                    value={c.type}
                    onChange={e =>
                      update({ ...c, type: e.target.value as any })
                    }
                  >
                    <option>PC</option>
                    <option>NPC</option>
                    <option>Monster</option>
                  </select>
                </td>
                <td className="py-2 pr-2">
                  <input
                    className="input w-20"
                    type="number"
                    value={c.ac}
                    onChange={e =>
                      update({
                        ...c,
                        ac: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="input w-20"
                      type="number"
                      value={c.hp}
                      onChange={e =>
                        update({
                          ...c,
                          hp: parseInt(e.target.value || '0', 10),
                        })
                      }
                    />
                    <span className="text-slate-400">/</span>
                    <input
                      className="input w-20"
                      type="number"
                      value={c.maxHp}
                      onChange={e =>
                        update({
                          ...c,
                          maxHp: parseInt(e.target.value || '0', 10),
                        })
                      }
                    />
                  </div>
                </td>
                <td className="py-2 pr-2">
                  <input
                    className="input w-20"
                    type="number"
                    value={c.initMod}
                    onChange={e =>
                      update({
                        ...c,
                        initMod: parseInt(e.target.value || '0', 10),
                      })
                    }
                  />
                </td>
                <td className="py-2 pr-2">
                <input
                    className="input w-56"
                    placeholder="comma, separated"
                    value={(c.status ?? ["Normal"]).join(", ")}
                    onChange={(e) =>
                    update({
                        ...c,
                        status: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean) as Status[], // 👈 cast to Status[]
                    })
                    }
                />
                </td>
                <td className="py-2 pr-2">
                  <div className="flex flex-col gap-2">
                    {c.attacks.map(a => (
                      <div key={a.id} className="flex items-center gap-2">
                        <input
                          className="input w-36"
                          value={a.name}
                          onChange={e =>
                            update({
                              ...c,
                              attacks: c.attacks.map(x =>
                                x.id === a.id ? { ...a, name: e.target.value } : x
                              ),
                            })
                          }
                        />
                        <span className="label">toHit</span>
                        <input
                          className="input w-20"
                          type="number"
                          value={a.toHitMod}
                          onChange={e =>
                            update({
                              ...c,
                              attacks: c.attacks.map(x =>
                                x.id === a.id
                                  ? {
                                      ...a,
                                      toHitMod: parseInt(
                                        e.target.value || '0',
                                        10
                                      ),
                                    }
                                  : x
                              ),
                            })
                          }
                        />
                        <span className="label">dmg</span>
                        <input
                          className="input w-24"
                          value={a.damage}
                          onChange={e =>
                            update({
                              ...c,
                              attacks: c.attacks.map(x =>
                                x.id === a.id
                                  ? { ...a, damage: e.target.value }
                                  : x
                              ),
                            })
                          }
                        />
                        <button
                          className="btn"
                          onClick={() => rollAttack(c, a)}
                        >
                          Roll
                        </button>
                        <button
                          className="btn"
                          onClick={() =>
                            update({
                              ...c,
                              attacks: c.attacks.filter(x => x.id !== a.id),
                            })
                          }
                        >
                          Del
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn w-fit"
                      onClick={() =>
                        update({
                          ...c,
                          attacks: [
                            ...c.attacks,
                            {
                              id: uid(),
                              name: 'New Attack',
                              toHitMod: 0,
                              damage: '1d6',
                            },
                          ],
                        })
                      }
                    >
                      + Add attack
                    </button>
                  </div>
                </td>
                <td className="py-2 pr-2">
                  <button className="btn" onClick={() => remove(c.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="py-4 text-slate-400" colSpan={8}>
                  No combatants. Click \"+ Add\" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
