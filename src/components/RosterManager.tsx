import React, { useMemo, useState } from "react";
import type { Combatant, TeamId, Status, Ability, Attack } from "../types";
import { saveState } from "../lib/storage";
import { rollAbility } from "../lib/dice"; // your dice roller



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
  const [checkResult, setCheckResult] = useState<Record<string, string>>({});
  const [bonusInput, setBonusInput] = useState<Record<string, string>>({});
  const [advMode, setAdvMode] = useState<Record<string, 'normal' | 'advantage' | 'disadvantage'>>({});

  const [tabState, setTabState] = useState<Record<string, 'general' | 'scores'>>({});


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
      attacks: [{ id: uid(), name: "Claw", hitorDC: 4, damage: "1d6+2" }],
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
          <button className="btn-green" onClick={add}>
            + Add
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const bloodied = c.hp <= Math.floor(c.maxHp / 2);
          const team = (c.team ?? 1) as TeamId;
          const activeTab = tabState[c.id] || "general";
          const bonus = bonusInput[c.id] || "";
          const result = checkResult[c.id] || "Click on Check or Saving to roll";
          const advState = advMode[c.id] || "normal";

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
                <div className="flex items-center gap-2">
                  <label className="label ml-3">In fight?</label>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!c.inEncounter}
                    onChange={(e) =>
                      update({ ...c, inEncounter: e.target.checked })
                    }
                  />
                  <div></div>
                </div>
              </div>
              <div className="flex border-b border-slate-700 mb-3">
                <button
                  className={`flex-1 py-1 text-sm font-medium rounded-t-md ${
                    activeTab === "general"
                      ? "text-white border-b-2 border-indigo-500"
                      : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() =>
                    setTabState((prev) => ({ ...prev, [c.id]: "general" }))
                  }
                >
                  General
                </button>
                <button
                  className={`flex-1 py-1 text-sm font-medium rounded-t-md ${
                    activeTab === "scores"
                      ? "text-white border-b-2 border-indigo-500"
                      : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() =>
                    setTabState((prev) => ({ ...prev, [c.id]: "scores" }))
                  }
                >
                  Scores
                </button>
              </div>
              
              {/* General Stats */}
              <div
                className={`transition-opacity duration-300 ${
                  activeTab === 'general' ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex flex-wrap justify-between items-center gap-2">
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
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <label className="label">Type</label>
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
                </div>
              </div>

              
              {/* Ability Checks and Saving Throws */}
              <div
                className={`transition-opacity duration-300 ${
                  activeTab === 'scores' ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'
                }`}
              >
                <div className="space-y-3">
                  {/* <label className="label">Abilities</label> */}
                  <div className="grid grid-cols-2">
                    {(["STR", "DEX", "CON", "INT", "WIS", "CHA"] as Ability[]).map((ab) => (
                      <div
                        key={ab}
                        className="flex items-center gap-1 p-1"
                      >
                        {/* Ability name */}
                        <label className="label w-6 font-semibold text-center pt-5">{ab}</label>
                  
                        {/* Check column */}
                        <div className="flex flex-col items-center flex-1">
                          <button
                            className="text-xs text-slate-400 hover:text-white mb-1"
                            onClick={() => {
                              const roll = rollAbility(c, ab, "check", bonus, advState);
                              setCheckResult(prev => ({ ...prev, [c.id]: roll }));
                            }}
                          >
                            Check
                          </button>
                          <input
                            type="number"
                            className="input w-full text-center"
                            value={c.checks?.[ab] ?? 0}
                            onChange={(e) => {
                              const newVal = parseInt(e.target.value) || 0;
                              update({ ...c, checks: { ...c.checks, [ab]: newVal } });
                            }}
                          />
                        </div>
                  
                        {/* Saving column */}
                        <div className="flex flex-col items-center flex-1">
                          <button
                            className="text-xs text-slate-400 hover:text-white mb-1"
                            onClick={() => {
                              const roll = rollAbility(c, ab, "save", bonus, advState);
                              setCheckResult(prev => ({ ...prev, [c.id]: roll }));
                            }}
                          >
                            Saving
                          </button>
                          <input
                            type="number"
                            className="input w-full text-center"
                            value={c.savingThrows?.[ab] ?? 0}
                            onChange={(e) => {
                              const newVal = parseInt(e.target.value) || 0;
                              update({ ...c, savingThrows: { ...c.savingThrows, [ab]: newVal } });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>


                  {/* Bonus input + adv/dis */}
                  <div className="flex items-end gap-3 mt-3">
                    <div className="flex-1">
                      <label className="label">Bonus</label>
                      <input
                        className="input w-full"
                        placeholder="+1 or 1d4"
                        value={bonus}
                        onChange={(e) => setBonusInput(prev => ({ ...prev, [c.id]: e.target.value}))}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <label className="label">Adv / Dis</label>
                      <button
                        className={`btn w-20 ${
                          advState === "advantage" ? "bg-green-600 text-white" :
                          advState === "disadvantage" ? "bg-red-600 text-white" : ""
                        }`}
                        onClick={() => {
                          setAdvMode(prev => {
                            const current = prev[c.id] || 'normal';
                            const next =
                              current === 'normal'
                                ? 'advantage'
                                : current === 'advantage'
                                ? 'disadvantage'
                                : 'normal';
                            return { ...prev, [c.id]: next };
                          });
                        }}
                        
                      >
                        {advState === "advantage" ? "Adv" : advState === "disadvantage" ? "Dis" : "--"}
                      </button>
                    </div>
                  </div>

                  {/* Result box */}
                  <div className={`mt-3 p-2 rounded-lg bg-slate-900 text-center text-sm 
                    ${ result == "Click on Check or Saving to roll" ? "text-slate-400" : ""}
                  `}>
                    {result}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 space-y-2">
                <label className="flex-1 py-1 text-sm font-medium rounded-t-md text-white border-b-2 border-indigo-500">Actions</label>
                <div className="flex flex-col space-y-2">
                  {c.attacks.map((a) => (
                    <div key={a.id} className="flex flex-wrap justify-between items-center gap-2 border-b rounded-t-md p-2 border-slate-700">
                      <input
                        className="input w-50"
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
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <label className="label">Type</label>
                        <select
                          className="select"
                          value={a.type}
                          onChange={(e) =>
                            update({
                              ...c,
                              attacks: c.attacks.map((x) =>
                                x.id === a.id ? { ...a, type: e.target.value as Attack["type"], contested: e.target.value === "Save DC" ? "STR" as Ability : ""} : x
                              ),
                            })
                          }
                        >
                          <option>Attack Roll</option>
                          <option>Save DC</option>
                          <option>Auto Hit</option>
                          <option>Heal</option>
                        </select>
                      </div>
                      {a.type !== "Auto Hit" && a.type !== "Heal" && (
                        <div className="flex gap-2 items-center">
                          <span className="label">{a.type === "Save DC" ? "DC" : "toHit"}</span>
                          <input
                            className="input w-20"
                            type="number"
                            value={a.hitorDC}
                            onChange={(e) =>
                              update({
                                ...c,
                                attacks: c.attacks.map((x) =>
                                  x.id === a.id
                                    ? { ...a, hitorDC: parseInt(e.target.value || "0", 10) }
                                    : x
                                ),
                              })
                            }
                          />
                        </div>
                      )}
                      <div className="flex gap-2 items-center">
                        <span className="label">{a.type === "Heal" ? "HP" : "Dmg"}</span>
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
                      </div>
                      {a.type === "Save DC" && (
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <label className="label">Contested</label>
                          <select
                            className="select"
                            value={a.contested}
                            onChange={(e) =>
                              update({
                                ...c,
                                attacks: c.attacks.map((x) =>
                                  x.id === a.id ? { ...a, contested: e.target.value as Ability} : x
                                ),
                              })
                            }
                          >
                            <option>STR</option>
                            <option>DEX</option>
                            <option>CON</option>
                            <option>INT</option>
                            <option>WIS</option>
                            <option>CHA</option>
                          </select>
                        </div>
                      )}
                      <button
                        className="btn-red"
                        onClick={() =>
                          update({ ...c, attacks: c.attacks.filter((x) => x.id !== a.id) })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn-green w-fit"
                    onClick={() =>
                      update({
                        ...c,
                        attacks: [
                          ...c.attacks,
                          { id: uid(), name: "New Action", type: "Attack Roll", hitorDC: 0, damage: "1d6", contested: "AC" as Ability },
                        ],
                      })
                    }
                  >
                    + Add Action
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
                <button className="btn-red" onClick={() => remove(c.id)}>
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
