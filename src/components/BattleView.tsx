import React, { useMemo, useState, useEffect } from "react";
import type {
  Combatant,
  Attack,
  TeamId,
  LogEntry,
  LogSettings,
} from "../types";
import { saveState } from "../lib/storage";
import { d20, rollDice } from "../lib/dice";

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
  round: number;
  setRound: (n: number) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  log: LogEntry[];
  setLog: (l: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => void; // 👈 accept updater function too
};

// -------------------- UI helpers --------------------
// Subtle team-tinted background (same idea as Roster soft BG)
const TEAM_BG_SOFT: Record<TeamId, string> = {
  1: "bg-blue-500/10",
  2: "bg-red-500/10",
  3: "bg-emerald-500/10",
  4: "bg-purple-500/10",
  5: "bg-amber-500/10",
};
const TEAM_BG: Record<TeamId, string> = {
  1: "bg-blue-600",
  2: "bg-red-600",
  3: "bg-emerald-600",
  4: "bg-purple-600",
  5: "bg-amber-600",
};
const TEAM_TEXT: Record<TeamId, string> = {
  1: "text-blue-300",
  2: "text-red-300",
  3: "text-emerald-300",
  4: "text-purple-300",
  5: "text-amber-300",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Detailed d20 so we can detect nat 20 / nat 1
function rollD20Detailed(mod: number) {
  const raw = Math.floor(Math.random() * 20) + 1; // 1..20
  const total = raw + mod;
  return { raw, total, isCrit: raw === 20, isFumble: raw === 1 };
}

// -------------------- Component --------------------
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
  const pool = useMemo(
    () => combatants.filter((c) => c.inEncounter),
    [combatants]
  );

  const ordered = useMemo(
    () =>
      [...pool].sort(
        (a, b) => (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity)
      ),
    [pool]
  );

  const [attackChoice, setAttackChoice] = useState<string>("");
  const [attackerId, setAttackerId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  // remember last attack and last target per attacker
  const [lastAttackByAttacker, setLastAttackByAttacker] = useState<
    Record<string, string>
  >({});
  const [lastTargetByAttacker, setLastTargetByAttacker] = useState<
    Record<string, string>
  >({});

  // background override
  const [bgInput, setBgInput] = useState<string>("");

  // Structured log + settings
  // const [log, setLog] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<LogSettings>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("LOG_SETTINGS") || ""
      ) as LogSettings;
    } catch {
      return { newestFirst: true, compact: false };
    }
  });
  useEffect(() => {
    localStorage.setItem("LOG_SETTINGS", JSON.stringify(settings));
  }, [settings]);

  function pushEntry(entry: LogEntry) {
    setLog((prev) => [entry, ...prev].slice(0, 200));
  }

  // 🔁 When the turn changes, force UI to follow the active creature
  useEffect(() => {
    if (!activeId) return;
    // 1) set current attacker to the active creature
    setAttackerId(activeId);

    // 2) choose that attacker's last-used attack (or first)
    const attacker = pool.find((c) => c.id === activeId);
    if (attacker) {
      const lastAtk = lastAttackByAttacker[activeId];
      const chosenAtk =
        attacker.attacks.find((a) => a.id === lastAtk)?.id ??
        attacker.attacks[0]?.id ??
        "";
      setAttackChoice(chosenAtk);

      // 3) choose last-used target, else an enemy team, else the first other creature
      const lastTgt = lastTargetByAttacker[activeId];
      let chosenTarget =
        pool.find((c) => c.id === lastTgt)?.id ?? null;

      if (!chosenTarget) {
        const enemy = pool.find(
          (c) => c.id !== activeId && (c.team ?? 1) !== (attacker.team ?? 1)
        );
        chosenTarget = enemy?.id ?? pool.find((c) => c.id !== activeId)?.id ?? null;
      }
      setTargetId(chosenTarget);
    }
  }, [activeId, pool, lastAttackByAttacker, lastTargetByAttacker]);

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

    // Log round change when wrapping
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
        toHitMod: 0,
        raw: 0,
        total: 0,
        passed: true,
        isCrit: false,
        isFumble: false,
      };
      pushEntry(entry);
    }
  }

  function applyDamage(target: Combatant, amount: number) {
    const next = combatants.map((x) =>
      x.id === target.id
        ? { ...x, hp: Math.max(0, Math.min(x.maxHp, x.hp - amount)) }
        : x
    );
    setCombatants(next);
    saveState({ combatants: next, round, activeId });
    const newTgt = next.find((n) => n.id === target.id)!;
    return newTgt.hp;
  }

  function doAttack() {
    const currentAttackerId = attackerId ?? activeId;
    const atk = pool.find((c) => c.id === currentAttackerId);
    const tgt = pool.find((c) => c.id === targetId);
    if (!atk || !tgt) return;

    // pick attack (by id or default to first)
    const attack: Attack | undefined =
      atk.attacks.find((a) => a.id === attackChoice) ?? atk.attacks[0];
    if (!attack) return;

    // remember last selections for this attacker
    setLastAttackByAttacker((m) => ({ ...m, [atk.id]: attack.id }));
    setLastTargetByAttacker((m) => ({ ...m, [atk.id]: tgt.id }));

    // roll to hit (detailed)
    const hit = rollD20Detailed(attack.toHitMod);
    const passed = hit.total >= tgt.ac;

    let damage: number | undefined = undefined;
    let died = false;

    if (passed) {
      const dmg = rollDice(attack.damage);
      damage = dmg.total;
      const hpAfter = applyDamage(tgt, dmg.total);
      died = hpAfter === 0;
    }

    // log structured entry
    const entry: LogEntry = {
      id: uid(),
      ts: Date.now(),
      attackerId: atk.id,
      attackerName: atk.name,
      attackerTeam: (atk.team ?? 1) as TeamId,
      targetId: tgt.id,
      targetName: tgt.name,
      targetTeam: (tgt.team ?? 1) as TeamId,
      toHitMod: attack.toHitMod,
      raw: hit.raw,
      total: hit.total,
      passed,
      isCrit: hit.isCrit,
      isFumble: hit.isFumble,
      damage,
      died,
    };
    pushEntry(entry);
  }

  // background color apply (accepts "rgb(...)" or "#hex")
  function applyBackground() {
    const v = bgInput.trim();
    if (!v) return;
    document.body.style.background = v;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">🏁 Battle</h2>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={rollAllInitiative}>
            Roll initiative for all
          </button>
          <div className="badge">
            Round <strong className="ml-1">{round}</strong>
          </div>
          <button className="btn" onClick={nextTurn}>
            Next ▶
          </button>
        </div>

        {/* Background color control */}
        <div className="flex items-center gap-2">
          <input
            className="input w-40"
            placeholder="rgb(15,23,42) or #0f172a"
            value={bgInput}
            onChange={(e) => setBgInput(e.target.value)}
          />
          <button className="btn" onClick={applyBackground}>
            Apply BG
          </button>
        </div>
      </div>

      {/* Turn order */}
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

      {/* Attack controller */}
      <div className="card space-y-3">
        <h3 className="font-semibold">⚔️ Attack</h3>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="label">Attacker</label>
            <select
              className="select w-full"
              value={attackerId ?? ""}
              onChange={(e) => setAttackerId(e.target.value || null)}
            >
              {pool.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Team {c.team ?? 1})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Attack</label>
            <select
              className="select w-full"
              value={attackChoice}
              onChange={(e) => setAttackChoice(e.target.value)}
            >
              {(
                pool.find((c) => c.id === (attackerId ?? activeId))?.attacks ??
                []
              ).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (toHit +{a.toHitMod}, dmg {a.damage})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Target</label>
            <select
              className="select w-full"
              value={targetId ?? ""}
              onChange={(e) => setTargetId(e.target.value || null)}
            >
              {pool.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (AC {c.ac}, Team {c.team ?? 1})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={doAttack}
          >
            Roll Attack
          </button>
          <button className="btn" onClick={() => setLog([])}>
            Clear log
          </button>
        </div>

        {/* Settings + Log */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="label">Battle Log</label>
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={settings.newestFirst}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      newestFirst: e.target.checked,
                    }))
                  }
                />
                Newest first
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={settings.compact}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, compact: e.target.checked }))
                  }
                />
                Compact
              </label>
            </div>
          </div>

          <div className="card bg-blue-500/10 border-slate-800 min-h-[160px] max-h-80 overflow-auto">
            {log.length === 0 ? (
              <p className="text-slate-400 text-sm px-3 py-2">No events yet…</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {(settings.newestFirst ? [...log] : [...log].reverse()).map(
                  (e) => {
                    const crit = e.isCrit ? "bg-green-600 text-white" : "";
                    const fumble = e.isFumble ? "bg-red-600 text-white" : "";
                    const hitBadge = e.passed
                      ? `bg-emerald-700 text-emerald-100`
                      : `bg-red-700 text-red-100`;
                    const dmgBadge =
                      e.damage != null ? "bg-yellow-700 text-yellow-100" : "";
                    const koBadge = e.died ? "bg-red-800 text-white" : "";
                    const density = settings.compact ? "py-1" : "py-2";

                    return (
                      <li key={e.id} className={`px-3 ${density}`}>
                        <div className={`flex flex-wrap items-center gap-2 text-sm`}>
                          {/* Attacker */}
                          <span
                            className={`badge ${TEAM_BG[e.attackerTeam]} text-white`}
                          >
                            {e.attackerName}
                          </span>

                          <span className="text-slate-400">→</span>

                          {/* Target */}
                          <span
                            className={`badge ${TEAM_BG[e.targetTeam]} text-white`}
                          >
                            {e.targetName}
                          </span>

                          {/* Hit/Miss + Crit/Fumble */}
                          <span className={`badge ${hitBadge}`}>
                            {e.passed ? "HIT" : "MISS"} {e.total}
                            <span className="opacity-70">
                              {" "}
                              (d20 {e.raw}
                              {e.toHitMod >= 0
                                ? `+${e.toHitMod}`
                                : `${e.toHitMod}`}
                              )
                            </span>
                          </span>

                          {e.isCrit && (
                            <span className={`badge ${crit}`}>💥 NAT 20</span>
                          )}
                          {e.isFumble && (
                            <span className={`badge ${fumble}`}>❌ NAT 1</span>
                          )}

                          {/* Damage inline on the same line */}
                          {e.damage != null && (
                            <span className={`badge ${dmgBadge}`}>
                              DMG {e.damage}
                            </span>
                          )}

                          {/* KO */}
                          {e.died && (
                            <span className={`badge ${koBadge}`}>☠ K.O.</span>
                          )}

                          {/* Timestamp (small, subtle) */}
                          <span
                            className={`ml-auto text-xs ${TEAM_TEXT[e.attackerTeam]} opacity-70`}
                          >
                            {new Date(e.ts).toLocaleTimeString()}
                          </span>
                        </div>
                      </li>
                    );
                  }
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
