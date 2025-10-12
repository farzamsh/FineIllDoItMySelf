// src/components/battle/BattleLog.tsx
import React, { useEffect, useState } from "react";
import type { LogEntry, LogSettings, TeamId } from "../../types";
import { TEAM_BG, TEAM_TEXT } from "./battleTheme";

type Props = {
  log: LogEntry[];
  setLog: React.Dispatch<React.SetStateAction<LogEntry[]>>;
};

export default function BattleLog({ log, setLog }: Props) {
  // Load + persist settings
  const [settings, setSettings] = useState<LogSettings>(() => {
    try {
      return JSON.parse(localStorage.getItem("LOG_SETTINGS") || "") as LogSettings;
    } catch {
      return { newestFirst: true, compact: false };
    }
  });

  useEffect(() => {
    localStorage.setItem("LOG_SETTINGS", JSON.stringify(settings));
  }, [settings]);

  return (
    <>
      <button className="btn-normal" onClick={() => setLog([])}>
        Clear log
      </button>
    <div className="space-y-2 mt-6">
      <div className="flex items-center justify-between">
        <label className="label">Battle Log</label>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={settings.newestFirst}
              onChange={(e) =>
                setSettings((s) => ({ ...s, newestFirst: e.target.checked }))
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
            {(settings.newestFirst ? [...log] : [...log].reverse()).map((e) => {
              const crit = e.isCrit ? "bg-green-600 text-white" : "";
              const fumble = e.isFumble ? "bg-red-600 text-white" : "";
              const hitBadge = e.passed
                ? e.actionType === "Heal"
                  ? `bg-emerald-950 text-emerald-300`
                  : `bg-green-800 text-green-200`
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
                        {e.actionType === "Auto Hit"
                          ? "Auto Hit"
                          : e.actionType === "Heal"
                          ? "Heal"
                          : e.actionType === "Attack Roll"
                          ? e.passed
                            ? `HIT ${e.total}`
                            : `MISS ${e.total}`
                          : e.actionType === "Save DC"
                          ? e.passed
                            ? `Save ${e.total}`
                            : `Fail ${e.total}`
                          : ""}
                        <span className="opacity-70">{e.parts}</span>
                      </span>
                    )}

                    {e.isCrit && (
                      <span className={`badge ${crit}`}>💥 NAT 20</span>
                    )}
                    {e.isFumble && (
                      <span className={`badge ${fumble}`}>❌ NAT 1</span>
                    )}

                    {/* Damage inline */}
                    {e.damage != null && e.damage !== 0 && (
                      <span className={`badge ${dmgBadge}`}>
                        {e.damage < 0
                          ? `HP ${e.damage * -1}`
                          : `DMG ${e.damage}`}
                      </span>
                    )}

                    {/* KO */}
                    {e.died && (
                      <span className={`badge ${koBadge}`}>☠ K.O.</span>
                    )}

                    {/* Timestamp */}
                    <span
                      className={`ml-auto text-xs ${
                        TEAM_TEXT[e.attackerTeam]
                      } opacity-70`}
                    >
                      {new Date(e.ts).toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
    </>
  );
}
