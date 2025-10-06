import React, { useMemo, useState, useEffect } from "react";
import type { Combatant, Attack, TeamId, LogEntry, LogSettings } from "../types";
import { saveState } from "../lib/storage";
import { d20, rollDice, RollResult } from "../lib/dice";

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

  // Attacker-side state
  const [attackChoice, setattackChoice] = useState<Attack | null>(null);
  const [attackerId, setAttackerId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [advantageMode, setAdvantageMode] = useState<"normal" | "advantage" | "disadvantage">("normal");

  // Target-side state (for Save DC attacks)
  const [targetSaveBonusInput, setTargetSaveBonusInput] = useState<string>("");
  const [targetDamageBonusInput, setTargetDamageBonusInput] = useState<string>("");

  const [targetAdvMode, setTargetAdvMode] = useState<"normal" | "advantage" | "disadvantage">("normal");
  const [targetSaveRoll, setTargetSaveRoll] = useState<any | null>(null);

  const [targetSaveBonusRoll, setTargetSaveBonusRoll] = useState<any | null>(null);
  const [targetDamageBonusRoll, setTargetDamageBonusRoll] = useState<any | null>(null);

  // ---------- Attack 3-step UI state ----------
  const [attackStage, setAttackStage] = useState<1 | 2 | 3>(1);

  // Bonus Inputs
  const [attackBonusInput, setAttackBonusInput] = useState<string>(""); // stage1 attack bonus input
  const [damageBonusInput, setDamageBonusInput] = useState<string>(""); // stage3 damage bonus input

  // Input Rolls
  const [attackBonusRoll, setAttackBonusRoll] = useState<any | null>(null);
  const [damageBonusRoll, setDamageBonusRoll] = useState<any | null>(null);

  // Stored roll results
  const [attackRoll, setAttackRoll] = useState<any | null>(null); // original d20 roll object from d20()
  const [attackPassed, setAttackPassed] = useState<boolean | null>(null); // whether it hit (computed on Apply)
  const [damageRoll, setDamageRoll] = useState<any | null>(null); // damage roll result (if any)

  // stage1 -> stage2
  function handleAttackRoll() {
    
    const attack = attackChoice;
    if (!attack) return;

    if(attack.type !== "Heal" && attack.type !== "Auto Hit") {
      const currentAttackerId = attackerId ?? activeId;
      const atkOwner = pool.find((c) => c.id === currentAttackerId);
      const tgt = pool.find((c) => c.id === targetId);
      if (!atkOwner || !tgt) return;
      
      if (attack.type !== "Attack Roll") {
        if (!attack.contested) return;
        const roll = d20(tgt.savingThrows?.[attack.contested], targetAdvMode)
        // setAttackRoll(roll);
        setTargetSaveRoll(roll)
      } else {
        const roll = d20(attack.hitorDC, advantageMode);
        setAttackRoll(roll);
      }
    setAttackStage(2);

    } else {
      console.log("1")
      const roll: RollResult = { raw:0, total:0, parts:[]}
      const dmg = rollDice(attack.damage);
      setAttackRoll(roll)
      setDamageRoll(dmg);
      setAttackPassed(true)
      setAttackStage(3);
      console.log("2")
    }
  }
  useEffect(() => {
    const roll = attackBonusInput ? rollDice(attackBonusInput) : { total: 0, parts: [] };
    setAttackBonusRoll(roll);
  }, [attackBonusInput]);

  useEffect(() => {
    const roll = targetSaveBonusInput ? rollDice(targetSaveBonusInput) : { total: 0, parts: [] };
    setTargetSaveBonusRoll(roll);
  }, [targetSaveBonusInput]);

  function handleAttackReroll() {
    // reroll using same attacker/attack and the stored pre-bonus
    const currentAttackerId = attackerId ?? activeId;
    const atkOwner = pool.find((c) => c.id === currentAttackerId);
    if (!atkOwner) return;

    const attack = attackChoice;
    if (!attack) return;
    const roll = d20(attack.hitorDC, advantageMode);
    setAttackRoll(roll);
    setAttackPassed(null);
    setDamageRoll(null);
    setDamageBonusInput("");
  }

  // stage2 -> stage3
  function handleAttackApply() {
    // apply any stage-2 extra bonus to the existing roll, decide hit/miss, and move to stage 3
    const currentAttackerId = attackerId ?? activeId;
    const atkOwner = pool.find((c) => c.id === currentAttackerId);
    const tgt = pool.find((c) => c.id === targetId);
    const attack = attackChoice;
    if (!atkOwner || !tgt || !attack) return;

    if (attack.type === "Attack Roll") {
      if (!attackRoll) return;

      const bonusRoll = attackBonusRoll ?? { total: 0, parts: [] };
      const finalTotal = (attackRoll.total ?? 0) + bonusRoll.total;
      const mergedParts = [...(attackRoll.parts || []), ...(bonusRoll.parts || [])];
      
      setAttackRoll({
        ...attackRoll,
        total: (attackRoll.total ?? 0) + bonusRoll.total,
        parts: mergedParts,
      });
      setAttackBonusInput("")
      const passed = finalTotal >= tgt.ac;
      setAttackPassed(passed);
    } else {
      if (!targetSaveRoll) return;

      const bonusRoll = targetSaveBonusRoll ?? { total: 0, parts: [] };
      const finalTotal = (targetSaveRoll.total ?? 0) + bonusRoll.total;
      const mergedParts = [...(targetSaveRoll.parts || []), ...(bonusRoll.parts || [])];
      
      setTargetSaveRoll({
        ...targetSaveRoll,
        total: (targetSaveRoll.total ?? 0) + bonusRoll.total,
        parts: mergedParts,
      });
      setTargetSaveBonusInput("")
      const passed = finalTotal >= attack.hitorDC;
      setAttackPassed(passed); // needs it's own state
    }
    const dmg = rollDice(attack.damage);
    setDamageRoll(dmg);
    setAttackStage(3);
  }
  useEffect(() => {
    const roll = damageBonusInput ? rollDice(damageBonusInput) : { total: 0, parts: [] };
    setDamageBonusRoll(roll);
  }, [damageBonusInput]);

  useEffect(() => {
    const roll = targetDamageBonusInput ? rollDice(targetDamageBonusInput) : { total: 0, parts: [] };
    setTargetDamageBonusRoll(roll);
  }, [targetDamageBonusInput]);

  function handleDamageApplyAndLog() {
    const currentAttackerId = attackerId ?? activeId;
    const atkOwner = pool.find((c) => c.id === currentAttackerId);
    const tgt = pool.find((c) => c.id === targetId);
    const attack = attackChoice;
    const actionType = attack?.type;
    if (!atkOwner || !tgt || !attack) return;

    let rawDice: number = 0; 
    let finalTotal: number = 0;
    let parts = "";
    
    // compute damage if a hit
    let finalDamage: number = 0;
    let died = false;


    if (actionType !== "Save DC") {
      if (!attackRoll) return;
      // compute final attack total (may already be set)
      const bonusRoll = attackBonusRoll ?? { total: 0, parts: [] };
      finalTotal = (attackRoll.total ?? 0) + bonusRoll.total;
      rawDice = attackRoll.raw;
      
      // Build parts string: show original parts and appended extras so it's visible in log
      parts = [
        ...(attackRoll.parts || []),
        ...(bonusRoll.parts || [])
      ].join("");

    } else {
      if (!targetSaveRoll) return;
      // compute final attack total (may already be set)
      const bonusRoll = targetSaveBonusRoll ?? { total: 0, parts: [] };
      finalTotal = (targetSaveRoll.total ?? 0) + bonusRoll.total;
      rawDice = targetSaveRoll.raw;
      
      // Build parts string: show original parts and appended extras so it's visible in log
      parts = [
        ...(targetSaveRoll.parts || []),
        ...(bonusRoll.parts || [])
      ].join("");
    }

    // remember last selections for this attacker
    setLastAttackByAttacker((m) => ({ ...m, [atkOwner.id]: attack.id }));
    setLastTargetByAttacker((m) => ({ ...m, [atkOwner.id]: tgt.id }));
    

    // const bonusDmgRoll = damageBonusInput ? rollDice(damageBonusInput) : { total: 0, parts: [] };
    const bonusDmgRoll = actionType === "Save DC" ? (targetDamageBonusRoll ?? { total: 0, parts: [] }) : (damageBonusRoll ?? { total: 0, parts: [] });
    const dmgBase = actionType === "Save DC" ? (!attackPassed ? (damageRoll?.total ?? 0) : 0) :(attackPassed ? (damageRoll?.total ?? 0) : 0) ;
    finalDamage = dmgBase + bonusDmgRoll.total;
    console.log(targetDamageBonusRoll, damageBonusRoll)
    console.log(bonusDmgRoll, dmgBase)
    if (attackChoice?.type === "Heal") {
      finalDamage = finalDamage * -1;
    }
    const hpAfter = applyDamage(tgt, finalDamage);
    died = hpAfter === 0;

    // Log entry (keep shape similar to existing entries)
    const entry: LogEntry = {
      id: uid(),
      ts: Date.now(),
      attackerId: atkOwner.id,
      attackerName: atkOwner.name,
      attackerTeam: (atkOwner.team ?? 1) as TeamId,
      targetId: tgt.id,
      targetName: tgt.name,
      targetTeam: (tgt.team ?? 1) as TeamId,
      actionType: actionType,
      hitorDC: attack.hitorDC,
      raw: rawDice,
      parts: parts,
      total: finalTotal ?? 0,
      passed: !!attackPassed,
      isCrit: rawDice === 20,
      isFumble: rawDice === 1,
      damage: finalDamage,
      died,
    };
    pushEntry(entry);

    // persist overall app state (combatants may have changed via applyDamage)
    saveState({ combatants, round, activeId });

    // reset card
    resetCard()
  }

  function resetCard() {
    
    setAttackStage(1);
    setDamageRoll(null);
    setAttackPassed(null);

    setAttackRoll(null);
    setAttackBonusInput("");
    setDamageBonusInput("");

    setTargetSaveRoll(null);
    setTargetSaveBonusInput("");
    setTargetDamageBonusInput("");
  }
  
  function applyDamage(target: Combatant, amount: number) {
    if (typeof amount !== 'number') return;
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

  const handleCharacterChange = (characterId: string | null) => {
    setAttackerId(characterId);
    
    if (characterId) {
      const selectedCharacter = pool.find(c => c.id === characterId);
      const firstAttack = selectedCharacter?.attacks?.[0];
      setattackChoice(firstAttack || null);
    } else {
      setattackChoice(null);
    }

    resetCard()
  };
  
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
        attacker.attacks.find((a) => a.id === lastAtk) ??
        attacker.attacks[0] ??
        null;
      setattackChoice(chosenAtk);

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
        actionType: undefined,
        hitorDC: 0,
        raw: 0,
        parts: '',
        total: 0,
        passed: true,
        isCrit: false,
        isFumble: false,
      };
      pushEntry(entry);
    }
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
          <button className="btn-normal" onClick={rollAllInitiative}>
            Roll initiative for all
          </button>
          <div className="badge">
            Round <strong className="ml-1">{round}</strong>
          </div>
          <button className="btn-normal" onClick={nextTurn}>
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
          <button className="btn-normal" onClick={applyBackground}>
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
      {/* --- Action card (replaces old Attacker/Attack/Target + Attack card) --- */}
      <div className="card space-y-4 mt-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Action</div>

          <div className="flex items-center gap-3">
            {/* small red back button that steps stage back (UI-only) */}
            <button
              type="button"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm"
              onClick={() => setAttackStage((s) => (Math.max(1, s - 1) as 1 | 2 | 3))}
              aria-label="back stage"
            >
              &lt;
            </button>

            <div className="text-sm text-slate-400">Step {attackStage} of 3</div>
          </div>
        </div>

        {/* Action container: 3 equal columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* --- LEFT: Character card --- */}
          <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/30 flex flex-col justify-between">
            <div>
              <label className="label">Character</label>
              <select
                className="select w-full mt-2"
                value={attackerId ?? ""}
                onChange={(e) => handleCharacterChange(e.target.value || null)}
              >
                {pool.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Team {c.team ?? 1})
                  </option>
                ))}
              </select>
            </div>

            {/* bottom: Action select (half) + [bonus input | Adv | Dis] (other half) */}
            <div className="mt-3 flex gap-2">
              <div>
                <label className="label">Action</label>
                <select
                  className="select w-full mt-2"
                  value={attackChoice?.id}
                  onChange={(e) => {
                    resetCard()
                    const selectedId = e.target.value;
                    const attacks = pool.find((c) => c.id === (attackerId ?? activeId))?.attacks ?? [];
                    const selectedAttack = attacks.find(a => a.id === selectedId);
                    if (selectedAttack) {
                      setattackChoice(selectedAttack);
                    }
                  }}
                >
                  {(
                    pool.find((c) => c.id === (attackerId ?? activeId))?.attacks ?? []
                  ).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (
                      {a.type === "Attack Roll" ? `toHit +${a.hitorDC}, Dmg ${a.damage}` : 
                      (a.type === "Auto Hit" ? `Dmg ${a.damage}` : 
                      (a.type === "Save DC" ? `${a.hitorDC} DC, Dmg ${a.damage}, ${a.contested} Save` :
                      (a.type === "Heal" ? `HP ${a.damage}` : "")
                      ))})
                    </option>
                  ))}
                </select>
              </div>
              
              {attackChoice?.type === "Attack Roll" && (
                <div className="flex-1 flex gap-2 items-end">
                  <div className="min-w-20">
                    <label className="label">Extra bonus</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Bonus (e.g. +2, 1d4-1)"
                      value={attackStage === 3 ? damageBonusInput : attackBonusInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (attackStage === 3) setDamageBonusInput(v);
                        else setAttackBonusInput(v);
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">Adv / Dis</label>
                    <button
                      className={`btn w-16 text-center ${
                        advantageMode === "advantage"
                          ? "bg-green-600 text-white"
                          : advantageMode === "disadvantage"
                          ? "bg-red-600 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                      onClick={() => {
                        setAdvantageMode((prev) =>
                          prev === "normal"
                            ? "advantage"
                            : prev === "advantage"
                            ? "disadvantage"
                            : "normal"
                        );
                      }}
                    >
                      {advantageMode === "normal" && "--"}
                      {advantageMode === "advantage" && "Adv"}
                      {advantageMode === "disadvantage" && "Dis"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- MIDDLE: Rolls display (Attack Roll / Damage Roll) --- */}
          <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/20 flex flex-col justify-around">
            {/* labels row */}
            <div className="flex items-center justify-around">
              {attackChoice?.type === "Attack Roll" && 
              (<div className="text-xs text-slate-400">Attack Roll</div>)}
              {attackChoice?.type === "Save DC" && 
              (<div className="text-xs text-slate-400">Saving Roll</div>)}
              {attackChoice?.type !== "Heal" ? (
              <div className="text-xs text-slate-400">Damage Roll</div>) : (
              <div className="text-xs text-slate-400">HP Roll</div>
              )}
            </div>

            {/* two lines area */}
            <div className="mt-3 space-y-3">
              {/* LINE 1: base expressions (always shown) */}
              <div className="flex items-center justify-around">
                {/* left: base attack expression */}
                {attackChoice?.type !== "Auto Hit" && attackChoice?.type !== "Heal" && (
                  <div className="text-sm text-slate-200">
                    {attackStage === 1 ? (
                      (() => {
                        const t = pool.find((c) => c.id === (targetId));
                        const attack = attackChoice;
                        const toHit = attack?.type === "Attack Roll" 
                          ? attack?.hitorDC ?? 0 
                          : (attack?.contested ? t?.savingThrows?.[attack.contested] ?? 0 : 0);
                        const Extra = attack?.type === "Attack Roll"
                          ? attackBonusInput : targetSaveBonusInput;
                        return <span>d20{toHit != 0 && (toHit > 0 ? `+${toHit}` : `${toHit}`)}
                        {Extra !== "" && (!Extra.startsWith("+") && !Extra.startsWith("-") ? `+${Extra}` : Extra)}</span>;
                      })()
                    ) : (
                      // stage 2 or 3: show preview or final; include "Hit"/"Miss" prefix in stage 3
                      (() => {
                        if (attackChoice?.type === "Attack Roll") {
                          const bonusRoll = attackBonusRoll ?? { total: 0, parts: [] };
                          const baseTotal = attackRoll?.total ?? 0;
                          const previewTotal = baseTotal + bonusRoll.total;

                          const parts = [
                            ...(attackRoll?.parts || []),
                            ...bonusRoll.parts
                          ].join("");
                          const prefix = attackStage === 3 ? (attackPassed ? "Hit " : "Miss ") : "";
                          return (
                            <span className={`${attackStage === 3 ? (attackPassed ? "text-green-400 font-semibold" : "text-red-400 font-semibold") : "text-slate-200"}`}>
                              {prefix}{previewTotal ?? "-"} {parts ? `${parts}` : ""}
                            </span>
                          );
                        } else {
                          const bonusRoll = targetSaveBonusRoll ?? { total: 0, parts: [] };
                          const baseTotal = targetSaveRoll?.total ?? 0;
                          const previewTotal = baseTotal + bonusRoll.total;
                          
                          const parts = [
                            ...(targetSaveRoll?.parts || []),
                            ...bonusRoll.parts
                          ].join("");
                          const prefix = attackStage === 3 ? (attackPassed ? "Save " : "Fail ") : "";
                          return (
                            <span className={`${attackStage === 3 ? (attackPassed ? "text-green-400 font-semibold" : "text-red-400 font-semibold") : "text-slate-200"}`}>
                              {prefix}{previewTotal ?? "-"} {parts ? `${parts}` : ""}
                            </span>
                          );
                        }
                      })()
                    )}
                  </div>
                )}

                {/* right: base damage expression */}
                <div className="text-sm text-slate-200">
                  {attackStage === 3 ? (
                    // stage 3: show damage roll and possible damage bonus preview
                    (() => {
                      // const bonusDmgRoll = damageBonusInput ? rollDice(damageBonusInput) : { total: 0, parts: [] };
                      const bonusDmgRoll = attackChoice?.type !== "Save DC" 
                        ? (damageBonusRoll ?? { total: 0, parts: [] }) 
                        : (targetDamageBonusRoll ?? { total: 0, parts: [] })
                      const baseD = damageRoll?.total ?? 0;
                      const total = baseD + bonusDmgRoll.total;
                      
                      const parts = [
                        ...(damageRoll?.parts || []),
                        ...(bonusDmgRoll.parts || [])
                      ].join("");
                      return <span>{total} ({parts})</span>;
                    })()
                  ) : (
                    (() => {
                      const a = pool.find((c) => c.id === (attackerId ?? activeId));
                      const attack = attackChoice;
                      return <span>{attack?.damage ?? "-"}</span>;
                    })()
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* --- RIGHT: Target card --- */}
          <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/30 flex flex-col justify-between">
            <div>
              <label className="label">Target</label>
              <select
                className="select w-full mt-2"
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

            {/* lower area intentionally left blank per your spec */}
            <div className="mt-3 flex gap-2">
              {attackChoice?.type !== "Auto Hit" && attackChoice?.type !== "Heal" && (
                <div>
                  <label className="label">Contested</label>
                  <input type="text"className="input w-full" value={attackChoice ? (`${attackChoice.contested ?? ""} ${attackChoice.type === "Save DC" ? "Save" : ""}`) : ""} disabled={true}></input>
                </div>
              )}
              
              {attackChoice?.type === "Save DC" && (
                <div className="flex-1 flex gap-2 items-end">
                  <div className="min-w-20">
                    <label className="label">Extra bonus</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Bonus"
                      value={attackStage === 3 ? targetDamageBonusInput : targetSaveBonusInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (attackStage === 3) setTargetDamageBonusInput(v);
                        else setTargetSaveBonusInput(v);
                      }}
                    />
                  </div>
                  <div>
                    <label className="label">Adv / Dis</label>
                    <button
                      className={`btn w-16 text-center ${
                        targetAdvMode === "advantage"
                          ? "bg-green-600 text-white"
                          : targetAdvMode === "disadvantage"
                          ? "bg-red-600 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                      onClick={() => {
                        setTargetAdvMode((prev) =>
                          prev === "normal"
                            ? "advantage"
                            : prev === "advantage"
                            ? "disadvantage"
                            : "normal"
                        );
                      }}
                    >
                      {targetAdvMode === "normal" && "--"}
                      {targetAdvMode === "advantage" && "Adv"}
                      {targetAdvMode === "disadvantage" && "Dis"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons area (bottom) */}
        <div className="flex gap-3">
          {attackStage === 1 && (
            <>
              <button
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleAttackRoll}
                disabled={!attackChoice || !(attackerId ?? activeId) || !targetId}
              >
                Roll for Action
              </button>
              {/* invisible placeholder so width feels balanced */}
              <div className="flex-1" />
            </>
          )}

          {attackStage === 2 && (
            <>
              <button
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleAttackApply} /* "Result" applies the extra so it's named Result */
                disabled={!attackRoll && !targetSaveRoll}
              >
                See Result
              </button>

              <button
                className="btn-normal"
                onClick={handleAttackReroll}
                disabled={!attackRoll}
              >
                Reroll
              </button>
            </>
          )}

          {attackStage === 3 && (
            <>
              <button
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleDamageApplyAndLog}
                disabled={!attackRoll && !targetSaveRoll}
              >
                Apply Action
              </button>

            </>
          )}
        </div>
      </div>
      {/* <button className="btn-normal" onClick={() => setLog([])}> */}
      <button className="btn-normal" onClick={() => {
        console.log(attackChoice)
        console.log(attackerId)
        }}
      >
        Clear log
      </button>
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
                    ? (e.actionType === "Heal" ? `bg-emerald-950 text-emerald-300` : `bg-green-800 text-green-200`)
                    : `bg-red-800 text-red-200`;
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
                        {e.actionType && (
                          <span className={`badge ${hitBadge}`}>
                            {e.actionType === "Auto Hit" ? 
                                "Auto Hit"
                              : (e.actionType === "Heal" ? 
                                "Heal"
                              : (e.actionType === "Attack Roll" ?
                                (e.passed ? `HIT ${e.total}` : `MISS ${e.total}`)
                              : (e.actionType === "Save DC" ?
                                (e.passed ? `Save ${e.total}` : `Fail ${e.total}`)
                              : ""))
                            )}
                            <span className="opacity-70">
                              {e.parts} 
                            </span>
                          </span>
                        )}

                        {e.isCrit && (
                          <span className={`badge ${crit}`}>💥 NAT 20</span>
                        )}
                        {e.isFumble && (
                          <span className={`badge ${fumble}`}>❌ NAT 1</span>
                        )}

                        {/* Damage inline on the same line */}
                        {e.damage != null && (
                          <span className={`badge ${dmgBadge}`}>
                            {e.damage < 0 ? `HP ${e.damage*-1}` : `DMG ${e.damage}`}
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

    </section>
  );
}
