// src/components/battle/ActionCard.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { Combatant, Attack, TeamId, LogEntry, AttackState, TargetState } from "../../types";
import { d20, rollDice, RollResult } from "../../lib/dice";
import { saveState } from "../../lib/storage";
import { uid } from "./battleTheme";

type Props = {
  combatants: Combatant[];
  setCombatants: (c: Combatant[]) => void;
  round: number;
  activeId: string | null;
  onLogEntry: (entry: LogEntry) => void;
};

export default function ActionCard({ combatants, setCombatants, round, activeId, onLogEntry }: Props) {

  const pool = useMemo(() => combatants.filter((c) => c.inEncounter), [combatants]);

  // ---- STATES ----
  const [attackState, setAttackState] = useState<AttackState>({ id: null, choice: null, advMode: "normal", bonusInput: "", bonusRoll: null, damageBonusInput: "", damageBonusRoll: null, roll: null, damageRoll: null, passed: null });
  const [targetState, setTargetState] = useState<TargetState>({ id: null, targetId: null, advMode: "normal", bonusInput: "", bonusRoll: null, damageBonusInput: "", damageBonusRoll: null, roll: null });
  const [attackerId, setAttackerId] = useState<string | null>(null);
  const [attackStage, setAttackStage] = useState<1 | 2 | 3>(1);
  const [lastAttackByAttacker, setLastAttackByAttacker] = useState<Record<string, string>>({});
  const [lastTargetByAttacker, setLastTargetByAttacker] = useState<Record<string, string>>({});

  // ---- EFFECTS ----
  useEffect(() => {
    const roll = attackState.bonusInput ? rollDice(attackState.bonusInput) : { total: 0, parts: [] };
    setAttackState((p) => ({ ...p, bonusRoll: roll }));
  }, [attackState.bonusInput]);

  useEffect(() => {
    const roll = targetState.bonusInput ? rollDice(targetState.bonusInput) : { total: 0, parts: [] };
    setTargetState((p) => ({ ...p, bonusRoll: roll }));
  }, [targetState.bonusInput]);

  useEffect(() => {
    const roll = attackState.damageBonusInput ? rollDice(attackState.damageBonusInput) : { total: 0, parts: [] };
    setAttackState((p) => ({ ...p, damageBonusRoll: roll }));
  }, [attackState.damageBonusInput]);

  useEffect(() => {
    const roll = targetState.damageBonusInput ? rollDice(targetState.damageBonusInput) : { total: 0, parts: [] };
    setTargetState((p) => ({ ...p, damageBonusRoll: roll }));
  }, [targetState.damageBonusInput]);

  // ---- LOGIC ----
  function handleAttackRoll() {
    const attack = attackState.choice;
    if (!attack) return;

    if (attack.type !== "Heal" && attack.type !== "Auto Hit") {
      const currentAttackerId = attackerId ?? activeId;
      const atkOwner = pool.find((c) => c.id === currentAttackerId);
      const tgt = pool.find((c) => c.id === targetState.targetId);
      if (!atkOwner || !tgt) return;

      if (attack.type !== "Attack Roll") {
        if (!attack.contested) return;
        const roll = d20(tgt.savingThrows?.[attack.contested], targetState.advMode);
        setTargetState((p) => ({ ...p, roll }));
      } else {
        const roll = d20(attack.hitorDC, attackState.advMode);
        setAttackState((p) => ({ ...p, roll }));
      }
      setAttackStage(2);
    } else {
      const roll: RollResult = { raw: 0, total: 0, parts: [] };
      const dmg = rollDice(attack.damage);
      setAttackState((p) => ({ ...p, roll, damageRoll: dmg, passed: true }));
      setAttackStage(3);
    }
  }

  function handleAttackReroll() {
    const currentAttackerId = attackerId ?? activeId;
    const atkOwner = pool.find((c) => c.id === currentAttackerId);
    if (!atkOwner) return;
    const attack = attackState.choice;
    if (!attack) return;
    const roll = d20(attack.hitorDC, attackState.advMode);
    setAttackState((p) => ({
      ...p,
      roll,
      passed: null,
      damageRoll: null,
      damageBonusInput: "",
    }));
  }

  function handleAttackApply() {
    const currentAttackerId = attackerId ?? activeId;
    const atkOwner = pool.find((c) => c.id === currentAttackerId);
    const tgt = pool.find((c) => c.id === targetState.targetId);
    const attack = attackState.choice;
    if (!atkOwner || !tgt || !attack) return;

    if (attack.type === "Attack Roll") {
      if (!attackState.roll) return;
      const bonusRoll = attackState.bonusRoll ?? { total: 0, parts: [] };
      const finalTotal = (attackState.roll.total ?? 0) + bonusRoll.total;
      const mergedParts = [...(attackState.roll.parts || []), ...(bonusRoll.parts || [])];
      setAttackState((p) => ({
        ...p,
        roll: { ...p.roll, total: finalTotal, parts: mergedParts },
        bonusInput: "",
        passed: finalTotal >= tgt.ac,
      }));
    } else {
      if (!targetState.roll) return;
      const bonusRoll = targetState.bonusRoll ?? { total: 0, parts: [] };
      const finalTotal = (targetState.roll.total ?? 0) + bonusRoll.total;
      const mergedParts = [...(targetState.roll.parts || []), ...(bonusRoll.parts || [])];
      setTargetState((p) => ({
        ...p,
        roll: { total: finalTotal, parts: mergedParts },
        bonusInput: "",
      }));
      setAttackState((p) => ({ ...p, passed: finalTotal >= attack.hitorDC }));
    }
    const dmg = rollDice(attack.damage);
    setAttackState((p) => ({ ...p, damageRoll: dmg }));
    setAttackStage(3);
  }

  function applyDamage(target: Combatant, amount: number) {
    if (typeof amount !== "number") return;
    const next = combatants.map((x) =>
      x.id === target.id ? { ...x, hp: Math.max(0, Math.min(x.maxHp, x.hp - amount)) } : x
    );
    setCombatants(next);
    saveState({ combatants: next, round, activeId });
    const newTgt = next.find((n) => n.id === target.id)!;
    return newTgt.hp;
  }

  function resetCard() {
    setAttackStage(1);
    setAttackState((p) => ({ ...p, roll: null, bonusInput: "", bonusRoll: null, damageRoll: null, damageBonusInput: "", damageBonusRoll: null, passed: null }));
    setTargetState((p) => ({ ...p, roll: null, bonusInput: "", bonusRoll: null, damageBonusInput: "", damageBonusRoll: null }));
  }

  function handleDamageApplyAndLog() {
    const currentAttackerId = attackerId ?? activeId;
    const atkOwner = pool.find((c) => c.id === currentAttackerId);
    const tgt = pool.find((c) => c.id === targetState.targetId);
    const attack = attackState.choice;
    const actionType = attack?.type;
    if (!atkOwner || !tgt || !attack) return;

    let rawDice = 0;
    let finalTotal = 0;
    let parts = "";

    if (actionType !== "Save DC") {
      if (!attackState.roll) return;
      const bonusRoll = attackState.bonusRoll ?? { total: 0, parts: [] };
      finalTotal = (attackState.roll.total ?? 0) + bonusRoll.total;
      rawDice = attackState.roll.raw ?? 0;
      parts = [...(attackState.roll.parts || []), ...(bonusRoll.parts || [])].join("");
    } else {
      if (!targetState.roll) return;
      const bonusRoll = targetState.bonusRoll ?? { total: 0, parts: [] };
      finalTotal = (targetState.roll.total ?? 0) + bonusRoll.total;
      rawDice = targetState.roll.raw ?? 0;
      parts = [...(targetState.roll.parts || []), ...(bonusRoll.parts || [])].join("");
    }

    setLastAttackByAttacker((m) => ({ ...m, [atkOwner.id]: attack.id }));
    setLastTargetByAttacker((m) => ({ ...m, [atkOwner.id]: tgt.id }));

    const bonusDmgRoll =
      actionType === "Save DC"
        ? targetState.damageBonusRoll ?? { total: 0, parts: [] }
        : attackState.damageBonusRoll ?? { total: 0, parts: [] };

    const dmgBase =
      actionType === "Save DC"
        ? !attackState.passed
          ? attackState.damageRoll?.total ?? 0
          : 0
        : attackState.passed
        ? attackState.damageRoll?.total ?? 0
        : 0;

    let finalDamage = dmgBase + bonusDmgRoll.total;
    if (attackState.choice?.type === "Heal") finalDamage *= -1;
    const hpAfter = applyDamage(tgt, finalDamage);
    const died = hpAfter === 0;

    const entry: LogEntry = {
      id: uid(),
      ts: Date.now(),
      attackerId: atkOwner.id,
      attackerName: atkOwner.name,
      attackerTeam: (atkOwner.team ?? 1) as TeamId,
      targetId: tgt.id,
      targetName: tgt.name,
      targetTeam: (tgt.team ?? 1) as TeamId,
      actionType,
      hitorDC: attack.hitorDC,
      raw: rawDice,
      parts,
      total: finalTotal ?? 0,
      passed: !!attackState.passed,
      isCrit: rawDice === 20,
      isFumble: rawDice === 1,
      damage: finalDamage,
      died,
    };
    onLogEntry(entry);
    saveState({ combatants, round, activeId });
    resetCard();
  }

  // ---- When the turn changes ----
  useEffect(() => {
    if (!activeId) return;
    setAttackerId(activeId);
    const attacker = pool.find((c) => c.id === activeId);
    if (attacker) {
      const lastAtk = lastAttackByAttacker[activeId];
      const chosenAtk =
        attacker.attacks.find((a) => a.id === lastAtk) ?? attacker.attacks[0] ?? null;
      setAttackState((p) => ({ ...p, choice: chosenAtk }));

      const lastTgt = lastTargetByAttacker[activeId];
      let chosenTarget = pool.find((c) => c.id === lastTgt)?.id ?? null;

      if (!chosenTarget) {
        const enemy = pool.find(
          (c) => c.id !== activeId && (c.team ?? 1) !== (attacker.team ?? 1)
        );
        chosenTarget = enemy?.id ?? pool.find((c) => c.id !== activeId)?.id ?? null;
      }
      setTargetState((p) => ({ ...p, targetId: chosenTarget }));
    }
  }, [activeId, pool, lastAttackByAttacker, lastTargetByAttacker]);

  function handleCharacterChange(characterId: string | null) {
    setAttackerId(characterId);
    if (characterId) {
      const selectedCharacter = pool.find((c) => c.id === characterId);
      const firstAttack = selectedCharacter?.attacks?.[0];
      setAttackState((p) => ({ ...p, choice: firstAttack || null }));
    } else {
      setAttackState((p) => ({ ...p, choice: null }));
    }
    resetCard();
  }

  // ---- UI ----
  return (
    <div className="card space-y-4 mt-3">
        {/* Header */}
        <div className="flex items-center justify-between h-10">
          <div className="text-lg font-semibold">Action</div>

          <div className="flex items-center gap-3">
            {/* small red back button that steps stage back (UI-only) */}
              <button
                type="button"
                className="btn-red btn-sm"
                disabled={attackStage === 1 ? true : false}
                onClick={() => setAttackStage((s) => (Math.max(1, s - 1) as 1 | 2 | 3))}
                aria-label="back stage"
              >
                &lt;
              </button>

            <div className="text-sm text-slate-400">Step {attackStage} of 3</div>
          </div>
        </div>

        {/* Action container: 3 equal columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl bg-blue-950/30">

          {/* --- LEFT: Character card --- */}
          <div className="p-3 mb-1 rounded-xl flex flex-col justify-between">
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
                <label className="label">Attack</label>
                  <input type="text"className="input w-full mt-2" value={attackState.choice?.name ?? ""} disabled={true}></input>
              </div>
              
              {attackState.choice?.type === "Attack Roll" && (
                <div className="flex gap-2 items-end">
                  <div className="flex flex-col justify-between min-w-20">
                    <label className="label">Extra bonus</label>
                    <input
                      type="text"
                      className="input w-full mt-2"
                      placeholder="Bonus (e.g. +2, 1d4-1)"
                      value={(attackStage === 3 ? attackState.damageBonusInput : attackState.bonusInput) ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (attackStage === 3) setAttackState((p) => ({ ...p, damageBonusInput: v}));
                        else setAttackState((p) => ({ ...p, bonusInput: v}));
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-between">
                    <label className="label">Adv / Dis</label>
                    <button
                      className={`btn btn-sm w-16 text-center mb-0.25 mt-2.5 ${
                        attackState.advMode === "advantage"
                          ? "btn-green"
                          : attackState.advMode === "disadvantage"
                          ? "btn-red"
                          : "btn-normal"
                      }`}
                      onClick={() => {
                        setAttackState((prev) => ({
                          ...prev,
                          advMode:
                            prev.advMode === "normal"
                              ? "advantage"
                              : prev.advMode === "advantage"
                              ? "disadvantage"
                              : "normal"
                      }));
                      }}
                    >
                      {attackState.advMode === "normal" && "--"}
                      {attackState.advMode === "advantage" && "Adv"}
                      {attackState.advMode === "disadvantage" && "Dis"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- MIDDLE: Rolls display (Attack Roll / Damage Roll) --- */}
          <div className="p-3 mb-1 rounded-xl flex flex-col justify-between">
            {/* labels row */}
            <div>
              <label className="label">Action</label>
              <select
                className="select w-full mt-2"
                value={attackState.choice?.id ?? ""}
                onChange={(e) => {
                  resetCard()
                  const selectedId = e.target.value;
                  const attacks = pool.find((c) => c.id === (attackerId ?? activeId))?.attacks ?? [];
                  const selectedAttack = attacks.find(a => a.id === selectedId);
                  if (selectedAttack) {
                    setAttackState((p) => ({ ...p, choice: selectedAttack}));
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
            <div className="flex flex-col mt-2">
              <div className="flex items-center justify-around mt-2">
                {attackState.choice?.type === "Attack Roll" && 
                (<div className="text-xs text-slate-400">Attack Roll</div>)}
                {attackState.choice?.type === "Save DC" && 
                (<div className="text-xs text-slate-400">Saving Roll</div>)}
                {attackState.choice?.type !== "Heal" ? (
                <div className="text-xs text-slate-400">Damage Roll</div>) : (
                <div className="text-xs text-slate-400">HP Roll</div>
                )}
              </div>

              {/* two lines area */}
              <div className="mt-3 space-y-3 rounded-xl bg-slate-950/60 pt-2.5 pb-2.5">
                {/* LINE 1: base expressions (always shown) */}
                <div className="flex items-center justify-around">
                  {/* left: base attack expression */}
                  {attackState.choice?.type !== "Auto Hit" && attackState.choice?.type !== "Heal" && (
                    <div className="text-sm text-slate-200">
                      {attackStage === 1 ? (
                        (() => {
                          const t = pool.find((c) => c.id === (targetState.targetId));
                          const attack = attackState.choice;
                          const toHit = attack?.type === "Attack Roll" 
                            ? attack?.hitorDC ?? 0 
                            : (attack?.contested ? t?.savingThrows?.[attack.contested] ?? 0 : 0);
                          const Extra = attack?.type === "Attack Roll"
                            ? attackState.bonusInput : targetState.bonusInput;
                          return <span>d20{toHit != 0 && (toHit > 0 ? `+${toHit}` : `${toHit}`)}
                          {Extra !== "" && (!Extra.startsWith("+") && !Extra.startsWith("-") ? `+${Extra}` : Extra)}</span>;
                        })()
                      ) : (
                        // stage 2 or 3: show preview or final; include "Hit"/"Miss" prefix in stage 3
                        (() => {
                          if (attackState.choice?.type === "Attack Roll") {
                            const bonusRoll = attackState.bonusRoll ?? { total: 0, parts: [] };
                            const baseTotal = attackState.roll?.total ?? 0;
                            const previewTotal = baseTotal + bonusRoll.total;

                            const parts = [
                              ...(attackState.roll?.parts || []),
                              ...bonusRoll.parts
                            ].join("");
                            const prefix = attackStage === 3 ? (attackState.passed ? "Hit " : "Miss ") : "";
                            return (
                              <span className={`${attackStage === 3 ? (attackState.passed ? "text-green-400 font-semibold" : "text-red-400 font-semibold") : "text-slate-200"}`}>
                                {prefix}{previewTotal ?? "-"} {parts ? `${parts}` : ""}
                              </span>
                            );
                          } else {
                            const bonusRoll = targetState.bonusRoll ?? { total: 0, parts: [] };
                            const baseTotal = targetState.roll?.total ?? 0;
                            const previewTotal = baseTotal + bonusRoll.total;
                            
                            const parts = [
                              ...(targetState.roll?.parts || []),
                              ...bonusRoll.parts
                            ].join("");
                            const prefix = attackStage === 3 ? (attackState.passed ? "Save " : "Fail ") : "";
                            return (
                              <span className={`${attackStage === 3 ? (attackState.passed ? "text-green-400 font-semibold" : "text-red-400 font-semibold") : "text-slate-200"}`}>
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
                        const bonusDmgRoll = attackState.choice?.type !== "Save DC" 
                          ? (attackState.damageBonusRoll ?? { total: 0, parts: [] }) 
                          : (targetState.damageBonusRoll ?? { total: 0, parts: [] })
                        const baseD = attackState.damageRoll?.total ?? 0;
                        const total = baseD + bonusDmgRoll.total;
                        
                        const parts = [
                          ...(attackState.damageRoll?.parts || []),
                          ...(bonusDmgRoll.parts || [])
                        ].join("");
                        return <span>{total} ({parts})</span>;
                      })()
                    ) : (
                      (() => {
                        const a = pool.find((c) => c.id === (attackerId ?? activeId));
                        const attack = attackState.choice;
                        return <span>{attack?.damage ?? "-"}</span>;
                      })()
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* --- RIGHT: Target card --- */}
          <div className="p-3 mb-1 rounded-xl flex flex-col justify-between">
            <div>
              <label className="label">Target</label>
              <select
                className="select w-full mt-2"
                value={targetState.targetId ?? ""}
                onChange={(e) => setTargetState((p) => ({ ...p, targetId: e.target.value || null}))}
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
              {attackState.choice?.type !== "Auto Hit" && attackState.choice?.type !== "Heal" && (
                <div>
                  <label className="label">Contested</label>
                  <input type="text"className="input w-full mt-2" value={attackState.choice ? (`${attackState.choice.contested ?? ""} ${attackState.choice.type === "Save DC" ? "Save" : ""}`) : ""} disabled={true}></input>
                </div>
              )}
              
              {attackState.choice?.type === "Save DC" && (
                <div className="flex gap-2 items-end">
                  <div className="flex flex-col justify-between min-w-20">
                    <label className="label">Extra bonus</label>
                    <input
                      type="text"
                      className="input w-full mt-2"
                      placeholder="Bonus"
                      value={(attackStage === 3 ? targetState.damageBonusInput : targetState.bonusInput) ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (attackStage === 3) setTargetState((p) => ({ ...p, damageBonusInput: v}));
                        else setTargetState((p) => ({ ...p, bonusInput: v}));
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-between">
                    <label className="label">Adv / Dis</label>
                    <button
                      className={`btn btn-sm w-16 text-center mb-0.25 mt-2.5 ${
                        targetState.advMode === "advantage"
                          ? "btn-green"
                          : targetState.advMode === "disadvantage"
                          ? "btn-red"
                          : "btn-normal"
                      }`}
                      onClick={() => {
                        setTargetState((prev) => ({
                          ...prev,
                          advMode:
                            prev.advMode === "normal"
                              ? "advantage"
                              : prev.advMode === "advantage"
                              ? "disadvantage"
                              : "normal"
                      }));
                      }}
                    >
                      {targetState.advMode === "normal" && "--"}
                      {targetState.advMode === "advantage" && "Adv"}
                      {targetState.advMode === "disadvantage" && "Dis"}
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
                className="btn-main"
                onClick={handleAttackRoll}
                disabled={!attackState.choice || !(attackerId ?? activeId) || !targetState.targetId}
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
                className="btn-main"
                onClick={handleAttackApply} /* "Result" applies the extra so it's named Result */
                disabled={!attackState.roll && !targetState.roll}
              >
                See Result
              </button>

              <button
                className="btn-normal"
                onClick={handleAttackReroll}
                disabled={!attackState.roll}
              >
                Reroll
              </button>
            </>
          )}

          {attackStage === 3 && (
            <>
              <button
                className="btn-main"
                onClick={handleDamageApplyAndLog}
                disabled={!attackState.roll && !targetState.roll}
              >
                Apply Action
              </button>

            </>
          )}
        </div>
      </div>
  );
}
