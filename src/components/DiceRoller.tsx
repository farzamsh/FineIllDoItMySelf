// src/components/DiceRoller.tsx
import React, { useState } from 'react';
import { d20, rollDice } from '../lib/dice';

export default function DiceRoller() {
  const [notation, setNotation] = useState('2d6+3');
  const [toHitMod, setToHitMod] = useState(5);
  const [mode, setMode] = useState<'normal' | 'adv' | 'dis'>('normal');
  const [log, setLog] = useState<string[]>([]);

  function pushLog(line: string) {
    setLog(prev => [line, ...prev].slice(0, 100));
  }

  return (
    <section id="dice" className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-lg font-semibold mb-3">🎲 Dice Roller</h2>
      <div className="card flex flex-col gap-4">
        <div className="grid md:grid-cols-3 gap-4">
          {/* To-hit section */}
          <div>
            <label className="label">To-hit (d20 ± mod)</label>
            <div className="flex gap-2">
              <select
                className="select"
                value={mode}
                onChange={e => setMode(e.target.value as any)}
              >
                <option value="normal">normal</option>
                <option value="adv">advantage</option>
                <option value="dis">disadvantage</option>
              </select>
              <input
                className="input w-24"
                type="number"
                value={toHitMod}
                onChange={e =>
                  setToHitMod(parseInt(e.target.value || '0', 10))
                }
              />
              <button
                className="btn"
                onClick={() => {
                  const r = d20(toHitMod, mode);
                  pushLog(
                    `To-hit: ${r.total} ← ${r.parts.filter(Boolean).join(' ')}`
                  );
                }}
              >
                Roll d20
              </button>
            </div>
          </div>

          {/* Damage section */}
          <div>
            <label className="label">Damage notation (e.g., 1d8+3)</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={notation}
                onChange={e => setNotation(e.target.value)}
              />
              <button
                className="btn"
                onClick={() => {
                  const r = rollDice(notation);
                  pushLog(`Damage: ${r.total} ← ${r.parts.join(' ')}`);
                }}
              >
                Roll dmg
              </button>
            </div>
          </div>

          {/* Clear log button */}
          <div className="flex items-end">
            <button className="btn w-full" onClick={() => setLog([])}>
              Clear log
            </button>
          </div>
        </div>

        {/* Log viewer */}
        <div>
          <label className="label">Log</label>
          <div className="card bg-slate-950/60 border-slate-800 min-h-[140px] max-h-72 overflow-auto text-sm">
            {log.length === 0 ? (
              <p className="text-slate-400">No rolls yet…</p>
            ) : (
              <ul className="space-y-1">
                {log.map((l, i) => (
                  <li key={i} className="font-mono">
                    {l}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
