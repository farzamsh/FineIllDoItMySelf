import React, { useMemo, useState } from "react";
import type { Combatant, TeamId, Status } from "../types";
import { saveState } from "../lib/storage";

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// subtle team background colors
const TEAM_BG_SOFT: Record<TeamId, string> = {
  1: "bg-blue-500/10",
  2: "bg-red-500/10",
  3: "bg-emerald-500/10",
  4: "bg-purple-500/10",
  5: "bg-amber-500/10",
};

// stronger badge colors
const TEAM_BADGE: Record<TeamId, string> = {
  1: "bg-blue-600",
  2: "bg-red-600",
  3: "bg-emerald-600",
  4: "bg-purple-600",
  5: "bg-amber-600",
};

export default function RosterManager({ combatants, setCombatants }: Props) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return f ? combatants.filter((c) => c.name.toLowerCase().includes(f)) : combatants;
  }, [combatants, filter]);

  function add() {
    const c: Combatant = {
      id: uid(),
      name: "New",
      type: "Monster",
      team: 1,
      inEncounter: false,
      speed: 30,
      status: ["Normal"],
      ac: 12,
      hp: 10,
      maxHp: 10,
      initMod: 2,
      attacks: [{ id: uid(), name: "Claw", toHitMod: 4, damage: "1d6+2" }],
    };
    const next = [c, ...combatants];
    setCombatants(next);
    saveState({ combatants: next, round: 1, activeId: null });
  }

  function update(c: Combatant) {
    const next = combatants.map((x) => (x.id === c.id ? c : x));
    setCombatants(next);
    saveState({ combatants: next, round: 1, activeId: null });
  }

  function remove(id: string) {
    const next = combatants.filter((c) => c.id !== id);
    setCombatants(next);
    saveState({ combatants: next, round: 1, activeId: null });
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">🧙 Roster (Setup)</h2>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Filter by name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className="btn" onClick={add}>
            + Add
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const bloodied = c.hp <= Math.floor(c.maxHp / 2);
          const team = (c.team ?? 1) as TeamId;

          return (
            <div
              key={c.id}
              className={`card space-y-3 ${TEAM_BG_SOFT[team]} ${
                c.inEncounter ? "ring-2 ring-indigo-400" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <input
                  className="input font-semibold w-40"
                  value={c.name}
                  onChange={(e) => update({ ...c, name: e.target.value })}
                />
                <select
                  className="select"
                  value={c.type}
                  onChange={(e) =>
                    update({ ...c, type: e.target.value as Combatant["type"] })
                  }
                >
                  <option>PC</option>
                  <option>NPC</option>
                  <option>Monster</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="label">Team</label>
                <select
                  className="select"
                  value={team}
                  onChange={(e) =>
                    update({ ...c, team: Number(e.target.value) as TeamId })
                  }
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>

                <span className={`badge ${TEAM_BADGE[team]} text-white`}>
                  Team {team}
                </span>

                <label className="label ml-3">In fight?</label>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!c.inEncounter}
                  onChange={(e) =>
                    update({ ...c, inEncounter: e.target.checked })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="label">AC</label>
                  <input
                    className="input w-full"
                    type="number"
                    value={c.ac}
                    onChange={(e) =>
                      update({ ...c, ac: parseInt(e.target.value || "0", 10) })
                    }
                  />
                </div>
                <div>
                  <label className="label">Speed</label>
                  <input
                    className="input w-full"
                    type="number"
                    value={c.speed ?? 30}
                    onChange={(e) =>
                      update({ ...c, speed: parseInt(e.target.value || "0", 10) })
                    }
                  />
                </div>
                <div>
                  <label className="label">HP / Max</label>
                  <div className="flex gap-2">
                    <input
                      className="input w-20"
                      type="number"
                      value={c.hp}
                      onChange={(e) =>
                        update({ ...c, hp: parseInt(e.target.value || "0", 10) })
                      }
                    />
                    <input
                      className="input w-20"
                      type="number"
                      value={c.maxHp}
                      onChange={(e) =>
                        update({ ...c, maxHp: parseInt(e.target.value || "0", 10) })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Init mod</label>
                  <input
                    className="input w-full"
                    type="number"
                    value={c.initMod}
                    onChange={(e) =>
                      update({ ...c, initMod: parseInt(e.target.value || "0", 10) })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="label">Status</label>
                <input
                  className="input w-full"
                  placeholder="comma separated (e.g., Normal, Prone)"
                  value={(c.status ?? ["Normal"]).join(", ")}
                  onChange={(e) =>
                    update({
                      ...c,
                      status: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean) as Status[],
                    })
                  }
                />
              </div>

              <div>
                <label className="label">Attacks</label>
                <div className="space-y-2">
                  {c.attacks.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center gap-2">
                      <input
                        className="input w-36"
                        value={a.name}
                        onChange={(e) =>
                          update({
                            ...c,
                            attacks: c.attacks.map((x) =>
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
                        onChange={(e) =>
                          update({
                            ...c,
                            attacks: c.attacks.map((x) =>
                              x.id === a.id
                                ? { ...a, toHitMod: parseInt(e.target.value || "0", 10) }
                                : x
                            ),
                          })
                        }
                      />
                      <span className="label">dmg</span>
                      <input
                        className="input w-24"
                        value={a.damage}
                        onChange={(e) =>
                          update({
                            ...c,
                            attacks: c.attacks.map((x) =>
                              x.id === a.id ? { ...a, damage: e.target.value } : x
                            ),
                          })
                        }
                      />
                      <button
                        className="btn"
                        onClick={() =>
                          update({ ...c, attacks: c.attacks.filter((x) => x.id !== a.id) })
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
                          { id: uid(), name: "New Attack", toHitMod: 0, damage: "1d6" },
                        ],
                      })
                    }
                  >
                    + Add attack
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs">
                  {bloodied ? (
                    <span className="badge bg-red-700 text-white">BLOODIED</span>
                  ) : (
                    <span className="badge bg-slate-700">Healthy</span>
                  )}
                </div>
                <button className="btn" onClick={() => remove(c.id)}>
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-slate-400">No roster yet. Click “+ Add”.</div>
        )}
      </div>
    </section>
  );
}
